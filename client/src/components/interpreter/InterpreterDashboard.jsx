import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../Navbar";
import {
  fetchAvailableInterpreterRequests,
  fetchMyInterpreterAssignments,
  acceptInterpreterRequest,
  rejectInterpreterRequest,
} from "../../services/appointmentService";
import useWebRTC from "../../services/useWebRTC";
import InterpreterProfile from "./InterpreterProfile";
import { updateInterpreterAvailability } from "../../services/interpreterService";
import {
  Languages,
  Globe,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Clock,
  User,
  CheckCircle2,
  LogOut,
  Activity,
  Headphones,
  Calendar,
  AlertCircle,
  Check,
  X,
  Info,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Stethoscope,
  ChevronRight,
  Send,
  MessageSquare,
  FileText,
  Sparkles,
} from "lucide-react";

/**
 * Reusable Remote Video Tile for Interpreter Room
 */
function RemoteParticipantTile({ peer, defaultLabel, defaultRole }) {
  const videoRef = useRef(null);
  const [isAudioMutedByPolicy, setIsAudioMutedByPolicy] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const stream = peer?.stream;
  const hasVideoTrack = !!(
    stream &&
    stream.getVideoTracks().length > 0 &&
    stream.getVideoTracks().some((t) => t.enabled)
  );
  const isVideoVisible = hasVideoTrack && peer?.isVideoEnabled !== false;
  const isAudioActive = peer?.isAudioEnabled !== false;
  const role = peer?.role || defaultRole || "participant";
  const displayName =
    peer?.userName ||
    (role === "doctor"
      ? "Doctor"
      : role === "patient"
      ? "Patient"
      : defaultLabel || "Participant");
  const roleLabel =
    role === "doctor"
      ? "Doctor"
      : role === "interpreter"
      ? "Certified Interpreter"
      : "Patient";

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !stream) return;

    if (videoEl.srcObject !== stream) {
      videoEl.srcObject = stream;
    }

    const attemptPlay = () => {
      videoEl
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsAudioMutedByPolicy(videoEl.muted);
        })
        .catch((err) => {
          console.warn("[WebRTC] Autoplay unmuted video blocked on mobile, falling back to muted:", err);
          // Fallback: Muted playback starts immediately on mobile browsers
          videoEl.muted = true;
          setIsAudioMutedByPolicy(true);
          videoEl
            .play()
            .then(() => setIsPlaying(true))
            .catch((e) => console.warn("[WebRTC] Muted autoplay also failed:", e));
        });
    };

    attemptPlay();

    const handleTrackChange = () => {
      if (videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
      attemptPlay();
    };

    stream.addEventListener("addtrack", handleTrackChange);
    stream.addEventListener("removetrack", handleTrackChange);

    return () => {
      stream.removeEventListener("addtrack", handleTrackChange);
      stream.removeEventListener("removetrack", handleTrackChange);
    };
  }, [stream]);

  const handleUnmuteAudio = (e) => {
    if (e) e.stopPropagation();
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.muted = false;
      videoEl
        .play()
        .then(() => {
          setIsAudioMutedByPolicy(false);
        })
        .catch((e) => console.warn("[WebRTC] Unmute play failed:", e));
    }
  };

  return (
    <div
      className="remote-peer-tile"
      onClick={isAudioMutedByPolicy ? handleUnmuteAudio : undefined}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "240px",
        background: "#0f172a",
        borderRadius: "12px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        cursor: isAudioMutedByPolicy ? "pointer" : "default",
      }}
    >
      {/* Video element is permanently rendered in DOM to keep mobile video pipeline active */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: isVideoVisible ? 2 : 1,
          opacity: isVideoVisible ? 1 : 0,
        }}
      />

      {/* Placeholder / Connecting state overlay */}
      {!isVideoVisible && (
        <div
          style={{
            position: "relative",
            zIndex: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            padding: "16px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background:
                role === "doctor"
                  ? "#087f8c"
                  : role === "interpreter"
                  ? "#6366f1"
                  : "#0d9488",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: "700",
              marginBottom: "8px",
            }}
          >
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <strong style={{ fontSize: "14px", color: "#f8fafc" }}>
            {displayName}
          </strong>
          <span
            style={{
              fontSize: "11px",
              color: "#94a3b8",
              marginTop: "2px",
            }}
          >
            {peer?.stream
              ? "Camera Off (Audio Active)"
              : `Waiting for ${roleLabel} to connect stream...`}
          </span>
        </div>
      )}

      {/* Header Tag */}
      <div
        style={{
          position: "absolute",
          top: "8px",
          left: "8px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(6px)",
          padding: "3px 8px",
          borderRadius: "6px",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          color: "#ffffff",
          fontSize: "11px",
          fontWeight: "600",
          zIndex: 5,
        }}
      >
        <span
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: isVideoVisible ? "#10b981" : "#f59e0b",
          }}
        />
        <span>{displayName}</span>
        <span
          style={{
            fontSize: "10px",
            background:
              role === "doctor"
                ? "rgba(8, 127, 140, 0.5)"
                : role === "interpreter"
                ? "rgba(99, 102, 241, 0.5)"
                : "rgba(13, 148, 136, 0.5)",
            color:
              role === "doctor"
                ? "#a5f3fc"
                : role === "interpreter"
                ? "#c7d2fe"
                : "#99f6e4",
            padding: "1px 5px",
            borderRadius: "4px",
          }}
        >
          {roleLabel}
        </span>
      </div>

      {/* Mobile unmuted audio banner */}
      {isAudioMutedByPolicy && (
        <button
          onClick={handleUnmuteAudio}
          type="button"
          style={{
            position: "absolute",
            bottom: "8px",
            left: "8px",
            background: "rgba(239, 68, 68, 0.9)",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            padding: "4px 8px",
            fontSize: "11px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            zIndex: 6,
          }}
        >
          <Volume2 size={12} />
          <span>Tap to Unmute</span>
        </button>
      )}

      {/* Mic state */}
      <div
        style={{
          position: "absolute",
          bottom: "8px",
          right: "8px",
          background: "rgba(15, 23, 42, 0.7)",
          padding: "3px 6px",
          borderRadius: "4px",
          display: "flex",
          alignItems: "center",
          zIndex: 5,
        }}
      >
        {isAudioActive ? (
          <Mic size={12} style={{ color: "#4ade80" }} />
        ) : (
          <MicOff size={12} style={{ color: "#f87171" }} />
        )}
      </div>
    </div>
  );
}

