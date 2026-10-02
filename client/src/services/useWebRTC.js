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
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  const [peerInfo, setPeerInfo] = useState(null);
  const [remoteMediaState, setRemoteMediaState] = useState({
    isVideoEnabled: true,
    isAudioEnabled: true,
  });

  const [chatMessages, setChatMessages] = useState([]);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const iceCandidatesQueue = useRef([]);
  const localStreamRef = useRef(null);
  const targetSocketIdRef = useRef(null);

  // Helper to safely bind local video stream to DOM video element
  const bindLocalVideo = useCallback(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.muted = true; // Avoid feedback
      localVideoRef.current.play().catch((err) => {
        console.warn("Autoplay local video blocked or error:", err);
      });
    }
  }, []);

  // Helper to safely bind remote video stream to DOM video element
  const bindRemoteVideo = useCallback((stream) => {
    if (remoteVideoRef.current && stream) {
      remoteVideoRef.current.srcObject = stream;
      remoteVideoRef.current.play().catch((err) => {
        console.warn("Autoplay remote video blocked or error:", err);
      });
    }
  }, []);

  // Create WebRTC Peer Connection
  const createPeerConnection = useCallback((targetSocketId) => {
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (e) {
        console.warn("Error closing previous pc:", e);
      }
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;
    targetSocketIdRef.current = targetSocketId;

    // Add local media tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // ICE Candidate event
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && targetSocketIdRef.current) {
        socketRef.current.emit("signal-ice-candidate", {
          targetSocketId: targetSocketIdRef.current,
          candidate: event.candidate,
        });
      }
    };

    // Remote Track received
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        setRemoteStream(stream);
        bindRemoteVideo(stream);
        setConnectionStatus("CONNECTED");
        setStatusMessage("Video consultation connected (Encrypted)");
      }
    };

    // Connection state change
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`[WebRTC] Connection state changed: ${state}`);
      if (state === "connected") {
        setConnectionStatus("CONNECTED");
        setStatusMessage("Video consultation connected (Encrypted)");
      } else if (state === "disconnected") {
        setConnectionStatus("DISCONNECTED");
        setStatusMessage("Peer disconnected. Waiting for reconnection...");
      } else if (state === "failed") {
        setConnectionStatus("ERROR");
        setStatusMessage("WebRTC connection failed. Reconnecting...");
        // Attempt ICE restart or reconnection
        tryRestartPeer(targetSocketIdRef.current);
      } else if (state === "closed") {
        setConnectionStatus("ENDED");
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log(`[WebRTC] ICE connection state: ${state}`);
      if (state === "connected" || state === "completed") {
        setConnectionStatus("CONNECTED");
        setStatusMessage("Video consultation connected (Encrypted)");
      } else if (state === "disconnected") {
        setConnectionStatus("DISCONNECTED");
        setStatusMessage("Temporary network fluctuation detected...");
      } else if (state === "failed") {
        setConnectionStatus("ERROR");
        setStatusMessage("Network connection interrupted. Retrying...");
      }
    };

    return pc;
  }, [bindRemoteVideo]);

  // Initiate call to a target peer (Caller)
  const initiateOffer = useCallback(async (targetSocketId) => {
    try {
      setConnectionStatus("CONNECTING");
      setStatusMessage("Initiating encrypted WebRTC handshake...");
      const pc = createPeerConnection(targetSocketId);

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await pc.setLocalDescription(offer);

      if (socketRef.current) {
        socketRef.current.emit("signal-offer", {
          targetSocketId,
          offer,
        });
      }
    } catch (err) {
      console.error("Error creating WebRTC offer:", err);
      setErrorMessage("Failed to initiate video stream: " + err.message);
    }
  }, [createPeerConnection]);

  // Restart peer connection if dropped
  const tryRestartPeer = useCallback(async (targetSocketId) => {
    if (!targetSocketId || !localStreamRef.current) return;
    try {
      const pc = createPeerConnection(targetSocketId);
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      if (socketRef.current) {
        socketRef.current.emit("signal-offer", {
          targetSocketId,
          offer,
        });
      }
    } catch (err) {
      console.warn("ICE restart failed:", err);
    }
  }, [createPeerConnection]);

  // Setup Local Media (Camera & Mic)
  const setupLocalMedia = useCallback(async () => {
    setPermissionDenied(false);
    setErrorMessage("");

    try {
      // First try requesting video and audio
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (videoError) {
        console.warn("Video + Audio capture failed, trying audio-only fallback:", videoError);
        // Fallback to audio only if camera is not found or in use
        stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        setIsCameraOn(false);
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      bindLocalVideo();

      return stream;
    } catch (err) {
      console.error("getUserMedia error:", err);
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

  // Connect to Socket.IO and join consultation room
  const startConsultation = useCallback(async () => {
    if (!appointmentId) return;

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

    // Connect socket
    const socket = io({
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`[WebRTC Client] Socket connected: ${socket.id}`);
      setStatusMessage("Joining consultation room...");

      socket.emit(
        "join-consultation",
        {
          appointmentId,
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
        const peer = existingPeers[0];
        setPeerInfo(peer);
        setRemoteMediaState({
          isVideoEnabled: peer.isVideoEnabled !== false,
          isAudioEnabled: peer.isAudioEnabled !== false,
        });

        // We are the joiner, initiate offer to existing peer
        initiateOffer(peer.socketId);
      } else {
        setConnectionStatus("WAITING_FOR_PEER");
        const waitingFor =
          user?.role === "doctor" ? "patient" : "doctor";
        setStatusMessage(
          `Waiting for ${waitingFor} to enter the consultation room...`
        );
      }
    });

    // Another peer entered the room
    socket.on("peer-joined", (newPeer) => {
      console.log("[WebRTC Client] peer-joined event:", newPeer);
      setPeerInfo(newPeer);
      setRemoteMediaState({
        isVideoEnabled: newPeer.isVideoEnabled !== false,
        isAudioEnabled: newPeer.isAudioEnabled !== false,
      });
      setConnectionStatus("CONNECTING");
      setStatusMessage(`Connecting stream with ${newPeer.userName}...`);
      // Target socket id set; new peer will send an offer, or we can handle offer
      targetSocketIdRef.current = newPeer.socketId;
    });

    // Handling incoming WebRTC offer
    socket.on("signal-offer", async ({ senderSocketId, senderInfo, offer }) => {
      console.log("[WebRTC Client] Received signal-offer from", senderSocketId);
      try {
        if (senderInfo) setPeerInfo(senderInfo);
        setConnectionStatus("CONNECTING");
        setStatusMessage("Establishing encrypted video channel...");

        const pc = createPeerConnection(senderSocketId);

        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Drain any queued ICE candidates
        while (iceCandidatesQueue.current.length > 0) {
          const candidate = iceCandidatesQueue.current.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn("Error adding queued candidate:", e);
          }
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("signal-answer", {
          targetSocketId: senderSocketId,
          answer,
        });
      } catch (err) {
        console.error("Error handling signal-offer:", err);
        setErrorMessage("Failed to establish video connection: " + err.message);
      }
    });

    // Handling incoming WebRTC answer
    socket.on("signal-answer", async ({ senderSocketId, answer }) => {
      console.log("[WebRTC Client] Received signal-answer from", senderSocketId);
      try {
        const pc = peerConnectionRef.current;
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));

          // Drain queued candidates
          while (iceCandidatesQueue.current.length > 0) {
            const candidate = iceCandidatesQueue.current.shift();
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.warn("Error adding queued candidate:", e);
            }
          }
        }
      } catch (err) {
        console.error("Error setting remote description from answer:", err);
      }
    });

    // Handling incoming ICE candidates
    socket.on("signal-ice-candidate", async ({ senderSocketId, candidate }) => {
      try {
        const pc = peerConnectionRef.current;
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          iceCandidatesQueue.current.push(candidate);
        }
      } catch (err) {
        console.warn("Error adding ice candidate:", err);
      }
    });

    // Remote peer toggled audio/video
    socket.on("peer-media-toggled", ({ type, enabled }) => {
      setRemoteMediaState((prev) => ({
        ...prev,
        [type === "video" ? "isVideoEnabled" : "isAudioEnabled"]: enabled,
      }));
    });

    // In-room live chat message received
    socket.on("chat-message-received", (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    // Peer left room
    socket.on("peer-left", ({ userName, role }) => {
      console.log(`[WebRTC Client] Peer left: ${userName} (${role})`);
      setRemoteStream(null);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      setPeerInfo(null);
      setConnectionStatus("WAITING_FOR_PEER");
      setStatusMessage(`${userName || "Peer"} has left the consultation.`);
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
      setErrorMessage(message || "Consultation connection error");
      setConnectionStatus("ERROR");
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect error:", err);
      setErrorMessage("Could not connect to telehealth signaling server.");
      setConnectionStatus("ERROR");
    });
  }, [
    appointmentId,
    user,
    setupLocalMedia,
    permissionDenied,
    initiateOffer,
    createPeerConnection,
    onConsultationEnded,
  ]);

  // Clean up media and WebRTC connections
  const cleanupConnection = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn("Error stopping track:", e);
        }
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (e) {
        console.warn("Error closing pc:", e);
      }
      peerConnectionRef.current = null;
    }

    if (socketRef.current) {
      try {
        socketRef.current.emit("leave-consultation");
        socketRef.current.disconnect();
      } catch (e) {
        console.warn("Error disconnecting socket:", e);
      }
      socketRef.current = null;
    }

    setRemoteStream(null);
  }, []);

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
  const toggleCamera = useCallback(() => {
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
      }
    }
  }, [isCameraOn]);

  // Send in-session chat message
  const sendChatMessage = useCallback((text) => {
    if (!text || !text.trim() || !socketRef.current) return;
    socketRef.current.emit("send-chat-message", { text: text.trim() });
  }, []);

  // End consultation
  const endConsultation = useCallback((notes = "") => {
    if (socketRef.current && appointmentId) {
      socketRef.current.emit("end-consultation", { appointmentId, notes });
    }
    cleanupConnection();
    setConnectionStatus("ENDED");
    setStatusMessage("Consultation ended.");
  }, [appointmentId, cleanupConnection]);

  // Leave consultation
  const leaveConsultation = useCallback(() => {
    cleanupConnection();
    setConnectionStatus("ENDED");
    setStatusMessage("You left the consultation.");
  }, [cleanupConnection]);

  // Auto connect when appointmentId is provided
  useEffect(() => {
    if (appointmentId) {
      startConsultation();
    }
    return () => {
      cleanupConnection();
    };
  }, [appointmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Bind video element whenever localStream changes
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      bindLocalVideo();
    }
  }, [localStream, bindLocalVideo]);

  return {
    connectionStatus,
    statusMessage,
    errorMessage,
    permissionDenied,
    localStream,
    remoteStream,
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
