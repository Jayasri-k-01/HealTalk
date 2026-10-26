import { useState, useEffect, useCallback, useRef } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  Languages,
  UserCheck,
  Send,
  FileText,
  AlertCircle,
  CheckCircle2,
  HeartPulse,
  Activity,
  Shield,
  Clock,
  Sparkles,
  X,
  Loader2,
  Globe,
  Calendar,
  RefreshCw,
} from "lucide-react";
import {
  fetchAppointmentById,
  fetchDoctorAppointments,
  completeAppointment,
  requestAppointmentInterpreter,
} from "../../../services/appointmentService";
import useWebRTC from "../../../services/useWebRTC";

const AVAILABLE_INTERPRETER_LANGUAGES = [
  "Spanish",
  "Hindi",
  "French",
  "Mandarin",
  "Arabic",
  "Portuguese",
  "Russian",
  "German",
  "Vietnamese",
  "Korean",
  "Japanese",
  "Tagalog",
];

/**
 * Reusable Remote Participant Video Tile for multi-peer calls
 */
function RemoteParticipantTile({ peer, defaultLabel, defaultRole }) {
  const videoElementRef = useRef(null);
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
  const role = peer?.role || defaultRole || "patient";
  const displayName =
    peer?.userName ||
    (role === "interpreter" ? "Medical Interpreter" : defaultLabel || "Participant");
  const roleLabel =
    role === "doctor"
      ? "Doctor"
      : role === "interpreter"
      ? "Certified Interpreter"
      : "Patient";

  useEffect(() => {
    const videoEl = videoElementRef.current;
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
    const videoEl = videoElementRef.current;
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
        minHeight: "220px",
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
        ref={videoElementRef}
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
 * Inner Active Video Consultation Room for Doctor with WebRTC
 */
function ActiveDoctorRoom({
  appointment,
  patient,
  previousRecords,
  onNavigateTab,
  user,
  sessionTimer,
  interpreterStatus,
  setInterpreterStatus,
  selectedLanguage,
  setSelectedLanguage,
  setIsInterpreterModalOpen,
  showToast,
  actionLoading,
  setActionLoading,
}) {
  const [activeSideTab, setActiveSideTab] = useState("history"); // history, chat, vitals
  const [newMessageText, setNewMessageText] = useState("");
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const {
    connectionStatus,
    statusMessage,
    errorMessage,
    permissionDenied,
    localStream,
    remotePeers,
    isMicOn,
    isCameraOn,
    remoteMediaState,
    chatMessages,
    localVideoRef,
    remoteVideoRef,
    toggleMic,
    toggleCamera,
    sendChatMessage,
    endConsultation,
    retryConnection,
  } = useWebRTC({
    appointmentId: appointment._id || appointment.id,
    user,
    onConsultationEnded: () => {
      showToast("Consultation ended.");
    },
  });

  const hasInterpreter =
    appointment.interpreterRequested ||
    interpreterStatus === "Connected" ||
    remotePeers.some((p) => p.role === "interpreter") ||
    remotePeers.length > 1;

  const patientPeer =
    remotePeers.find((p) => p.role === "patient") ||
    remotePeers.find((p) => p.role !== "interpreter") ||
    null;

  const interpreterPeer =
    remotePeers.find((p) => p.role === "interpreter") ||
    (remotePeers.length > 1 ? remotePeers.find((p) => p.role !== "patient") : null);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;
    sendChatMessage(newMessageText.trim());
    setNewMessageText("");
  };

  const handleCompleteConsultation = async () => {
    if (!appointment?._id) return;
    try {
      setActionLoading(true);
      endConsultation(appointment.notes || "Consultation Completed");
      await completeAppointment(appointment._id, appointment.notes || "");
      showToast("Consultation completed. Redirecting to issue prescription...");
      setTimeout(() => {
        onNavigateTab("prescriptions", {
          patientName: patient?.name || "Patient",
          patientId: patient?._id || `PAT-${appointment._id.slice(-6)}`,
          patientAge: patient?.age || null,
          patientGender: patient?.gender || null,
          diagnosis: appointment?.reason || "Consultation Diagnosis",
          preferredLanguage:
            patient?.language || appointment?.interpreterLanguage || "English",
          appointmentId: appointment._id,
          fromConsultation: true,
        });
      }, 700);
    } catch (err) {
      console.error("Error completing consultation in MongoDB:", err);
      showToast(err.message || "Failed to complete consultation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndAndWrapUp = async () => {
    if (!appointment?._id) return;
    try {
      setActionLoading(true);
      endConsultation(appointment.notes || "Consultation Wrapped Up");
      await completeAppointment(appointment._id, appointment.notes || "");
      showToast("Consultation ended. Appointment successfully marked as completed.");
      setTimeout(() => {
        onNavigateTab("appointments");
      }, 800);
    } catch (err) {
      console.error("Error ending consultation in MongoDB:", err);
      showToast(err.message || "Failed to wrap up consultation");
    } finally {
      setActionLoading(false);
    }
  };

  const patientDisplayName = patient?.name || "Patient";
  const patientAgeText = patient?.age ? `${patient.age}y` : "";
  const patientGenderText = patient?.gender || "";
  const patientBloodGroup = patient?.bloodGroup || "Not recorded";
  const patientLanguage =
    patient?.language || appointment.interpreterLanguage || "English";
  const roomId = appointment._id
    ? `APT-${appointment._id.slice(-6).toUpperCase()}`
    : "LIVE";
  const doctorPiPName = user?.name
    ? `Dr. ${user.name.replace(/^Dr\.?\s*/i, "")}`
    : "Doctor";
  const isNonEnglish =
    patientLanguage && patientLanguage.toLowerCase() !== "english";

  return (
    <div className="doctor-consultations-tab">
      {/* Permission / Connection Alert */}
      {(errorMessage || permissionDenied) && (
        <div
          className="doctor-toast"
          style={{
            background: "#fef2f2",
            borderColor: "#fecaca",
            color: "#dc2626",
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            className="doctor-btn-primary doctor-btn-sm"
            onClick={retryConnection}
            style={{ padding: "4px 10px", fontSize: "11px" }}
          >
            <RefreshCw size={12} />
            <span>Retry Camera/Mic</span>
          </button>
        </div>
      )}

      {/* Consult Room Header */}
      <div className="consult-room-header">
        <div className="consult-patient-meta">
          <div className="live-tag">
            <span className="live-dot"></span>
            LIVE CONSULTATION
          </div>
          <h3>{patientDisplayName}</h3>
          <span className="meta-sub">
            {patientAgeText && `${patientAgeText} • `}
            {patientGenderText && `${patientGenderText} • `}
            Blood Group: {patientBloodGroup} • Language: {patientLanguage}
          </span>
        </div>

        <div className="consult-header-actions">
          {/* Interpreter Status Pill / Request Button */}
          {interpreterStatus === "Connected" ? (
            <div className="interpreter-active-pill">
              <UserCheck size={15} />
              <span>Interpreter Connected ({selectedLanguage})</span>
            </div>
          ) : (
            <button
              type="button"
              className="doctor-btn-secondary"
              onClick={() => setIsInterpreterModalOpen(true)}
              disabled={actionLoading}
            >
              <Languages size={15} />
              <span>Request Interpreter</span>
            </button>
          )}

          <button
            type="button"
            className="doctor-btn-primary"
            onClick={handleCompleteConsultation}
            disabled={actionLoading}
            id="doctor-complete-prescribe-btn"
          >
            {actionLoading ? (
              <Loader2 size={15} className="doctor-spin-icon" />
            ) : (
              <FileText size={15} />
            )}
            <span>Complete & Prescribe</span>
          </button>
        </div>
      </div>

      {/* Main Consultation Layout: Video Feed (Left) & Clinical Side Panel (Right) */}
      <div className="consult-room-grid">
        {/* Left Column: Video Area & Stream Controls */}
        <div className="consult-video-col">
          <div className="video-surface-card">
            {/* Main Patient Video Feed Container */}
            <div className="main-video-feed" style={{ position: "relative" }}>
              <div className="video-overlay-top" style={{ zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="room-id-tag">Room ID: {roomId}</span>
                  {connectionStatus === "CONNECTED" ? (
                    <span
                      style={{
                        background: "rgba(16, 185, 129, 0.25)",
                        color: "#34d399",
                        border: "1px solid rgba(16, 185, 129, 0.4)",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      ● Patient Connected (HD)
                    </span>
                  ) : connectionStatus === "CONNECTING" ? (
                    <span
                      style={{
                        background: "rgba(14, 165, 233, 0.25)",
                        color: "#38bdf8",
                        border: "1px solid rgba(14, 165, 233, 0.4)",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      ● Connecting Stream...
                    </span>
                  ) : connectionStatus === "WAITING_FOR_PEER" ? (
                    <span
                      style={{
                        background: "rgba(245, 158, 11, 0.25)",
                        color: "#fbbf24",
                        border: "1px solid rgba(245, 158, 11, 0.4)",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      ● Waiting for Patient
                    </span>
                  ) : (
                    <span
                      style={{
                        background: "rgba(148, 163, 184, 0.25)",
                        color: "#cbd5e1",
                        border: "1px solid rgba(148, 163, 184, 0.4)",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      ● Telehealth Active
                    </span>
                  )}
                </div>

                <span className="session-timer">
                  <Clock size={13} /> {sessionTimer}
                </span>
              </div>

              {/* Video Tile Area: Multi-Peer Grid for Patient + Interpreter, or Single Tile for Patient */}
              {hasInterpreter ? (
                <div
                  className="multi-peer-grid"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    padding: "10px",
                    boxSizing: "border-box",
                    zIndex: 2,
                  }}
                >
                  {/* Patient Tile */}
                  <RemoteParticipantTile
                    peer={patientPeer}
                    defaultLabel={patientDisplayName}
                    defaultRole="patient"
                  />

                  {/* Interpreter Tile */}
                  <RemoteParticipantTile
                    peer={interpreterPeer}
                    defaultLabel={appointment.interpreter?.name || "Medical Interpreter"}
                    defaultRole="interpreter"
                  />
                </div>
              ) : (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 2,
                  }}
                >
                  <RemoteParticipantTile
                    peer={patientPeer}
                    defaultLabel={patientDisplayName}
                    defaultRole="patient"
                  />
                </div>
              )}

              {/* Subtitles Overlay */}
              <div className="video-subtitles-bar" style={{ zIndex: 10 }}>
                <div className="subtitle-header">
                  <Sparkles size={13} />
                  <span>
                    {isNonEnglish || appointment.interpreterRequested
                      ? `Live Speech Relay (${patientLanguage} ➔ English)`
                      : "Real-time Clinical Audio Stream (Encrypted)"}
                  </span>
                </div>
                <p className="subtitle-text">
                  {chatMessages.length > 0
                    ? `[Latest Message]: "${chatMessages[chatMessages.length - 1].text}"`
                    : isNonEnglish || appointment.interpreterRequested
                    ? `[Live WebRTC audio channel synchronized • Audio calibrated for ${patientLanguage}]`
                    : "[Direct encrypted Patient ↔ Doctor WebRTC video channel active]"}
                </p>
              </div>

              {/* Doctor Picture-in-Picture (PiP) Preview */}
              <div
                className={`pip-doctor-feed ${!isCameraOn ? "video-off" : ""}`}
                style={{ zIndex: 10 }}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="local-video-element"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "8px",
                    display: isCameraOn && localStream ? "block" : "none",
                  }}
                />

                {(!isCameraOn || !localStream) && (
                  <div className="pip-placeholder">
                    <VideoOff size={18} />
                    <span>Camera Off</span>
                  </div>
                )}

                <span className="pip-label">You ({doctorPiPName})</span>

                {!isMicOn && (
                  <div className="pip-muted-tag" title="Microphone muted">
                    <MicOff size={12} />
                  </div>
                )}
              </div>
            </div>

            {/* Video Call Controls Bar */}
            <div className="video-controls-bar">
              <div className="controls-left">
                <button
                  type="button"
                  className={`ctrl-btn ${!isMicOn ? "danger active" : ""}`}
                  onClick={toggleMic}
                  title={!isMicOn ? "Unmute Microphone" : "Mute Microphone"}
                  id="doctor-mic-toggle-btn"
                >
                  {!isMicOn ? <MicOff size={18} /> : <Mic size={18} />}
                  <span>{!isMicOn ? "Unmute" : "Mute"}</span>
                </button>

                <button
                  type="button"
                  className={`ctrl-btn ${!isCameraOn ? "danger active" : ""}`}
                  onClick={toggleCamera}
                  title={!isCameraOn ? "Turn Camera On" : "Turn Camera Off"}
                  id="doctor-camera-toggle-btn"
                >
                  {!isCameraOn ? <VideoOff size={18} /> : <Video size={18} />}
                  <span>{!isCameraOn ? "Start Video" : "Stop Video"}</span>
                </button>

                <button
                  type="button"
                  className={`ctrl-btn ${isScreenSharing ? "primary active" : ""}`}
                  onClick={() => {
                    setIsScreenSharing(!isScreenSharing);
                    showToast(
                      isScreenSharing
                        ? "Screen share stopped"
                        : "Screen sharing stream activated"
                    );
                  }}
                  title="Share Screen / ECG / Lab PDF"
                >
                  <Monitor size={18} />
                  <span>{isScreenSharing ? "Sharing" : "Share"}</span>
                </button>
              </div>

              <div className="controls-right">
                <button
                  type="button"
                  className="ctrl-btn end-call-btn"
                  onClick={handleEndAndWrapUp}
                  disabled={actionLoading}
                  title="End Consultation Session"
                  id="doctor-end-consultation-btn"
                >
                  {actionLoading ? (
                    <Loader2 size={16} className="doctor-spin-icon" />
                  ) : (
                    <PhoneOff size={18} />
                  )}
                  <span>End & Wrap Up</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Patient Clinical History, Live Chat, and Vitals */}
        <div className="consult-side-col">
          <div className="doctor-card consult-side-card">
            {/* Side Tabs Selector */}
            <div className="consult-side-tabs">
              <button
                type="button"
                className={`side-tab-btn ${
                  activeSideTab === "history" ? "active" : ""
                }`}
                onClick={() => setActiveSideTab("history")}
              >
                <Activity size={14} />
                <span>Medical History</span>
              </button>
              <button
                type="button"
                className={`side-tab-btn ${
                  activeSideTab === "chat" ? "active" : ""
                }`}
                onClick={() => setActiveSideTab("chat")}
              >
                <Send size={14} />
                <span>Live Chat ({chatMessages.length})</span>
              </button>
              <button
                type="button"
                className={`side-tab-btn ${
                  activeSideTab === "vitals" ? "active" : ""
                }`}
                onClick={() => setActiveSideTab("vitals")}
              >
                <HeartPulse size={14} />
                <span>Vitals</span>
              </button>
            </div>

            {/* TAB 1: MEDICAL HISTORY */}
            {activeSideTab === "history" && (
              <div className="side-tab-content history-tab-pane">
                {/* Current Reason / Complaint */}
                <div className="history-section" style={{ marginBottom: "14px" }}>
                  <label className="section-title">
                    Chief Complaint / Reason for Visit
                  </label>
                  <div
                    style={{
                      background: "#f8fafc",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "13px",
                      color: "#1e293b",
                      lineHeight: 1.45,
                    }}
                  >
                    {appointment.reason}
                  </div>
                </div>

                {/* Allergies Alert */}
                <div className="history-alert-box">
                  <div className="alert-title">
                    <AlertCircle size={15} />
                    <span>Documented Allergies</span>
                  </div>
                  <div className="allergy-tags-list">
                    {patient?.allergies && patient.allergies.length > 0 ? (
                      patient.allergies.map((all, idx) => (
                        <span key={idx} className="allergy-tag">
                          {all}
                        </span>
                      ))
                    ) : (
                      <span
                        className="allergy-tag"
                        style={{
                          background: "#f1f5f9",
                          color: "#64748b",
                          borderColor: "#cbd5e1",
                        }}
                      >
                        No known documented drug or food allergies (NKDA)
                      </span>
                    )}
                  </div>
                </div>

                {/* Chronic Conditions */}
                <div className="history-section">
                  <label className="section-title">Chronic Conditions</label>
                  {patient?.chronicConditions &&
                  patient.chronicConditions.length > 0 ? (
                    <ul className="conditions-list">
                      {patient.chronicConditions.map((cond, idx) => (
                        <li key={idx}>
                          <CheckCircle2 size={13} className="bullet-icon" />
                          <span>{cond}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p
                      style={{
                        fontSize: "12.5px",
                        color: "#64748b",
                        margin: "4px 0 0 0",
                        fontStyle: "italic",
                      }}
                    >
                      No chronic conditions recorded.
                    </p>
                  )}
                </div>

                {/* Current Medications */}
                <div className="history-section">
                  <label className="section-title">Current Medications</label>
                  {patient?.currentMedications &&
                  patient.currentMedications.length > 0 ? (
                    <div className="meds-list">
                      {patient.currentMedications.map((med, idx) => (
                        <div key={idx} className="med-row">
                          <div className="med-name-col">
                            <strong>
                              {typeof med === "string" ? med : med.name}
                            </strong>
                            {med.dose && (
                              <span className="med-dose">{med.dose}</span>
                            )}
                          </div>
                          {med.freq && (
                            <span className="med-freq">{med.freq}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p
                      style={{
                        fontSize: "12.5px",
                        color: "#64748b",
                        margin: "4px 0 0 0",
                        fontStyle: "italic",
                      }}
                    >
                      No active medications recorded for this patient.
                    </p>
                  )}
                </div>

                {/* Previous Clinical Notes & Past Consultations */}
                <div className="history-section">
                  <label className="section-title">
                    Previous Consultation Records
                  </label>
                  {previousRecords && previousRecords.length > 0 ? (
                    <div className="notes-list">
                      {previousRecords.map((prevApt) => (
                        <div
                          key={prevApt._id}
                          className="prev-note-item"
                          style={{
                            marginBottom: "10px",
                            padding: "10px",
                            background: "#f8fafc",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "4px",
                            }}
                          >
                            <strong
                              style={{ fontSize: "12.5px", color: "#0f172a" }}
                            >
                              {prevApt.date} at {prevApt.time}
                            </strong>
                            <span
                              style={{
                                fontSize: "10.5px",
                                fontWeight: 700,
                                color:
                                  prevApt.status === "Completed"
                                    ? "#16a34a"
                                    : "#64748b",
                                backgroundColor:
                                  prevApt.status === "Completed"
                                    ? "#dcfce7"
                                    : "#f1f5f9",
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              {prevApt.status}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#475569",
                              margin: "0 0 4px 0",
                            }}
                          >
                            <strong>Reason:</strong> {prevApt.reason}
                          </p>
                          {prevApt.notes && (
                            <p
                              style={{
                                fontSize: "12px",
                                color: "#334155",
                                margin: 0,
                                fontStyle: "italic",
                              }}
                            >
                              <strong>Notes:</strong> {prevApt.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p
                      style={{
                        fontSize: "12.5px",
                        color: "#64748b",
                        margin: "4px 0 0 0",
                        fontStyle: "italic",
                      }}
                    >
                      No previous consultation records found for this patient.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: LIVE REAL-TIME CHAT */}
            {activeSideTab === "chat" && (
              <div className="side-tab-content chat-tab-pane">
                <div className="chat-messages-container">
                  <div className="chat-bubble-row system">
                    <div className="system-msg-box">
                      <Shield size={12} />
                      <span>
                        Secure encrypted HealTalk telehealth channel active for{" "}
                        {patientDisplayName}.
                      </span>
                    </div>
                  </div>

                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`chat-bubble-row ${
                        msg.role === "doctor" || msg.role === "Doctor"
                          ? "outgoing"
                          : "incoming"
                      }`}
                    >
                      <div className="chat-bubble">
                        <div className="bubble-meta">
                          <span className="sender">{msg.sender}</span>
                          <span className="time">{msg.time}</span>
                        </div>
                        <p className="bubble-text">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="chat-input-bar">
                  <input
                    type="text"
                    placeholder="Type message or clinical instruction..."
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="send-msg-btn"
                    disabled={!newMessageText.trim()}
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: VITALS */}
            {activeSideTab === "vitals" && (
              <div className="side-tab-content vitals-tab-pane">
                <div className="vitals-grid">
                  <div
                    className={`vital-card ${
                      patient?.vitals?.bloodPressure ? "alert" : ""
                    }`}
                  >
                    <span className="vital-label">Blood Pressure</span>
                    <span className="vital-value">
                      {patient?.vitals?.bloodPressure || "--"}
                    </span>
                    <span className="vital-sub">
                      {patient?.vitals?.bloodPressure
                        ? "Recorded Reading"
                        : "Not recorded"}
                    </span>
                  </div>

                  <div className="vital-card">
                    <span className="vital-label">Heart Rate</span>
                    <span className="vital-value">
                      {patient?.vitals?.heartRate || "--"}
                    </span>
                    <span className="vital-sub">
                      {patient?.vitals?.heartRate ? "BPM" : "Not recorded"}
                    </span>
                  </div>

                  <div className="vital-card">
                    <span className="vital-label">Oxygen Saturation (SpO2)</span>
                    <span className="vital-value">
                      {patient?.vitals?.oxygenSat || "--"}
                    </span>
                    <span className="vital-sub">
                      {patient?.vitals?.oxygenSat ? "% Saturation" : "Not recorded"}
                    </span>
                  </div>

                  <div className="vital-card">
                    <span className="vital-label">Body Temperature</span>
                    <span className="vital-value">
                      {patient?.vitals?.temperature || "--"}
                    </span>
                    <span className="vital-sub">
                      {patient?.vitals?.temperature ? "°F" : "Not recorded"}
                    </span>
                  </div>

                  <div className="vital-card">
                    <span className="vital-label">Weight</span>
                    <span className="vital-value">
                      {patient?.vitals?.weight || "--"}
                    </span>
                    <span className="vital-sub">
                      {patient?.vitals?.weight ? "kg / lbs" : "Not recorded"}
                    </span>
                  </div>

                  <div className="vital-card">
                    <span className="vital-label">Height</span>
                    <span className="vital-value">
                      {patient?.vitals?.height || "--"}
                    </span>
                    <span className="vital-sub">
                      {patient?.vitals?.height ? "cm / ft" : "Not recorded"}
                    </span>
                  </div>
                </div>

                <div className="vitals-footer-action">
                  <button
                    type="button"
                    className="doctor-btn-secondary doctor-btn-sm"
                    onClick={() =>
                      showToast("Vitals status confirmed for current session")
                    }
                  >
                    <CheckCircle2 size={13} />
                    <span>Verify Vitals</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DoctorConsultationsTab({ onNavigateTab, initialSession, user }) {
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [previousRecords, setPreviousRecords] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [sessionTimer, setSessionTimer] = useState("00:00");
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Interpreter Request Modal State
  const [isInterpreterModalOpen, setIsInterpreterModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("Spanish");
  const [interpreterStatus, setInterpreterStatus] = useState("None"); // None, Requested, Connected
  const [actionToast, setActionToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Timer interval for active session duration
  useEffect(() => {
    let timerInterval = null;
    if (isJoined) {
      timerInterval = setInterval(() => {
        setSessionSeconds((prev) => {
          const next = prev + 1;
          const mins = Math.floor(next / 60);
          const secs = next % 60;
          setSessionTimer(
            `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
          );
          return next;
        });
      }, 1000);
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isJoined]);

  const showToast = (message) => {
    setActionToast(message);
    setTimeout(() => setActionToast(null), 3500);
  };

  // Load real consultation data from MongoDB
  const loadConsultationData = useCallback(async () => {
    try {
      setLoading(true);
      let targetAptId = initialSession?._id || initialSession?.id;

      // If no initialSession passed, check only for active IN PROGRESS sessions (DO NOT auto-load pending/upcoming)
      if (!targetAptId) {
        const aptsData = await fetchDoctorAppointments();
        if (aptsData && aptsData.appointments && aptsData.appointments.length > 0) {
          const inProgress = aptsData.appointments.find(
            (a) => a.status === "In Progress"
          );
          if (inProgress) {
            targetAptId = inProgress._id;
          }
        }
      }

      if (!targetAptId) {
        setAppointment(null);
        setPatient(null);
        setPreviousRecords([]);
        setIsJoined(false);
        setLoading(false);
        return;
      }

      const res = await fetchAppointmentById(targetAptId);
      if (res && res.appointment) {
        const apt = res.appointment;
        setAppointment(apt);
        setPatient(apt.patient || null);
        setPreviousRecords(res.previousAppointments || []);

        const isInterpReq = !!apt.interpreterRequested;
        const interpLang =
          apt.interpreterLanguage || apt.patient?.language || "Spanish";
        setInterpreterStatus(isInterpReq ? "Connected" : "None");
        setSelectedLanguage(interpLang);

        // If explicit initialSession was passed with confirmed/in-progress status, start consultation
        if (apt.status === "Confirmed" || apt.status === "In Progress") {
          setIsJoined(true);
        } else {
          setIsJoined(false);
        }
      } else {
        setAppointment(null);
        setPatient(null);
        setIsJoined(false);
      }
    } catch (err) {
      console.error("Failed to load real consultation data from MongoDB:", err);
      showToast("Error loading consultation data from server");
    } finally {
      setLoading(false);
    }
  }, [initialSession]);

  useEffect(() => {
    loadConsultationData();
  }, [loadConsultationData]);

  const handleConfirmInterpreter = async (e) => {
    e.preventDefault();
    if (!appointment?._id) return;

    try {
      setActionLoading(true);
      await requestAppointmentInterpreter(appointment._id, selectedLanguage);
      setInterpreterStatus("Connected");
      setIsInterpreterModalOpen(false);
      showToast(
        `Live certified ${selectedLanguage} interpreter connected to session`
      );
    } catch (err) {
      console.error("Error requesting interpreter from backend:", err);
      showToast(err.message || "Failed to request interpreter");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="doctor-tab-loading">
        <Loader2 size={32} className="doctor-spin-icon" />
        <p>Connecting to secure encrypted telehealth consultation room...</p>
      </div>
    );
  }

  // If no appointment found, render professional empty state
  if (!appointment) {
    return (
      <div
        className="doctor-card"
        style={{
          textAlign: "center",
          padding: "60px 24px",
          margin: "20px auto",
          maxWidth: "600px",
        }}
      >
        <Video size={48} style={{ color: "#087f8c", margin: "0 auto 16px" }} />
        <h3
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: "8px",
          }}
        >
          No Active Consultation
        </h3>
        <p
          style={{
            fontSize: "13.5px",
            color: "#64748b",
            lineHeight: 1.5,
            margin: "0 auto 24px",
          }}
        >
          You currently do not have an active live consultation. View your scheduled
          appointments to accept pending requests or start a confirmed consultation.
        </p>
        <button
          type="button"
          className="doctor-btn-primary"
          onClick={() => onNavigateTab("appointments")}
          style={{ margin: "0 auto" }}
        >
          <Calendar size={15} />
          <span>View Scheduled Appointments</span>
        </button>
      </div>
    );
  }

  // If appointment is Pending, show Pending Notice and Accept button (DO NOT start WebRTC)
  if (appointment.status === "Pending") {
    return (
      <div
        className="doctor-card"
        style={{
          maxWidth: "620px",
          margin: "24px auto",
          padding: "36px 30px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "#fffbeb",
            color: "#d97706",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px auto",
          }}
        >
          <Clock size={28} />
        </div>
        <h3
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: "8px",
          }}
        >
          Appointment Request Pending
        </h3>
        <p
          style={{
            fontSize: "14px",
            color: "#64748b",
            lineHeight: 1.6,
            marginBottom: "24px",
          }}
        >
          The consultation request for <strong>{patient?.name || "Patient"}</strong> on{" "}
          {appointment.date} at {appointment.time} is pending your confirmation.
          You must accept the appointment before the consultation room can be started.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            type="button"
            className="doctor-btn-secondary"
            onClick={() => onNavigateTab("appointments")}
          >
            Back to Appointments
          </button>
          <button
            type="button"
            className="doctor-btn-primary"
            style={{ background: "#16a34a", borderColor: "#16a34a" }}
            disabled={actionLoading}
            onClick={async () => {
              try {
                setActionLoading(true);
                await confirmAppointment(appointment._id);
                setAppointment((prev) => ({ ...prev, status: "Confirmed" }));
                setIsJoined(true);
                showToast("Appointment accepted & confirmed. Entering live consultation room...");
              } catch (err) {
                showToast(err.message || "Failed to accept appointment");
              } finally {
                setActionLoading(false);
              }
            }}
          >
            {actionLoading ? (
              <Loader2 size={14} className="doctor-spin-icon" />
            ) : (
              <CheckCircle2 size={15} />
            )}
            <span>Accept & Start Consulting</span>
          </button>
        </div>
      </div>
    );
  }

  // If Confirmed but doctor hasn't joined yet
  if (!isJoined && appointment.status === "Confirmed") {
    return (
      <div
        className="doctor-card"
        style={{
          maxWidth: "600px",
          margin: "24px auto",
          padding: "36px 30px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "#ecfdf5",
            color: "#16a34a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px auto",
          }}
        >
          <CheckCircle2 size={28} />
        </div>
        <h3
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: "8px",
          }}
        >
          Confirmed Consultation Ready
        </h3>
        <p
          style={{
            fontSize: "14px",
            color: "#64748b",
            lineHeight: 1.6,
            marginBottom: "24px",
          }}
        >
          Appointment with <strong>{patient?.name || "Patient"}</strong> on{" "}
          {appointment.date} at {appointment.time} is confirmed. Click below to
          open the secure WebRTC video room and begin consulting.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            type="button"
            className="doctor-btn-secondary"
            onClick={() => onNavigateTab("appointments")}
          >
            Back to Appointments
          </button>
          <button
            type="button"
            className="doctor-btn-primary"
            onClick={() => setIsJoined(true)}
          >
            <Video size={16} />
            <span>Start Consulting</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {actionToast && (
        <div className="doctor-toast">
          <CheckCircle2 size={16} />
          <span>{actionToast}</span>
        </div>
      )}

      <ActiveDoctorRoom
        appointment={appointment}
        patient={patient}
        previousRecords={previousRecords}
        onNavigateTab={onNavigateTab}
        user={user}
        sessionTimer={sessionTimer}
        interpreterStatus={interpreterStatus}
        setInterpreterStatus={setInterpreterStatus}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        setIsInterpreterModalOpen={setIsInterpreterModalOpen}
        showToast={showToast}
        actionLoading={actionLoading}
        setActionLoading={setActionLoading}
      />

      {/* Request Interpreter Modal */}
      {isInterpreterModalOpen && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setIsInterpreterModalOpen(false)}
        >
          <div
            className="admin-details-modal interpreter-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>Request Live Certified Medical Interpreter</h3>
                <p>Connect a HIPAA-compliant translator to the active video call</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsInterpreterModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmInterpreter}>
              <div className="modal-body">
                <div className="settings-input-group">
                  <label htmlFor="interpreter-lang">Select Patient Language</label>
                  <select
                    id="interpreter-lang"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="settings-select"
                  >
                    {AVAILABLE_INTERPRETER_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="interpreter-match-preview">
                  <div className="preview-icon">
                    <Globe size={22} />
                  </div>
                  <div className="preview-details">
                    <h4>CCHI & NBCMI Certified Medical Interpreters</h4>
                    <p>
                      On-demand medical translation requested for{" "}
                      {selectedLanguage}. Audio and video translation supported.
                    </p>
                  </div>
                </div>
              </div>

              <div className="modal-footer settings-modal-footer">
                <button
                  type="button"
                  className="doctor-btn-secondary"
                  onClick={() => setIsInterpreterModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="doctor-btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 size={15} className="doctor-spin-icon" />
                  ) : (
                    <UserCheck size={15} />
                  )}
                  <span>Connect Interpreter Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default DoctorConsultationsTab;
