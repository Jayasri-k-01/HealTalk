import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

export function useWebRTC({
  appointmentId,
  user,
  onConsultationEnded,
}) {
  const [connectionStatus, setConnectionStatus] = useState("INITIALIZING"); // INITIALIZING, WAITING_FOR_PEER, CONNECTING, CONNECTED, DISCONNECTED, ENDED, ERROR
  const [statusMessage, setStatusMessage] = useState("Initializing media devices and connection...");
  const [errorMessage, setErrorMessage] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);

  const [localStream, setLocalStream] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  // Multi-peer remote participants array:
  // [{ socketId, peerInfo, stream, role, userName, isVideoEnabled, isAudioEnabled, hasVideoTrack, hasAudioTrack, lastUpdated }]
  const [remotePeers, setRemotePeers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);

  // Multi-peer maps
  const peerConnectionsRef = useRef(new Map()); // socketId -> RTCPeerConnection
  const iceQueuesRef = useRef(new Map()); // socketId -> candidate[]
  const peerInfoMapRef = useRef(new Map()); // socketId -> peerInfo
  const remoteStreamsRef = useRef(new Map()); // socketId -> MediaStream

  // Normalize appointmentId to string
  const normalizedAppointmentId = appointmentId ? String(appointmentId) : "";

  // Helper to safely bind local video stream to DOM video element
  const bindLocalVideo = useCallback(() => {
    if (localVideoRef.current && localStreamRef.current) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      localVideoRef.current.muted = true; // Avoid acoustic feedback
      localVideoRef.current.playsInline = true;
      localVideoRef.current.play().catch((err) => {
        console.warn("[WebRTC] Autoplay local video blocked or error:", err);
      });
    }
  }, []);

  // Helper to safely bind primary remote video stream to DOM video element (1-on-1 backward compatibility)
  const bindRemoteVideo = useCallback((stream) => {
    if (remoteVideoRef.current && stream) {
      if (remoteVideoRef.current.srcObject !== stream) {
        remoteVideoRef.current.srcObject = stream;
      }
      remoteVideoRef.current.playsInline = true;
      remoteVideoRef.current.play().catch((err) => {
        console.warn("[WebRTC] Autoplay primary remote video error:", err);
        if (err.name === "NotAllowedError") {
          // Attempt muted autoplay fallback on strict mobile browsers
          remoteVideoRef.current.muted = true;
          remoteVideoRef.current.play().catch((e) => console.warn("[WebRTC] Muted fallback also blocked:", e));
        }
      });
    }
  }, []);

  // Get or create RTCPeerConnection for a specific peer
  const getOrCreatePeerConnection = useCallback((targetSocketId, targetPeerInfo) => {
    if (targetPeerInfo) {
      peerInfoMapRef.current.set(targetSocketId, targetPeerInfo);
    }

    if (peerConnectionsRef.current.has(targetSocketId)) {
      const existingPc = peerConnectionsRef.current.get(targetSocketId);
      if (existingPc && existingPc.signalingState !== "closed") {
        // Ensure all local media tracks are attached to this peer connection
        if (localStreamRef.current) {
          const senders = existingPc.getSenders();
          localStreamRef.current.getTracks().forEach((track) => {
            const hasSender = senders.some((s) => s.track && s.track.id === track.id);
            if (!hasSender) {
              try {
                existingPc.addTrack(track, localStreamRef.current);
                console.log(`[WebRTC] Added missing local track (${track.kind}) to existing pc for ${targetSocketId}`);
              } catch (e) {
                console.warn(`[WebRTC] Error adding track to existing pc for ${targetSocketId}:`, e);
              }
            }
          });
        }
        return existingPc;
      }
    }

    console.log(`[WebRTC] Creating new RTCPeerConnection for ${targetSocketId} (${targetPeerInfo?.role || "peer"}, ${targetPeerInfo?.userName || "Participant"})`);
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(targetSocketId, pc);

    // Add local media tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, localStreamRef.current);
          console.log(`[WebRTC] Added local track (${track.kind}) to pc for ${targetSocketId}`);
        } catch (e) {
          console.warn(`[WebRTC] Error adding track to pc for ${targetSocketId}:`, e);
        }
      });
    }

    // ICE Candidate event
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("signal-ice-candidate", {
          targetSocketId,
          candidate: event.candidate,
        });
      }
    };

    // Remote Track received
    pc.ontrack = (event) => {
      console.log(`[WebRTC] pc.ontrack received from ${targetSocketId} (${targetPeerInfo?.role || "peer"}), track: ${event.track?.kind}`);

      let stream = (event.streams && event.streams[0]) || null;
      if (!stream) {
        let existingStream = remoteStreamsRef.current.get(targetSocketId);
        if (!existingStream) {
          existingStream = new MediaStream();
          remoteStreamsRef.current.set(targetSocketId, existingStream);
        }
        if (event.track) {
          // Check if track already in existingStream
          if (!existingStream.getTracks().some((t) => t.id === event.track.id)) {
            existingStream.addTrack(event.track);
          }
        }
        stream = existingStream;
      } else {
        remoteStreamsRef.current.set(targetSocketId, stream);
      }

      const peerInfo = peerInfoMapRef.current.get(targetSocketId) || targetPeerInfo;
      const targetRole = peerInfo?.role || targetPeerInfo?.role;
      const targetName = peerInfo?.userName || targetPeerInfo?.userName;

      // Create a fresh MediaStream snapshot with all current tracks so React detects state updates
      const streamSnapshot = new MediaStream(stream.getTracks());

      setRemotePeers((prev) => {
        // Deduplicate by socketId or role for single-seat roles (doctor, patient, interpreter)
        const index = prev.findIndex(
          (p) => p.socketId === targetSocketId || (targetRole && p.role === targetRole)
        );

        const updatedPeer = {
          socketId: targetSocketId,
          peerInfo: peerInfo || (index >= 0 ? prev[index].peerInfo : null),
          stream: streamSnapshot,
          role: targetRole || (index >= 0 ? prev[index].role : "participant"),
          userName: targetName || (index >= 0 ? prev[index].userName : "Participant"),
          isVideoEnabled: peerInfo?.isVideoEnabled !== false,
          isAudioEnabled: peerInfo?.isAudioEnabled !== false,
          hasVideoTrack: streamSnapshot.getVideoTracks().length > 0,
          hasAudioTrack: streamSnapshot.getAudioTracks().length > 0,
          lastUpdated: Date.now(),
        };

        if (index >= 0) {
          const next = [...prev];
          next[index] = updatedPeer;
          return next;
        }
        return [...prev, updatedPeer];
      });

      // Maintain primary remote stream binding
      bindRemoteVideo(streamSnapshot);
      setConnectionStatus("CONNECTED");
      setStatusMessage("Video consultation connected (Encrypted)");
    };

    // Connection state change
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`[WebRTC] Connection state with ${targetSocketId} (${targetPeerInfo?.role || "peer"}): ${state}`);
      if (state === "connected") {
        setConnectionStatus("CONNECTED");
        setStatusMessage("Video consultation connected (Encrypted)");
      } else if (state === "disconnected") {
        console.log(`[WebRTC] Peer ${targetSocketId} temporarily disconnected`);
      } else if (state === "failed") {
        console.warn(`[WebRTC] Connection failed with ${targetSocketId}. Attempting ICE restart...`);
        if (typeof pc.restartIce === "function") {
          try {
            pc.restartIce();
          } catch (e) {
            console.warn("[WebRTC] restartIce error:", e);
          }
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log(`[WebRTC] ICE state with ${targetSocketId}: ${state}`);
      if (state === "connected" || state === "completed") {
        setConnectionStatus("CONNECTED");
      }
    };

    return pc;
  }, [bindRemoteVideo]);

  // Initiate call to a target peer (Caller)
  const initiateOffer = useCallback(async (targetSocketId, targetPeerInfo) => {
    try {
      console.log(`[WebRTC] initiateOffer -> target ${targetSocketId} (${targetPeerInfo?.role}, ${targetPeerInfo?.userName})`);
      const pc = getOrCreatePeerConnection(targetSocketId, targetPeerInfo);

      // Only initiate offer if connection is stable and not in another negotiation
      if (pc.signalingState !== "stable") {
        console.log(`[WebRTC] Skipping initiateOffer because pc with ${targetSocketId} is in state ${pc.signalingState}`);
        return;
      }

      setConnectionStatus("CONNECTING");
      setStatusMessage(`Initiating encrypted connection to ${targetPeerInfo?.userName || "peer"}...`);

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      if (pc.signalingState !== "stable") {
        console.warn(`[WebRTC] Aborting setLocalDescription: state changed to ${pc.signalingState}`);
        return;
      }

      await pc.setLocalDescription(offer);

      if (socketRef.current) {
        socketRef.current.emit("signal-offer", {
          targetSocketId,
          offer,
        });
      }
    } catch (err) {
      console.error(`[WebRTC] Error creating WebRTC offer for ${targetSocketId}:`, err);
      if (!err.message?.includes("wrong state")) {
        setErrorMessage("Failed to initiate video stream: " + err.message);
      }
    }
  }, [getOrCreatePeerConnection]);

  // Setup Local Media (Camera & Mic)
  const setupLocalMedia = useCallback(async () => {
    setPermissionDenied(false);
    setErrorMessage("");

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        console.warn("[WebRTC] navigator.mediaDevices.getUserMedia is unavailable on this browser or origin");
        setErrorMessage(
          "Camera and microphone access is unavailable. On mobile devices, browsers require a secure origin (HTTPS or localhost)."
        );
        setConnectionStatus("ERROR");
        return null;
      }

      let stream = null;

      // Stage 1: Try ideal resolution constraints
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode: "user",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (firstErr) {
        console.warn("[WebRTC] Ideal 720p constraints failed, trying basic { video: true, audio: true }:", firstErr);
        // Stage 2: Fallback to basic video+audio (resolves mobile aspect ratio errors)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        } catch (secondErr) {
          console.warn("[WebRTC] Video capture failed completely, falling back to audio-only:", secondErr);
          // Stage 3: Audio only fallback
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          setIsCameraOn(false);
        }
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      bindLocalVideo();

      // If any RTCPeerConnections were already created, attach/replace tracks
      peerConnectionsRef.current.forEach((pc, targetId) => {
        const senders = pc.getSenders();
        stream.getTracks().forEach((track) => {
          const sender = senders.find((s) => s.track && s.track.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track).catch((e) => console.warn(`[WebRTC] replaceTrack error for ${targetId}:`, e));
          } else {
            try {
              pc.addTrack(track, stream);
            } catch (e) {
              console.warn(`[WebRTC] addTrack error for ${targetId}:`, e);
            }
          }
        });
      });

      return stream;
    } catch (err) {
      console.error("[WebRTC] getUserMedia error:", err);
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError" ||
        err.message?.includes("Permission")
      ) {
        setPermissionDenied(true);
        setErrorMessage(
          "Camera/Microphone permission denied. Please allow camera and microphone permissions in your browser to start the video consultation."
        );
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMessage("No camera or microphone found on your device.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setErrorMessage(
          "Camera or microphone is currently in use by another application or tab."
        );
      } else {
        setErrorMessage(err.message || "Failed to access camera and microphone.");
      }
      setConnectionStatus("ERROR");
      return null;
    }
  }, [bindLocalVideo]);

  // Clean up media and WebRTC connections
  const cleanupConnection = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn("[WebRTC] Error stopping track:", e);
        }
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }

    peerConnectionsRef.current.forEach((pc, sockId) => {
      try {
        pc.close();
      } catch (e) {
        console.warn(`[WebRTC] Error closing pc for ${sockId}:`, e);
      }
    });
    peerConnectionsRef.current.clear();
    iceQueuesRef.current.clear();
    peerInfoMapRef.current.clear();
    remoteStreamsRef.current.clear();

    if (socketRef.current) {
      try {
        socketRef.current.emit("leave-consultation");
        socketRef.current.disconnect();
      } catch (e) {
        console.warn("[WebRTC] Error disconnecting socket:", e);
      }
      socketRef.current = null;
    }

    setRemotePeers([]);
  }, []);

  // Connect to Socket.IO and join consultation room
  const startConsultation = useCallback(async () => {
    if (!normalizedAppointmentId) return;

    setConnectionStatus("INITIALIZING");
    setStatusMessage("Connecting to HealTalk telehealth signaling server...");

    const stream = await setupLocalMedia();
    if (!stream && permissionDenied) {
      return;
    }

    const token = localStorage.getItem("healtalk_token");
    if (!token) {
      setErrorMessage("Authentication required. Please log in.");
      setConnectionStatus("ERROR");
      return;
    }

    // Connect socket (defaults to VITE_SOCKET_URL, or derives from VITE_API_URL, or current host)
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
        : undefined);
    const socket = io(socketUrl, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`[WebRTC Client] Socket connected: ${socket.id} for room appointment_${normalizedAppointmentId}`);
      setStatusMessage("Joining consultation room...");

      socket.emit(
        "join-consultation",
        {
          appointmentId: normalizedAppointmentId,
          token,
          role: user?.role || "patient",
          userName: user?.name || "Participant",
        },
        (response) => {
          if (!response || !response.success) {
            setErrorMessage(response?.message || "Failed to join consultation room");
            setConnectionStatus("ERROR");
          }
        }
      );
    });

    // Room joined callback
    socket.on("consultation-joined", ({ existingPeers, appointment }) => {
      console.log("[WebRTC Client] consultation-joined event:", { existingPeers, appointment });

      if (existingPeers && existingPeers.length > 0) {
        // Register all existing peers and initiate offers to all of them
        existingPeers.forEach((peer) => {
          peerInfoMapRef.current.set(peer.socketId, peer);

          setRemotePeers((prev) => {
            const index = prev.findIndex(
              (p) => p.socketId === peer.socketId || (peer.role && p.role === peer.role)
            );
            const peerItem = {
              socketId: peer.socketId,
              peerInfo: peer,
              stream: index >= 0 ? prev[index].stream : null,
              role: peer.role,
              userName: peer.userName,
              isVideoEnabled: peer.isVideoEnabled !== false,
              isAudioEnabled: peer.isAudioEnabled !== false,
              hasVideoTrack: false,
              hasAudioTrack: false,
              lastUpdated: Date.now(),
            };

            if (index >= 0) {
              const updated = [...prev];
              updated[index] = peerItem;
              return updated;
            }
            return [...prev, peerItem];
          });

          // Joiner initiates WebRTC offer to this existing peer
          initiateOffer(peer.socketId, peer);
        });
      } else {
        setConnectionStatus("WAITING_FOR_PEER");
        const waitingFor =
          user?.role === "doctor"
            ? "patient and interpreter"
            : user?.role === "interpreter"
            ? "doctor and patient"
            : "doctor";
        setStatusMessage(`Waiting for ${waitingFor} to enter the consultation room...`);
      }
    });

    // Another peer entered the room
    socket.on("peer-joined", (newPeer) => {
      console.log("[WebRTC Client] peer-joined event:", newPeer);
      peerInfoMapRef.current.set(newPeer.socketId, newPeer);

      setRemotePeers((prev) => {
        const index = prev.findIndex(
          (p) => p.socketId === newPeer.socketId || (newPeer.role && p.role === newPeer.role)
        );
        const peerItem = {
          socketId: newPeer.socketId,
          peerInfo: newPeer,
          stream: index >= 0 ? prev[index].stream : null,
          role: newPeer.role,
          userName: newPeer.userName,
          isVideoEnabled: newPeer.isVideoEnabled !== false,
          isAudioEnabled: newPeer.isAudioEnabled !== false,
          hasVideoTrack: false,
          hasAudioTrack: false,
          lastUpdated: Date.now(),
        };

        if (index >= 0) {
          const updated = [...prev];
          updated[index] = peerItem;
          return updated;
        }
        return [...prev, peerItem];
      });

      setConnectionStatus("CONNECTING");
      setStatusMessage(`${newPeer.userName} (${newPeer.role}) entered the room...`);
    });

    // Handling incoming WebRTC offer
    socket.on("signal-offer", async ({ senderSocketId, senderInfo, offer }) => {
      console.log(`[WebRTC Client] Received signal-offer from ${senderSocketId} (${senderInfo?.role}, ${senderInfo?.userName})`);
      try {
        if (senderInfo) {
          peerInfoMapRef.current.set(senderSocketId, senderInfo);

          setRemotePeers((prev) => {
            const index = prev.findIndex(
              (p) => p.socketId === senderSocketId || (senderInfo.role && p.role === senderInfo.role)
            );
            const peerItem = {
              socketId: senderSocketId,
              peerInfo: senderInfo,
              stream: index >= 0 ? prev[index].stream : null,
              role: senderInfo.role,
              userName: senderInfo.userName,
              isVideoEnabled: senderInfo.isVideoEnabled !== false,
              isAudioEnabled: senderInfo.isAudioEnabled !== false,
              hasVideoTrack: index >= 0 ? prev[index].hasVideoTrack : false,
              hasAudioTrack: index >= 0 ? prev[index].hasAudioTrack : false,
              lastUpdated: Date.now(),
            };

            if (index >= 0) {
              const updated = [...prev];
              updated[index] = peerItem;
              return updated;
            }
            return [...prev, peerItem];
          });
        }

        setConnectionStatus("CONNECTING");
        setStatusMessage(`Connecting stream with ${senderInfo?.userName || "peer"}...`);

        const pc = getOrCreatePeerConnection(senderSocketId, senderInfo);

        // WebRTC Glare / collision handling:
        const isCollision =
          offer?.type === "offer" &&
          (pc.signalingState === "have-local-offer" || pc.signalingState !== "stable");

        const isPolite = socket.id ? socket.id < senderSocketId : true;

        if (isCollision) {
          if (!isPolite) {
            console.log(`[WebRTC] Glare collision with ${senderSocketId}. Impolite peer ignoring incoming offer.`);
            return;
          }
          console.log(`[WebRTC] Glare collision with ${senderSocketId}. Polite peer rolling back local offer.`);
          try {
            await pc.setLocalDescription({ type: "rollback" });
          } catch (rbErr) {
            console.warn("[WebRTC] Rollback notice:", rbErr);
          }
        }

        if (pc.signalingState !== "stable" && pc.signalingState !== "have-local-offer") {
          console.warn(`[WebRTC] Ignoring signal-offer in state: ${pc.signalingState}`);
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Drain any queued ICE candidates for this sender
        const queue = iceQueuesRef.current.get(senderSocketId) || [];
        while (queue.length > 0) {
          const candidate = queue.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn("[WebRTC] Error adding queued candidate:", e);
          }
        }

        // Only create answer if signalingState is now have-remote-offer
        if (pc.signalingState === "have-remote-offer") {
          const answer = await pc.createAnswer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pc.setLocalDescription(answer);

          socket.emit("signal-answer", {
            targetSocketId: senderSocketId,
            answer,
          });
        }
      } catch (err) {
        console.error("[WebRTC] Error handling signal-offer:", err);
        if (!err.message?.includes("wrong state")) {
          setErrorMessage("Failed to establish video connection: " + err.message);
        }
      }
    });

    // Handling incoming WebRTC answer
    socket.on("signal-answer", async ({ senderSocketId, senderInfo, answer }) => {
      console.log(`[WebRTC Client] Received signal-answer from ${senderSocketId}`);
      try {
        if (senderInfo) {
          peerInfoMapRef.current.set(senderSocketId, senderInfo);
        }
        const pc = peerConnectionsRef.current.get(senderSocketId);
        if (pc) {
          if (pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));

            // Drain queued candidates for this sender
            const queue = iceQueuesRef.current.get(senderSocketId) || [];
            while (queue.length > 0) {
              const candidate = queue.shift();
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.warn("[WebRTC] Error adding queued candidate:", e);
              }
            }
          } else {
            console.log(`[WebRTC] Ignoring signal-answer because signalingState is ${pc.signalingState}`);
          }
        }
      } catch (err) {
        console.error("[WebRTC] Error setting remote description from answer:", err);
      }
    });

    // Handling incoming ICE candidates
    socket.on("signal-ice-candidate", async ({ senderSocketId, candidate }) => {
      try {
        const pc = peerConnectionsRef.current.get(senderSocketId);
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          if (!iceQueuesRef.current.has(senderSocketId)) {
            iceQueuesRef.current.set(senderSocketId, []);
          }
          iceQueuesRef.current.get(senderSocketId).push(candidate);
        }
      } catch (err) {
        console.warn("[WebRTC] Error adding ice candidate:", err);
      }
    });

    // Remote peer toggled audio/video
    socket.on("peer-media-toggled", ({ socketId: targetSockId, type, enabled }) => {
      setRemotePeers((prev) =>
        prev.map((p) => {
          if (p.socketId === targetSockId) {
            return {
              ...p,
              [type === "video" ? "isVideoEnabled" : "isAudioEnabled"]: enabled,
            };
          }
          return p;
        })
      );
    });

    // In-room live chat message received
    socket.on("chat-message-received", (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    // Peer left room
    socket.on("peer-left", ({ socketId: leftSockId, userName, role }) => {
      console.log(`[WebRTC Client] Peer left: ${userName} (${role}, ${leftSockId})`);

      const pc = peerConnectionsRef.current.get(leftSockId);
      if (pc) {
        try {
          pc.close();
        } catch (e) {
          console.warn("[WebRTC] Error closing pc on peer-left:", e);
        }
        peerConnectionsRef.current.delete(leftSockId);
      }
      iceQueuesRef.current.delete(leftSockId);
      peerInfoMapRef.current.delete(leftSockId);
      remoteStreamsRef.current.delete(leftSockId);

      setRemotePeers((prev) => {
        const remaining = prev.filter((p) => p.socketId !== leftSockId);
        if (remaining.length === 0) {
          setConnectionStatus("WAITING_FOR_PEER");
          setStatusMessage(`${userName || "Peer"} has left the consultation.`);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
        }
        return remaining;
      });
    });

    // Consultation ended by doctor or patient
    socket.on("consultation-ended", ({ endedBy, endedByName }) => {
      console.log(`[WebRTC Client] Consultation ended by ${endedByName} (${endedBy})`);
      cleanupConnection();
      setConnectionStatus("ENDED");
      setStatusMessage(`Consultation was ended by ${endedByName || endedBy}.`);
      if (onConsultationEnded) {
        onConsultationEnded({ endedBy, endedByName });
      }
    });

    socket.on("consultation-error", ({ message }) => {
      console.warn("[WebRTC Client] consultation-error:", message);
      setErrorMessage(message || "Consultation connection error");
      setConnectionStatus("ERROR");
    });

    socket.on("connect_error", (err) => {
      console.error("[WebRTC Client] Socket connect error:", err);
      setErrorMessage("Could not connect to telehealth signaling server.");
      setConnectionStatus("ERROR");
    });
  }, [
    normalizedAppointmentId,
    user,
    setupLocalMedia,
    permissionDenied,
    initiateOffer,
    getOrCreatePeerConnection,
    cleanupConnection,
    onConsultationEnded,
  ]);

  // Toggle Microphone
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !isMicOn;
        audioTracks.forEach((t) => (t.enabled = nextState));
        setIsMicOn(nextState);

        if (socketRef.current) {
          socketRef.current.emit("toggle-media", {
            type: "audio",
            enabled: nextState,
          });
        }
      }
    }
  }, [isMicOn]);

  // Toggle Camera
  const toggleCamera = useCallback(async () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextState = !isCameraOn;
        videoTracks.forEach((t) => (t.enabled = nextState));
        setIsCameraOn(nextState);

        if (socketRef.current) {
          socketRef.current.emit("toggle-media", {
            type: "video",
            enabled: nextState,
          });
        }
      } else {
        // Stream had no video track (e.g. initial fallback occurred)
        try {
          if (navigator?.mediaDevices?.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 1280, max: 1920 },
                height: { ideal: 720, max: 1080 },
                facingMode: "user",
              },
            });
            const newTrack = stream.getVideoTracks()[0];
            if (newTrack) {
              localStreamRef.current.addTrack(newTrack);
              peerConnectionsRef.current.forEach((pc) => {
                const senders = pc.getSenders();
                const vSender = senders.find((s) => s.track && s.track.kind === "video");
                if (vSender) {
                  vSender.replaceTrack(newTrack).catch((e) => console.warn("[WebRTC] replaceTrack error:", e));
                } else {
                  try {
                    pc.addTrack(newTrack, localStreamRef.current);
                  } catch (e) {
                    console.warn("[WebRTC] addTrack error:", e);
                  }
                }
              });
              setIsCameraOn(true);
              bindLocalVideo();
              if (socketRef.current) {
                socketRef.current.emit("toggle-media", {
                  type: "video",
                  enabled: true,
                });
              }
            }
          }
        } catch (camErr) {
          console.warn("[WebRTC] Camera could not be activated:", camErr);
          setErrorMessage(
            camErr.name === "NotReadableError" || camErr.name === "TrackStartError"
              ? "Your camera is currently in use by another browser or tab. On Windows, only one application can use the webcam at a time."
              : "Could not activate camera: " + camErr.message
          );
        }
      }
    }
  }, [isCameraOn, bindLocalVideo]);

  // Send in-session chat message
  const sendChatMessage = useCallback((text) => {
    if (!text || !text.trim() || !socketRef.current) return;
    socketRef.current.emit("send-chat-message", { text: text.trim() });
  }, []);

  // End consultation
  const endConsultation = useCallback((notes = "") => {
    if (socketRef.current && normalizedAppointmentId) {
      socketRef.current.emit("end-consultation", { appointmentId: normalizedAppointmentId, notes });
    }
    cleanupConnection();
    setConnectionStatus("ENDED");
    setStatusMessage("Consultation ended.");
  }, [normalizedAppointmentId, cleanupConnection]);

  // Leave consultation
  const leaveConsultation = useCallback(() => {
    cleanupConnection();
    setConnectionStatus("ENDED");
    setStatusMessage("You left the consultation.");
  }, [cleanupConnection]);

  // Auto connect when normalizedAppointmentId is provided
  useEffect(() => {
    if (normalizedAppointmentId) {
      startConsultation();
    }
    return () => {
      cleanupConnection();
    };
  }, [normalizedAppointmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Compatibility helpers for 1-on-1 calls
  const primaryRemotePeer = remotePeers.length > 0 ? remotePeers[0] : null;
  const remoteStream = primaryRemotePeer?.stream || null;
  const peerInfo = primaryRemotePeer?.peerInfo || null;
  const remoteMediaState = {
    isVideoEnabled: primaryRemotePeer?.isVideoEnabled !== false,
    isAudioEnabled: primaryRemotePeer?.isAudioEnabled !== false,
  };

  // Bind video element whenever localStream changes
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      bindLocalVideo();
    }
  }, [localStream, bindLocalVideo]);

  // Bind primary remote video element whenever remoteStream changes (1-on-1 calls)
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      bindRemoteVideo(remoteStream);
    }
  }, [remoteStream, bindRemoteVideo]);

  return {
    connectionStatus,
    statusMessage,
    errorMessage,
    permissionDenied,
    localStream,
    remoteStream,
    remotePeers, // Array of all connected remote peers for 3-way calls
    isMicOn,
    isCameraOn,
    peerInfo,
    remoteMediaState,
    chatMessages,
    localVideoRef,
    remoteVideoRef,
    toggleMic,
    toggleCamera,
    sendChatMessage,
    endConsultation,
    leaveConsultation,
    retryConnection: startConsultation,
  };
}

export default useWebRTC;