/**
 * Live 3-Way Video Consultation Room for Assigned Interpreter
 */
function ActiveInterpreterConsultationRoom({ session, user, onLeave }) {
  const [activeSideTab, setActiveSideTab] = useState("chat");
  const [chatInput, setChatInput] = useState("");

  const {
    connectionStatus,
    statusMessage,
    errorMessage,
    permissionDenied,
    localStream,
    remotePeers,
    isMicOn,
    isCameraOn,
    chatMessages,
    localVideoRef,
    toggleMic,
    toggleCamera,
    sendChatMessage,
    leaveConsultation,
    retryConnection,
  } = useWebRTC({
    appointmentId: session?._id || session?.id,
    user: { ...user, role: "interpreter" },
    onConsultationEnded: () => {
      onLeave();
    },
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput("");
  };

  const handleLeave = () => {
    if (window.confirm("Are you sure you want to leave this live consultation room?")) {
      leaveConsultation();
      onLeave();
    }
  };

  const explicitDoctor = remotePeers.find((p) => p.role === "doctor");
  const explicitPatient = remotePeers.find((p) => p.role === "patient");
  const unassignedPeers = remotePeers.filter(
    (p) => p !== explicitDoctor && p !== explicitPatient
  );

  const doctorPeer =
    explicitDoctor ||
    (unassignedPeers.length > 0 && !explicitPatient ? unassignedPeers[0] : null);
  const patientPeer =
    explicitPatient ||
    (unassignedPeers.length > 0 && doctorPeer !== unassignedPeers[0]
      ? unassignedPeers[0]
      : unassignedPeers[1] || null);

  const patientDisplayName = session.patient?.name || "Patient";
  const doctorDisplayName = session.doctor?.name || session.doctorName || "Doctor";

  return (
    <div className="consultation-room-container" style={{ padding: "0 24px 24px 24px" }}>
      {/* Top Banner */}
      <div className="room-top-banner">
        <div className="room-title-area">
          <div className="room-doc-avatar" style={{ background: "#eef2ff", color: "#4f46e5" }}>
            <Languages size={24} />
          </div>
          <div className="room-title-text">
            <h2>Live Medical Relay &bull; {session.interpreterLanguage}</h2>
            <div className="room-meta-row">
              <span className="room-meta-pill" style={{ background: "#eef2ff", color: "#4f46e5" }}>
                Certified Live Interpreter Mode
              </span>
              {connectionStatus === "CONNECTED" ? (
                <span className="room-meta-pill status-confirmed">
                  ● 3-Way Connected (HD)
                </span>
              ) : connectionStatus === "CONNECTING" ? (
                <span className="room-meta-pill status-inprogress">
                  ● Connecting Video Channel...
                </span>
              ) : (
                <span className="room-meta-pill status-pending">
                  ● Waiting for Doctor & Patient
                </span>
              )}
              <span style={{ fontSize: "12px", color: "#a5cdd4" }}>
                ID: #{String(session._id).slice(-8)}
              </span>
            </div>
          </div>
        </div>

        <div className="room-header-details">
          <div className="room-detail-item">
            <User size={14} style={{ color: "#38bdf8" }} />
            <span>
              Patient: <strong>{patientDisplayName}</strong> ({session.patient?.language || session.interpreterLanguage})
            </span>
          </div>

          <div className="room-detail-item">
            <Stethoscope size={14} style={{ color: "#38bdf8" }} />
            <span>
              Doctor: <strong>{doctorDisplayName}</strong> ({session.specialty || "General"})
            </span>
          </div>

          <div className="room-detail-item">
            <Calendar size={14} style={{ color: "#38bdf8" }} />
            <span>
              {session.date} &bull; {session.time}
            </span>
          </div>

          <button
            onClick={handleLeave}
            className="ctrl-btn leave-btn"
            style={{ padding: "6px 14px", borderRadius: "8px", height: "auto" }}
          >
            <PhoneOff size={15} />
            <span>Exit Consultation</span>
          </button>
        </div>
      </div>

      {/* Permission / Connection Alert */}
      {(errorMessage || permissionDenied) && (
        <div
          className="auth-alert alert-error"
          style={{
            margin: "0 0 16px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={retryConnection}
            className="confirm-btn"
            style={{
              padding: "6px 14px",
              fontSize: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <RefreshCw size={13} />
            <span>Retry Camera/Mic</span>
          </button>
        </div>
      )}

      {/* Main Grid: Video Screen (Left) & Side Panel (Right) */}
      <div className="room-grid">
        {/* Left Video Area */}
        <div className="video-column">
          <div className="main-video-feed" style={{ position: "relative", minHeight: "480px" }}>
            {/* Security Badge */}
            <div className="channel-secure-badge" style={{ zIndex: 10 }}>
              <ShieldCheck size={14} />
              <span>3-Way Encrypted Telehealth Relay &bull; {session.interpreterLanguage}</span>
            </div>

            {/* 2-Tile Grid for Patient + Doctor */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                padding: "12px",
                boxSizing: "border-box",
                zIndex: 2,
              }}
            >
              {/* Tile 1: Patient Feed */}
              <RemoteParticipantTile
                peer={patientPeer}
                defaultLabel={patientDisplayName}
                defaultRole="patient"
              />

              {/* Tile 2: Doctor Feed */}
              <RemoteParticipantTile
                peer={doctorPeer}
                defaultLabel={doctorDisplayName}
                defaultRole="doctor"
              />
            </div>

            {/* Interpreter Self PiP */}
            <div
              className="patient-self-feed"
              style={{
                position: "absolute",
                bottom: "16px",
                right: "16px",
                width: "140px",
                height: "100px",
                borderRadius: "10px",
                overflow: "hidden",
                border: "2px solid rgba(99, 102, 241, 0.6)",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.5)",
                background: "#0f172a",
                zIndex: 10,
              }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: isCameraOn && localStream ? "block" : "none",
                }}
              />

              {(!isCameraOn || !localStream) && (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                    fontSize: "11px",
                    gap: "4px",
                  }}
                >
                  <VideoOff size={20} style={{ color: "#ef4444" }} />
                  <span>Camera Off</span>
                </div>
              )}

              <div
                style={{
                  position: "absolute",
                  bottom: "4px",
                  left: "6px",
                  right: "6px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "10px",
                  fontWeight: "600",
                  color: "#ffffff",
                  background: "rgba(0, 0, 0, 0.6)",
                  padding: "2px 4px",
                  borderRadius: "4px",
                }}
              >
                <span>You (Interpreter)</span>
                <div style={{ display: "flex", gap: "3px" }}>
                  {isMicOn ? (
                    <Mic size={10} style={{ color: "#4ade80" }} />
                  ) : (
                    <MicOff size={10} style={{ color: "#f87171" }} />
                  )}
                  {isCameraOn ? (
                    <Video size={10} style={{ color: "#4ade80" }} />
                  ) : (
                    <VideoOff size={10} style={{ color: "#f87171" }} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Video Control Bar */}
          <div className="video-control-bar">
            <button
              onClick={toggleMic}
              className={`ctrl-btn ${!isMicOn ? "muted" : ""}`}
              title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
            >
              {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
              <span>{isMicOn ? "Mute" : "Unmuted"}</span>
            </button>

            <button
              onClick={toggleCamera}
              className={`ctrl-btn ${!isCameraOn ? "muted" : ""}`}
              title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
            >
              {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
              <span>{isCameraOn ? "Camera On" : "Camera Off"}</span>
            </button>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                background: "rgba(99, 102, 241, 0.15)",
                color: "#c7d2fe",
                fontSize: "13px",
                fontWeight: "600",
                border: "1px solid rgba(99, 102, 241, 0.3)",
              }}
            >
              <Globe size={16} />
              <span>Language: {session.interpreterLanguage} &bull; English</span>
            </div>

            <button
              onClick={handleLeave}
              className="ctrl-btn leave-btn"
            >
              <PhoneOff size={18} />
              <span>Leave Room</span>
            </button>
          </div>
        </div>

        {/* Right Side Panel: Live Chat & Clinical Context */}
        <div className="side-panel">
          <div className="panel-tab-headers">
            <button
              className={`panel-tab ${activeSideTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveSideTab("chat")}
            >
              <MessageSquare size={15} />
              <span>Chat ({chatMessages.length})</span>
            </button>

            <button
              className={`panel-tab ${activeSideTab === "clinical" ? "active" : ""}`}
              onClick={() => setActiveSideTab("clinical")}
            >
              <FileText size={15} />
              <span>Clinical Info</span>
            </button>
          </div>

          <div className="panel-content">
            {activeSideTab === "chat" && (
              <div className="transcript-stream">
                <div className="transcript-intro">
                  <Sparkles size={14} />
                  <span>3-Way In-Session Chat (Patient &bull; Doctor &bull; You)</span>
                </div>

                <div className="messages-flow">
                  {chatMessages.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        color: "#8aa1a5",
                        fontSize: "13px",
                        padding: "30px 10px",
                      }}
                    >
                      No chat messages sent yet. You can send clarification notes or typed translations here.
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`transcript-bubble ${
                          msg.role === "doctor"
                            ? "doctor-msg"
                            : msg.role === "interpreter"
                            ? "interpreter-msg"
                            : "patient-msg"
                        }`}
                        style={{
                          borderLeft:
                            msg.role === "interpreter"
                              ? "3px solid #6366f1"
                              : undefined,
                        }}
                      >
                        <div className="msg-author-row">
                          <strong>
                            {msg.sender} ({msg.role})
                          </strong>
                          <span>{msg.time}</span>
                        </div>
                        <p className="original-p">{msg.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <form
                  onSubmit={handleSendMessage}
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "auto",
                    paddingTop: "12px",
                    borderTop: "1px solid #e2ecee",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Type translation note or message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1.5px solid #d5eaec",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                  <button
                    type="submit"
                    className="confirm-btn"
                    style={{ padding: "8px 14px", borderRadius: "8px", background: "#4f46e5" }}
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            )}

            {activeSideTab === "clinical" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="clinical-info-card">
                  <label>Patient Details</label>
                  <strong style={{ display: "block", color: "#0f172a" }}>{patientDisplayName}</strong>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Primary Language: {session.patient?.language || session.interpreterLanguage}
                  </span>
                </div>

                <div className="clinical-info-card">
                  <label>Attending Doctor</label>
                  <strong style={{ display: "block", color: "#0f172a" }}>{doctorDisplayName}</strong>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Specialty: {session.specialty || session.doctor?.specialty || "General Medicine"}
                  </span>
                </div>

                <div className="clinical-info-card" style={{ background: "#f0fdfa", borderColor: "#ccfbf1" }}>
                  <label style={{ color: "#087f8c" }}>Reason for Visit / Symptoms</label>
                  <p style={{ margin: 0, fontSize: "13px", color: "#1e293b", lineHeight: "1.4" }}>
                    {session.reason || "General telemedicine consultation."}
                  </p>
                </div>

                <div className="clinical-info-card">
                  <label>Translation Channel</label>
                  <p style={{ fontWeight: "600", color: "#4f46e5" }}>
                    {session.interpreterLanguage} &harr; English
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InterpreterDashboard({ user }) {
  const { logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("requests"); // requests, assigned, history, profile
  const [activeLiveSession, setActiveLiveSession] = useState(null);
  const [availableRequests, setAvailableRequests] = useState([]);
  const [assignedSessions, setAssignedSessions] = useState([]);
  const [supportedLanguages, setSupportedLanguages] = useState([]);
  const [availabilityStatus, setAvailabilityStatus] = useState(user?.availabilityStatus || "Available");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [selectedRequestModal, setSelectedRequestModal] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [reqRes, myRes] = await Promise.all([
        fetchAvailableInterpreterRequests(),
        fetchMyInterpreterAssignments(),
      ]);

      setAvailableRequests(reqRes.requests || []);
      setSupportedLanguages(reqRes.supportedLanguages || []);
      if (reqRes.availabilityStatus) {
        setAvailabilityStatus(reqRes.availabilityStatus);
      }
      setAssignedSessions(myRes.appointments || []);
    } catch (err) {
      console.error("Error loading interpreter dashboard data:", err);
      setError(err.message || "Failed to load interpreter sessions and requests");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleProfileUpdated = (updatedProfile) => {
    if (updatedProfile) {
      if (updatedProfile.availabilityStatus) {
        setAvailabilityStatus(updatedProfile.availabilityStatus);
      }
      if (updatedProfile.languages) {
        setSupportedLanguages(updatedProfile.languages);
      }
      updateUser(updatedProfile);
    }
    showToast("Profile credentials updated successfully.");
    loadData();
  };

  const handleSetAvailable = async () => {
    try {
      await updateInterpreterAvailability({ availabilityStatus: "Available" });
      setAvailabilityStatus("Available");
      showToast("Status updated to Available. Loading matching requests...");
      loadData();
    } catch (err) {
      console.error("Error setting available:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // If live consultation is active, render the 3-way video room view
  if (activeLiveSession) {
    return (
      <div className="dashboard-container">
        <Navbar />
        <div style={{ maxWidth: "1400px", margin: "20px auto 0 auto" }}>
          <ActiveInterpreterConsultationRoom
            session={activeLiveSession}
            user={user}
            onLeave={() => {
              setActiveLiveSession(null);
              loadData();
            }}
          />
        </div>
      </div>
    );
  }

  const handleAcceptRequest = async (id) => {
    try {
      setProcessingId(id);
      setError("");
      const res = await acceptInterpreterRequest(id);
      showToast(res.message || "Interpreter request accepted successfully!");

      // Refresh data
      await loadData();
      if (selectedRequestModal && selectedRequestModal._id === id) {
        setSelectedRequestModal(null);
      }
      setActiveTab("assigned");
    } catch (err) {
      console.error("Error accepting interpreter request:", err);
      setError(err.message || "Failed to accept interpreter request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReleaseAssignment = async (id) => {
    if (!window.confirm("Are you sure you want to release this interpreter assignment? The request will become available for other interpreters.")) {
      return;
    }
    try {
      setProcessingId(id);
      setError("");
      const res = await rejectInterpreterRequest(id);
      showToast(res.message || "Assignment released.");
      await loadData();
      if (selectedRequestModal && selectedRequestModal._id === id) {
        setSelectedRequestModal(null);
      }
    } catch (err) {
      console.error("Error releasing interpreter assignment:", err);
      setError(err.message || "Failed to release assignment");
    } finally {
      setProcessingId(null);
    }
  };

  // Completed sessions filter
  const completedSessions = assignedSessions.filter((s) => s.status === "Completed");
  const activeAssignedSessions = assignedSessions.filter((s) => s.status !== "Completed" && s.status !== "Cancelled");

  // Format languages list for display
  const userLanguagesList = Array.isArray(user?.languages) && user.languages.length > 0
    ? user.languages
    : (user?.language ? user.language.split(",").map((l) => l.trim()) : ["Spanish", "English"]);

  return (
    <div className="dashboard-container">
      <Navbar />

      <div className="portal-wrapper">
        {/* Sidebar */}
        <aside className="portal-sidebar">
          <div
            className="sidebar-patient-card"
            onClick={() => setActiveTab("profile")}
            style={{ cursor: "pointer", transition: "all 0.2s ease" }}
            title="View & Edit My Profile"
          >
            <div className="sidebar-avatar" style={{ background: "#6366f1", color: "#ffffff", overflow: "hidden" }}>
              {user?.profilePhoto || user?.avatar ? (
                <img
                  src={user.profilePhoto || user.avatar}
                  alt={user.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Languages size={26} />
              )}
            </div>
            <div className="sidebar-patient-info" style={{ flex: 1 }}>
              <h4 style={{ margin: "0 0 3px 0", fontSize: "14px" }}>{user?.name || "Medical Interpreter"}</h4>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                <div className="sidebar-lang-pill" style={{ background: "#eef2ff", color: "#4f46e5" }}>
                  <ShieldCheck size={12} />
                  <span>Certified</span>
                </div>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    padding: "1px 6px",
                    borderRadius: "8px",
                    background:
                      availabilityStatus === "Available"
                        ? "#dcfce7"
                        : availabilityStatus === "Busy"
                        ? "#fef3c7"
                        : "#f1f5f9",
                    color:
                      availabilityStatus === "Available"
                        ? "#15803d"
                        : availabilityStatus === "Busy"
                        ? "#b45309"
                        : "#64748b",
                  }}
                >
                  ● {availabilityStatus}
                </span>
              </div>
            </div>
          </div>

          <div style={{ padding: "0 16px 14px 16px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b", display: "block", marginBottom: "6px" }}>
              My Languages
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {userLanguagesList.map((lang, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: "11px",
                    background: "#f1f5f9",
                    color: "#334155",
                    padding: "3px 8px",
                    borderRadius: "12px",
                    fontWeight: "600",
                  }}
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-tab-item ${activeTab === "requests" ? "active" : ""}`}
              onClick={() => setActiveTab("requests")}
            >
              <Globe size={18} />
              <span>Available Requests</span>
              {availableRequests.length > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: "#4f46e5",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "2px 7px",
                    borderRadius: "10px",
                  }}
                >
                  {availableRequests.length}
                </span>
              )}
            </button>

            <button
              className={`nav-tab-item ${activeTab === "assigned" ? "active" : ""}`}
              onClick={() => setActiveTab("assigned")}
            >
              <Headphones size={18} />
              <span>My Assigned Relays</span>
              {activeAssignedSessions.length > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: "#10b981",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "2px 7px",
                    borderRadius: "10px",
                  }}
                >
                  {activeAssignedSessions.length}
                </span>
              )}
            </button>

            <button
              className={`nav-tab-item ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              <Activity size={18} />
              <span>Session History</span>
            </button>

            <button
              className={`nav-tab-item ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <User size={18} />
              <span>My Profile</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <button onClick={logout} className="sidebar-logout-btn">
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="portal-main-content">
          {/* Notifications / Alerts */}
          {toastMessage && (
            <div className="toast-notification" style={{ marginBottom: "16px" }}>
              <CheckCircle2 size={18} style={{ color: "#10b981" }} />
              <span>{toastMessage}</span>
            </div>
          )}

          {error && (
            <div className="auth-alert alert-error" style={{ marginBottom: "16px" }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {activeTab === "profile" ? (
            <InterpreterProfile
              onProfileUpdated={handleProfileUpdated}
              onBackToDashboard={() => setActiveTab("requests")}
            />
          ) : (
            <>
              {/* Metrics Grid */}
              <div className="metrics-grid" style={{ marginBottom: "28px" }}>
                <div className="metric-card purple">
                  <div className="metric-icon">
                    <Globe size={22} />
                  </div>
                  <div className="metric-info">
                    <span className="metric-value">{availableRequests.length}</span>
                    <span className="metric-label">Matching Open Requests</span>
                  </div>
                </div>

                <div className="metric-card green">
                  <div className="metric-icon">
                    <Headphones size={22} />
                  </div>
                  <div className="metric-info">
                    <span className="metric-value">{activeAssignedSessions.length}</span>
                    <span className="metric-label">My Confirmed Relays</span>
                  </div>
                </div>

                <div className="metric-card cyan">
                  <div className="metric-icon">
                    <CheckCircle2 size={22} />
                  </div>
                  <div className="metric-info">
                    <span className="metric-value">{completedSessions.length}</span>
                    <span className="metric-label">Total Relays Completed</span>
                  </div>
                </div>
              </div>

              {/* ====================================================================
                  TAB 1: AVAILABLE MATCHING REQUESTS
                  ==================================================================== */}
              {activeTab === "requests" && (
                <div className="my-appointments-container">
                  <div className="appointments-header">
                    <div>
                      <h2>Available Interpreter Requests</h2>
                      <p>Telemedicine appointments requesting live interpretation matching your certified languages</p>
                    </div>
                    <button
                      onClick={loadData}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 14px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        background: "#ffffff",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                        color: "#374151",
                      }}
                    >
                      <RefreshCw size={14} className={loading ? "spinner" : ""} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {/* Availability Pause Notice */}
                  {availabilityStatus !== "Available" && (
                    <div
                      style={{
                        margin: "0 0 20px 0",
                        padding: "16px 20px",
                        borderRadius: "12px",
                        background: "#fffbeb",
                        border: "1.5px solid #fde68a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "14px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <AlertCircle size={22} style={{ color: "#d97706" }} />
                        <div>
                          <strong style={{ display: "block", color: "#92400e", fontSize: "14px" }}>
                            Matching Requests Paused &bull; You are currently marked as {availabilityStatus}
                          </strong>
                          <span style={{ fontSize: "12.5px", color: "#b45309" }}>
                            You will not appear in patient matching lists until your status is switched to <strong>Available</strong>.
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={handleSetAvailable}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "8px",
                            border: "none",
                            background: "#10b981",
                            color: "#ffffff",
                            fontWeight: "600",
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                        >
                          Set to Available
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("profile")}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            border: "1px solid #d97706",
                            background: "#ffffff",
                            color: "#b45309",
                            fontWeight: "600",
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                        >
                          Edit Profile
                        </button>
                      </div>
                    </div>
                  )}

              {loading ? (
                <div className="empty-appointments-box">
                  <div className="spinner"></div>
                  <p style={{ marginTop: "12px" }}>Scanning for available interpreter requests...</p>
                </div>
              ) : availableRequests.length === 0 ? (
                <div className="empty-appointments-box">
                  <Globe size={40} className="empty-icon" style={{ color: "#6366f1" }} />
                  <h3>No Open Interpreter Requests Right Now</h3>
                  <p>
                    All current consultation requests matching your certified languages (
                    {userLanguagesList.join(", ")}) have been fulfilled. Check back soon for new patient requests!
                  </p>
                </div>
              ) : (
                <div className="appointments-list">
                  {availableRequests.map((req) => (
                    <div key={req._id} className="appointment-card" style={{ borderLeft: "4px solid #4f46e5" }}>
                      <div className="apt-card-main">
                        <div
                          className="doc-avatar-mid"
                          style={{ background: "#eef2ff", color: "#4f46e5" }}
                        >
                          <Languages size={26} />
                        </div>

                        <div className="apt-info">
                          <div className="apt-header-line">
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <h3 style={{ margin: 0, fontSize: "17px" }}>
                                {req.interpreterLanguage} Interpretation
                              </h3>
                              <span
                                style={{
                                  background: "#fef3c7",
                                  color: "#b45309",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  padding: "3px 8px",
                                  borderRadius: "10px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "3px",
                                }}
                              >
                                <Clock size={11} /> {req.interpreterStatus || "Requested"}
                              </span>
                            </div>
                          </div>

                          <p className="apt-spec" style={{ color: "#475569", margin: "4px 0" }}>
                            Patient: <strong style={{ color: "#0f172a" }}>{req.patient?.name || "Patient"}</strong> &bull; Doctor: <strong style={{ color: "#0f172a" }}>{req.doctor?.name || req.doctorName}</strong> ({req.specialty || req.doctor?.specialty || "General"})
                          </p>

                          <div className="apt-meta-tags">
                            <span className="apt-tag">
                              <Calendar size={14} /> {req.date}
                            </span>
                            <span className="apt-tag">
                              <Clock size={14} /> {req.time}
                            </span>
                            <span className="apt-tag">
                              <Video size={14} /> {req.type || "Video Call"}
                            </span>
                            <span className="apt-tag" style={{ background: "#eef2ff", color: "#4f46e5", fontWeight: "600" }}>
                              <Languages size={14} /> Language: {req.interpreterLanguage}
                            </span>
                            <span className="apt-tag" style={{ fontSize: "11px", color: "#64748b" }}>
                              ID: {String(req._id).slice(-8)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="apt-card-actions">
                        <button
                          type="button"
                          onClick={() => setSelectedRequestModal(req)}
                          className="view-details-btn"
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            border: "1px solid #d5eaec",
                            background: "#f8fafb",
                            color: "#334e54",
                            fontSize: "13px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Info size={15} />
                          <span>View Request</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAcceptRequest(req._id)}
                          disabled={processingId === req._id}
                          style={{
                            padding: "9px 16px",
                            borderRadius: "8px",
                            border: "none",
                            background: "#4f46e5",
                            color: "#ffffff",
                            fontSize: "13px",
                            fontWeight: "600",
                            cursor: processingId === req._id ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)",
                          }}
                        >
                          {processingId === req._id ? (
                            <>
                              <Loader2 size={15} className="spinner" />
                              <span>Accepting...</span>
                            </>
                          ) : (
                            <>
                              <Check size={15} />
                              <span>Accept Request</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ====================================================================
              TAB 2: MY ASSIGNED RELAYS (ACCEPTED SESSIONS)
              ==================================================================== */}
          {activeTab === "assigned" && (
            <div className="my-appointments-container">
              <div className="appointments-header">
                <div>
                  <h2>My Assigned Consultation Relays</h2>
                  <p>Telemedicine consultations where you are confirmed as the certified live interpreter</p>
                </div>
                <button
                  onClick={loadData}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    color: "#374151",
                  }}
                >
                  <RefreshCw size={14} className={loading ? "spinner" : ""} />
                  <span>Refresh</span>
                </button>
              </div>

              {loading ? (
                <div className="empty-appointments-box">
                  <div className="spinner"></div>
                  <p style={{ marginTop: "12px" }}>Loading your assignments...</p>
                </div>
              ) : activeAssignedSessions.length === 0 ? (
                <div className="empty-appointments-box">
                  <Headphones size={40} className="empty-icon" style={{ color: "#10b981" }} />
                  <h3>No Active Relay Assignments</h3>
                  <p>You currently have no upcoming assigned sessions. Check "Available Requests" to accept patient interpretation requests.</p>
                  <button
                    onClick={() => setActiveTab("requests")}
                    className="find-doctor-btn"
                    style={{ marginTop: "12px" }}
                  >
                    Browse Available Requests
                  </button>
                </div>
              ) : (
                <div className="appointments-list">
                  {activeAssignedSessions.map((session) => (
                    <div key={session._id} className="appointment-card" style={{ borderLeft: "4px solid #10b981" }}>
                      <div className="apt-card-main">
                        <div
                          className="doc-avatar-mid"
                          style={{ background: "#ecfdf5", color: "#059669" }}
                        >
                          <Headphones size={26} />
                        </div>

                        <div className="apt-info">
                          <div className="apt-header-line">
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <h3 style={{ margin: 0, fontSize: "17px" }}>
                                {session.interpreterLanguage} &bull; {session.doctorName}
                              </h3>
                              <span
                                style={{
                                  background: "#ecfdf5",
                                  color: "#059669",
                                  border: "1px solid #a7f3d0",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  padding: "3px 8px",
                                  borderRadius: "10px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "3px",
                                }}
                              >
                                <ShieldCheck size={12} /> Assigned &bull; {session.interpreterStatus || "Accepted"}
                              </span>
                            </div>
                          </div>

                          <p className="apt-spec" style={{ color: "#475569", margin: "4px 0" }}>
                            Patient: <strong style={{ color: "#0f172a" }}>{session.patient?.name || "Patient"}</strong> &bull; Doctor: <strong style={{ color: "#0f172a" }}>{session.doctor?.name || session.doctorName}</strong> ({session.specialty || "General"})
                          </p>

                          <div className="apt-meta-tags">
                            <span className="apt-tag">
                              <Calendar size={14} /> {session.date}
                            </span>
                            <span className="apt-tag">
                              <Clock size={14} /> {session.time}
                            </span>
                            <span className="apt-tag">
                              <Video size={14} /> {session.type || "Video Call"}
                            </span>
                            <span className="apt-tag" style={{ background: "#ecfdf5", color: "#059669", fontWeight: "600" }}>
                              <Languages size={14} /> Language: {session.interpreterLanguage}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="apt-card-actions">
                        {session.status !== "Completed" && session.status !== "Cancelled" && (
                          <button
                            type="button"
                            onClick={() => setActiveLiveSession(session)}
                            style={{
                              padding: "8px 15px",
                              borderRadius: "8px",
                              border: "none",
                              background: "#10b981",
                              color: "#ffffff",
                              fontSize: "13px",
                              fontWeight: "600",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)",
                            }}
                          >
                            <Video size={15} />
                            <span>Join Live Room</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedRequestModal(session)}
                          className="view-details-btn"
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            border: "1px solid #d5eaec",
                            background: "#f8fafb",
                            color: "#334e54",
                            fontSize: "13px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Info size={15} />
                          <span>Details</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReleaseAssignment(session._id)}
                          disabled={processingId === session._id}
                          style={{
                            padding: "8px 13px",
                            borderRadius: "8px",
                            border: "1px solid #fca5a5",
                            background: "#fef2f2",
                            color: "#dc2626",
                            fontSize: "13px",
                            fontWeight: "600",
                            cursor: processingId === session._id ? "not-allowed" : "pointer",
                          }}
                        >
                          {processingId === session._id ? "Releasing..." : "Release"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ====================================================================
              TAB 3: SESSION HISTORY
              ==================================================================== */}
          {activeTab === "history" && (
            <div className="patient-settings-container">
              <div className="settings-header">
                <h2>Completed Interpretation Logs</h2>
                <p>Track your past fulfilled medical interpretation sessions and records</p>
              </div>

              {completedSessions.length === 0 ? (
                <div className="settings-card">
                  <p style={{ color: "#61777b" }}>No completed interpretation logs found yet.</p>
                </div>
              ) : (
                <div className="appointments-list">
                  {completedSessions.map((session) => (
                    <div key={session._id} className="appointment-card">
                      <div className="apt-card-main">
                        <div className="doc-avatar-mid" style={{ background: "#f1f5f9", color: "#64748b" }}>
                          <CheckCircle2 size={24} />
                        </div>
                        <div className="apt-info">
                          <h3>{session.interpreterLanguage} Interpretation &bull; Completed</h3>
                          <p className="apt-spec">
                            Doctor: {session.doctorName} &bull; Patient: {session.patient?.name || "Patient"}
                          </p>
                          <div className="apt-meta-tags">
                            <span className="apt-tag">
                              <Calendar size={14} /> {session.date}
                            </span>
                            <span className="apt-tag">
                              <Clock size={14} /> {session.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
            </>
          )}
        </main>
      </div>

      {/* ====================================================================
          VIEW REQUEST / APPOINTMENT DETAILS MODAL
          ==================================================================== */}
      {selectedRequestModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="booking-modal-card" style={{ maxWidth: "560px", borderRadius: "16px" }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: "#eef2ff",
                    color: "#4f46e5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Languages size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                    Interpreter Request Details
                  </h3>
                  <span style={{ fontSize: "13px", color: "#4f46e5", fontWeight: "600" }}>
                    Appointment ID: {selectedRequestModal._id}
                  </span>
                </div>
              </div>
              <button
                className="close-modal-btn"
                onClick={() => setSelectedRequestModal(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Language Banner */}
              <div
                style={{
                  background: "#eef2ff",
                  border: "1px solid #c7d2fe",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "#4338ca", display: "block" }}>
                    Requested Translation Language
                  </span>
                  <strong style={{ fontSize: "17px", color: "#1e1b4b" }}>
                    {selectedRequestModal.interpreterLanguage}
                  </strong>
                </div>
                <span
                  style={{
                    background: selectedRequestModal.interpreterStatus === "Accepted" ? "#ecfdf5" : "#fef3c7",
                    color: selectedRequestModal.interpreterStatus === "Accepted" ? "#059669" : "#b45309",
                    padding: "6px 12px",
                    borderRadius: "14px",
                    fontSize: "12px",
                    fontWeight: "700",
                  }}
                >
                  {selectedRequestModal.interpreterStatus || "Requested"}
                </span>
              </div>

              {/* Patient & Doctor Information */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px", borderRadius: "10px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                    Patient Details
                  </span>
                  <div style={{ marginTop: "4px" }}>
                    <strong style={{ display: "block", color: "#0f172a", fontSize: "14px" }}>
                      {selectedRequestModal.patient?.name || "Patient"}
                    </strong>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Primary: {selectedRequestModal.patient?.language || selectedRequestModal.interpreterLanguage}
                    </span>
                  </div>
                </div>

                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px", borderRadius: "10px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                    Doctor Details
                  </span>
                  <div style={{ marginTop: "4px" }}>
                    <strong style={{ display: "block", color: "#0f172a", fontSize: "14px" }}>
                      {selectedRequestModal.doctor?.name || selectedRequestModal.doctorName}
                    </strong>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      {selectedRequestModal.specialty || selectedRequestModal.doctor?.specialty || "General Physician"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Schedule Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px", borderRadius: "10px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginBottom: "3px" }}>
                    Consultation Date
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", color: "#0f172a" }}>
                    <Calendar size={15} style={{ color: "#4f46e5" }} />
                    <span>{selectedRequestModal.date}</span>
                  </div>
                </div>

                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px", borderRadius: "10px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginBottom: "3px" }}>
                    Scheduled Time
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", color: "#0f172a" }}>
                    <Clock size={15} style={{ color: "#4f46e5" }} />
                    <span>{selectedRequestModal.time}</span>
                  </div>
                </div>
              </div>

              {/* Symptoms / Clinical Context */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 14px", borderRadius: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "4px", textTransform: "uppercase" }}>
                  Reason for Visit / Symptoms
                </span>
                <p style={{ margin: 0, fontSize: "13.5px", color: "#1e293b", lineHeight: "1.4" }}>
                  {selectedRequestModal.reason || "General telemedicine consultation."}
                </p>
              </div>

              {/* Modal Actions */}
              <div className="modal-actions" style={{ marginTop: "8px", display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setSelectedRequestModal(null)}
                  style={{ flex: "1" }}
                >
                  Close
                </button>

                {(!selectedRequestModal.interpreter || selectedRequestModal.interpreterStatus === "Requested") ? (
                  <button
                    type="button"
                    disabled={processingId === selectedRequestModal._id}
                    onClick={() => handleAcceptRequest(selectedRequestModal._id)}
                    style={{
                      flex: "2",
                      padding: "11px 18px",
                      borderRadius: "10px",
                      border: "none",
                      background: "#4f46e5",
                      color: "#ffffff",
                      fontWeight: "600",
                      fontSize: "14px",
                      cursor: processingId === selectedRequestModal._id ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    {processingId === selectedRequestModal._id ? (
                      <>
                        <Loader2 size={16} className="spinner" />
                        <span>Accepting Request...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Accept This Request</span>
                      </>
                    )}
                  </button>
                ) : selectedRequestModal.interpreter === user?.id || selectedRequestModal.interpreter?._id === user?.id ? (
                  <div style={{ display: "flex", gap: "10px", flex: "2" }}>
                    <button
                      type="button"
                      onClick={() => {
                        const targetSession = selectedRequestModal;
                        setSelectedRequestModal(null);
                        setActiveLiveSession(targetSession);
                      }}
                      style={{
                        flex: "1",
                        padding: "11px 18px",
                        borderRadius: "10px",
                        border: "none",
                        background: "#10b981",
                        color: "#ffffff",
                        fontWeight: "600",
                        fontSize: "14px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        boxShadow: "0 2px 6px rgba(16, 185, 129, 0.25)",
                      }}
                    >
                      <Video size={16} />
                      <span>Join Live Room</span>
                    </button>

                    <button
                      type="button"
                      disabled={processingId === selectedRequestModal._id}
                      onClick={() => handleReleaseAssignment(selectedRequestModal._id)}
                      style={{
                        padding: "11px 16px",
                        borderRadius: "10px",
                        border: "1px solid #fca5a5",
                        background: "#fef2f2",
                        color: "#dc2626",
                        fontWeight: "600",
                        fontSize: "13px",
                        cursor: processingId === selectedRequestModal._id ? "not-allowed" : "pointer",
                      }}
                    >
                      {processingId === selectedRequestModal._id ? "Releasing..." : "Release"}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InterpreterDashboard;
