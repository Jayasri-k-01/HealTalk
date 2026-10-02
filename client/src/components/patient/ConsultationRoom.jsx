import { useState, useEffect } from "react";
import {
  fetchMyAppointments,
  fetchAppointmentById,
  requestAppointmentInterpreter,
} from "../../services/appointmentService";
import useWebRTC from "../../services/useWebRTC";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Globe,
  Languages,
  MessageSquare,
  User,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Sparkles,
  Clock,
  Calendar,
  Send,
  FileText,
  ShieldCheck,
  Pill,
  RefreshCw,
} from "lucide-react";

/**
 * Inner Active Video Room Component to handle WebRTC lifecycle cleanly
 */
function ActivePatientVideoRoom({
  currentAppointment,
  user,
  doctorName,
  doctorSpecialty,
  patientData,
  patientName,
  targetLanguage,
  setTargetLanguage,
  translationActive,
  setTranslationActive,
  interpreterConnected,
  handleRequestInterpreter,
  requestingInterp,
  previousAppointments,
  onLeaveRoom,
  setActiveTab,
}) {
  const [activeSideTab, setActiveSideTab] = useState("chat");
  const [chatInput, setChatInput] = useState("");

  const {
    connectionStatus,
    statusMessage,
    errorMessage,
    permissionDenied,
    localStream,
    isMicOn,
    isCameraOn,
    remoteMediaState,
    chatMessages,
    localVideoRef,
    remoteVideoRef,
    toggleMic,
    toggleCamera,
    sendChatMessage,
    leaveConsultation,
    retryConnection,
  } = useWebRTC({
    appointmentId: currentAppointment.id,
    user,
    onConsultationEnded: () => {
      // Notification handled in state
    },
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput("");
  };

  const handleEndCall = () => {
    if (window.confirm("Are you sure you want to leave this consultation room?")) {
      leaveConsultation();
      onLeaveRoom();
    }
  };

  const isRemoteVideoVisible =
    connectionStatus === "CONNECTED" && remoteMediaState.isVideoEnabled;

  return (
    <div className="consultation-room-container">
      {/* 1. CONSULTATION HEADER */}
      <div className="room-top-banner">
        <div className="room-title-area">
          <div className="room-doc-avatar">
            <Stethoscope size={24} />
          </div>
          <div className="room-title-text">
            <h2>{doctorName}</h2>
            <div className="room-meta-row">
              <span className="room-meta-pill specialty">{doctorSpecialty}</span>
              {connectionStatus === "CONNECTED" ? (
                <span className="room-meta-pill status-confirmed">
                  ● Live Connected (HD)
                </span>
              ) : connectionStatus === "CONNECTING" ? (
                <span className="room-meta-pill status-inprogress">
                  ● Connecting Stream...
                </span>
              ) : connectionStatus === "WAITING_FOR_PEER" ? (
                <span className="room-meta-pill status-pending">
                  ● Waiting for Doctor
                </span>
              ) : connectionStatus === "ERROR" ? (
                <span
                  className="room-meta-pill"
                  style={{
                    background: "rgba(239, 68, 68, 0.2)",
                    color: "#f87171",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                  }}
                >
                  ● Connection Alert
                </span>
              ) : (
                <span className="room-meta-pill status-inprogress">
                  ● Active Consultation
                </span>
              )}
              <span style={{ fontSize: "12px", color: "#a5cdd4" }}>
                ID: #{currentAppointment.id}
              </span>
            </div>
          </div>
        </div>

        <div className="room-header-details">
          <div className="room-detail-item">
            <User size={14} style={{ color: "#38bdf8" }} />
            <span>
              Patient: <strong>{patientName}</strong>
            </span>
          </div>

          <div className="room-detail-item">
            <Calendar size={14} style={{ color: "#38bdf8" }} />
            <span>
              {currentAppointment.date} &bull; {currentAppointment.time}
            </span>
          </div>

          <div className="room-detail-item">
            <Video size={14} style={{ color: "#38bdf8" }} />
            <span>{currentAppointment.type || "Video Call"}</span>
          </div>

          <div className="language-indicator-box">
            <Globe size={14} style={{ color: "#38bdf8" }} />
            <span>Language:</span>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="room-lang-select"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="Hindi">Hindi</option>
              <option value="French">French</option>
              <option value="Mandarin">Mandarin</option>
              <option value="Tamil">Tamil</option>
              <option value="German">German</option>
              <option value="Arabic">Arabic</option>
            </select>
          </div>
        </div>
      </div>

      {/* Permission / Error Banner */}
      {(errorMessage || permissionDenied) && (
        <div
          className="auth-alert alert-error"
          style={{
            margin: 0,
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
            <span>Retry Media Access</span>
          </button>
        </div>
      )}

      {/* 2. MAIN CONSULTATION AREA */}
      <div className="room-grid">
        {/* Left Column: Video Screen & Controls */}
        <div className="video-column">
          <div className="main-video-feed" style={{ position: "relative" }}>
            {/* Floating Telemedicine Security Badge */}
            <div className="channel-secure-badge" style={{ zIndex: 10 }}>
              <ShieldCheck size={14} />
              <span>Encrypted HealTalk WebRTC Telemedicine Channel</span>
            </div>

            {/* Remote Video Stream Element */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="remote-video-element"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                position: "absolute",
                top: 0,
                left: 0,
                display: isRemoteVideoVisible ? "block" : "none",
                zIndex: 2,
              }}
            />

            {/* Doctor Video State Placeholder when video stream is not active */}
            {!isRemoteVideoVisible && (
              <div
                className="doctor-video-placeholder"
                style={{ position: "relative", zIndex: 3 }}
              >
                <div className="doc-feed-avatar">
                  <Stethoscope size={40} />
                </div>
                <span className="feed-name">{doctorName}</span>
                <div className="feed-status-tag">
                  <span
                    className="red-dot"
                    style={{
                      background:
                        connectionStatus === "CONNECTED"
                          ? "#10b981"
                          : connectionStatus === "CONNECTING"
                          ? "#38bdf8"
                          : "#f59e0b",
                    }}
                  ></span>
                  <span>{statusMessage}</span>
                </div>
                <p
                  style={{
                    fontSize: "12px",
                    color: "rgba(255, 255, 255, 0.65)",
                    marginTop: "8px",
                    maxWidth: "420px",
                  }}
                >
                  {connectionStatus === "WAITING_FOR_PEER"
                    ? "The doctor will appear here automatically as soon as they join this consultation slot."
                    : connectionStatus === "CONNECTING"
                    ? "Securing peer-to-peer WebRTC video handshake..."
                    : connectionStatus === "CONNECTED" && !remoteMediaState.isVideoEnabled
                    ? "Doctor has temporarily turned off their camera (Audio stream active)."
                    : "Encrypted direct peer-to-peer telemedicine channel active."}
                </p>

                {/* Subtitles Overlay */}
                {translationActive && (
                  <div className="live-subtitles-overlay" style={{ zIndex: 10 }}>
                    <div className="subtitles-badge">
                      <Sparkles size={13} />
                      <span>Live Speech Channel ({targetLanguage})</span>
                    </div>
                    <p className="subtitles-text">
                      {chatMessages.length > 0
                        ? `"${chatMessages[chatMessages.length - 1].text}"`
                        : `"Real-time consultation audio stream calibrated for ${targetLanguage}."`}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Patient Self Video Window (Picture-in-Picture) */}
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
                border: "2px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.4)",
                background: "#0f172a",
                zIndex: 10,
              }}
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
                  background: "rgba(0, 0, 0, 0.5)",
                  padding: "2px 4px",
                  borderRadius: "4px",
                }}
              >
                <span
                  style={{
                    maxWidth: "80px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  You
                </span>
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
              id="patient-mic-toggle-btn"
            >
              {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
              <span>{isMicOn ? "Mute" : "Unmuted"}</span>
            </button>

            <button
              onClick={toggleCamera}
              className={`ctrl-btn ${!isCameraOn ? "muted" : ""}`}
              title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
              id="patient-camera-toggle-btn"
            >
              {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
              <span>{isCameraOn ? "Camera On" : "Camera Off"}</span>
            </button>

            <button
              onClick={() => setTranslationActive(!translationActive)}
              className={`ctrl-btn ${translationActive ? "active-feature" : ""}`}
            >
              <Languages size={18} />
              <span>Translation {translationActive ? "ON" : "OFF"}</span>
            </button>

            <button
              onClick={() => handleRequestInterpreter(targetLanguage)}
              disabled={requestingInterp}
              className={`ctrl-btn ${interpreterConnected ? "active-feature" : ""}`}
            >
              <Globe size={18} />
              <span>
                {interpreterConnected
                  ? `Interpreter (${
                      currentAppointment.interpreterLanguage || targetLanguage
                    })`
                  : "Request Interpreter"}
              </span>
            </button>

            <button
              onClick={handleEndCall}
              className="ctrl-btn leave-btn"
              id="patient-leave-consultation-btn"
            >
              <PhoneOff size={18} />
              <span>Leave Room</span>
            </button>
          </div>
        </div>

        {/* 3. RIGHT PANEL (TABS: CHAT, PATIENT INFO, MEDICAL HISTORY, INTERPRETER) */}
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
              className={`panel-tab ${activeSideTab === "patient-info" ? "active" : ""}`}
              onClick={() => setActiveSideTab("patient-info")}
            >
              <User size={15} />
              <span>Patient Info</span>
            </button>

            <button
              className={`panel-tab ${activeSideTab === "history" ? "active" : ""}`}
              onClick={() => setActiveSideTab("history")}
            >
              <FileText size={15} />
              <span>Medical History</span>
            </button>

            <button
              className={`panel-tab ${activeSideTab === "interpreter" ? "active" : ""}`}
              onClick={() => setActiveSideTab("interpreter")}
            >
              <Globe size={15} />
              <span>Interpreter</span>
            </button>
          </div>

          <div className="panel-content">
            {/* TAB 1: REAL-TIME CHAT */}
            {activeSideTab === "chat" && (
              <div className="transcript-stream">
                <div className="transcript-intro">
                  <Sparkles size={14} />
                  <span>Real-Time Consultation Chat with {doctorName}</span>
                </div>

                <div className="messages-flow">
                  <div
                    style={{
                      background: "#f0f7f8",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#334e54",
                      textAlign: "center",
                    }}
                  >
                    <ShieldCheck
                      size={13}
                      style={{
                        verticalAlign: "middle",
                        marginRight: "4px",
                        color: "#087f8c",
                      }}
                    />
                    Consultation session active for {doctorName} &bull;{" "}
                    {currentAppointment.date}
                  </div>

                  {chatMessages.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        color: "#8aa1a5",
                        fontSize: "13px",
                        padding: "30px 10px",
                      }}
                    >
                      No messages sent yet. Send a note or symptom to {doctorName}{" "}
                      during your consultation.
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`transcript-bubble ${
                          msg.role === "doctor" || msg.role === "Doctor"
                            ? "doctor-msg"
                            : "patient-msg"
                        }`}
                      >
                        <div className="msg-author-row">
                          <strong>{msg.sender}</strong>
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
                    placeholder="Type message to doctor..."
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
                    style={{ padding: "8px 14px", borderRadius: "8px" }}
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: PATIENT INFORMATION */}
            {activeSideTab === "patient-info" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="clinical-info-card">
                  <label>Full Patient Name</label>
                  <p>{patientName}</p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <div className="clinical-info-card">
                    <label>Age</label>
                    <p>{patientData.age || "Not recorded"}</p>
                  </div>
                  <div className="clinical-info-card">
                    <label>Gender</label>
                    <p>{patientData.gender || "Not recorded"}</p>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <div className="clinical-info-card">
                    <label>Blood Group</label>
                    <p style={{ color: "#dc2626", fontWeight: "700" }}>
                      {patientData.bloodGroup || "Not recorded"}
                    </p>
                  </div>
                  <div className="clinical-info-card">
                    <label>Primary Language</label>
                    <p>{patientData.language || user?.language || "English"}</p>
                  </div>
                </div>

                <div
                  className="clinical-info-card"
                  style={{ background: "#f0fdfa", borderColor: "#ccfbf1" }}
                >
                  <label style={{ color: "#087f8c" }}>
                    Reason for Consultation / Symptoms
                  </label>
                  <p>
                    {currentAppointment.reason || "No symptoms or reason specified."}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: MEDICAL HISTORY */}
            {activeSideTab === "history" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="clinical-info-card">
                  <label>Known Allergies</label>
                  {patientData.allergies &&
                  (Array.isArray(patientData.allergies)
                    ? patientData.allergies.length > 0
                    : patientData.allergies !== "None") ? (
                    <div className="clinical-badge-row">
                      {(Array.isArray(patientData.allergies)
                        ? patientData.allergies
                        : [patientData.allergies]
                      ).map((alg, i) => (
                        <span
                          key={i}
                          className="clinical-tag"
                          style={{
                            background: "#fef2f2",
                            color: "#dc2626",
                            borderColor: "#fecaca",
                          }}
                        >
                          {alg}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: "#6b878c" }}>None reported</p>
                  )}
                </div>

                <div className="clinical-info-card">
                  <label>Chronic Conditions</label>
                  {patientData.chronicConditions &&
                  (Array.isArray(patientData.chronicConditions)
                    ? patientData.chronicConditions.length > 0
                    : patientData.chronicConditions !== "None") ? (
                    <div className="clinical-badge-row">
                      {(Array.isArray(patientData.chronicConditions)
                        ? patientData.chronicConditions
                        : [patientData.chronicConditions]
                      ).map((c, i) => (
                        <span key={i} className="clinical-tag">
                          {c}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: "#6b878c" }}>None reported</p>
                  )}
                </div>

                <div className="clinical-info-card">
                  <label>Current Medications</label>
                  {patientData.currentMedications &&
                  (Array.isArray(patientData.currentMedications)
                    ? patientData.currentMedications.length > 0
                    : patientData.currentMedications !== "None") ? (
                    <div className="clinical-badge-row">
                      {(Array.isArray(patientData.currentMedications)
                        ? patientData.currentMedications
                        : [patientData.currentMedications]
                      ).map((m, i) => (
                        <span
                          key={i}
                          className="clinical-tag"
                          style={{
                            background: "#f0fdf4",
                            color: "#16a34a",
                            borderColor: "#bbf7d0",
                          }}
                        >
                          <Pill size={11} style={{ marginRight: "3px" }} /> {m}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: "#6b878c" }}>None recorded</p>
                  )}
                </div>

                <div className="clinical-info-card">
                  <label>
                    Previous Consultations ({previousAppointments.length})
                  </label>
                  {previousAppointments.length === 0 ? (
                    <p style={{ color: "#6b878c" }}>
                      No previous consultations on record
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        marginTop: "6px",
                      }}
                    >
                      {previousAppointments.slice(0, 3).map((prevApt) => (
                        <div
                          key={prevApt._id || prevApt.id}
                          style={{
                            fontSize: "12px",
                            padding: "6px 8px",
                            background: "#ffffff",
                            borderRadius: "6px",
                            border: "1px solid #e2ecee",
                          }}
                        >
                          <strong>{prevApt.doctorName}</strong> &bull;{" "}
                          {prevApt.date}
                          <span
                            style={{
                              display: "block",
                              color: "#6b878c",
                              fontSize: "11px",
                            }}
                          >
                            {prevApt.reason || prevApt.specialty}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: INTERPRETER */}
            {activeSideTab === "interpreter" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="clinical-info-card">
                  <label>Interpreter Status</label>
                  <p
                    style={{
                      fontWeight: "700",
                      color: currentAppointment.interpreterRequested
                        ? "#087f8c"
                        : "#64748b",
                    }}
                  >
                    {currentAppointment.interpreterRequested
                      ? "✓ Interpreter Requested"
                      : "No Interpreter Requested"}
                  </p>
                </div>

                {currentAppointment.interpreterRequested ? (
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      padding: "14px",
                      borderRadius: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#15803d",
                        fontWeight: "700",
                        marginBottom: "6px",
                        fontSize: "14px",
                      }}
                    >
                      <CheckCircle2 size={18} />
                      <span>Certified Medical Interpreter Assigned</span>
                    </div>
                    <p
                      style={{
                        margin: "0 0 10px 0",
                        fontSize: "13px",
                        color: "#166534",
                      }}
                    >
                      Language:{" "}
                      <strong>
                        {currentAppointment.interpreterLanguage || targetLanguage}
                      </strong>
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        color: "#15803d",
                      }}
                    >
                      <Volume2 size={14} />
                      <span>Audio relay & real-time subtitles synchronized</span>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      background: "#f8fafb",
                      border: "1px solid #d5eaec",
                      padding: "14px",
                      borderRadius: "10px",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 12px 0",
                        fontSize: "13px",
                        color: "#556c70",
                        lineHeight: "1.5",
                      }}
                    >
                      Need live language assistance during your consultation? You can
                      request a certified medical interpreter immediately.
                    </p>
                    <button
                      onClick={() => handleRequestInterpreter(targetLanguage)}
                      disabled={requestingInterp}
                      className="confirm-btn"
                      style={{ width: "100%", padding: "9px", fontSize: "13px" }}
                    >
                      {requestingInterp
                        ? "Connecting..."
                        : `Request ${targetLanguage} Interpreter`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsultationRoom({ user, appointment: propAppointment, setActiveTab }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [previousAppointments, setPreviousAppointments] = useState([]);
  const [isJoined, setIsJoined] = useState(false);

  // Audio/Video/Translation controls
  const [translationActive, setTranslationActive] = useState(true);
  const [targetLanguage, setTargetLanguage] = useState(user?.language || "English");
  const [interpreterConnected, setInterpreterConnected] = useState(false);
  const [requestingInterp, setRequestingInterp] = useState(false);
  const [interpSuccess, setInterpSuccess] = useState("");

  useEffect(() => {
    loadSession();
  }, [propAppointment]);

  const loadSession = async () => {
    try {
      setLoading(true);
      setError("");

      if (propAppointment && (propAppointment._id || propAppointment.id)) {
        const aptId = propAppointment._id || propAppointment.id;
        const res = await fetchAppointmentById(aptId);
        const apt = res.appointment || propAppointment;
        const formattedApt = {
          ...apt,
          id: apt._id || apt.id,
        };
        setCurrentAppointment(formattedApt);
        setPreviousAppointments(res.previousAppointments || []);
        setInterpreterConnected(!!formattedApt.interpreterRequested);
        if (formattedApt.interpreterLanguage) {
          setTargetLanguage(formattedApt.interpreterLanguage);
        }
        // If coming directly from explicit "Join Consultation" click on a confirmed session
        if (formattedApt.status === "Confirmed" || formattedApt.status === "In Progress") {
          setIsJoined(true);
        } else {
          setIsJoined(false);
        }
      } else {
        // Tab opened directly from sidebar: fetch patient's real appointments
        setIsJoined(false);
        const res = await fetchMyAppointments();
        const allApts = (res.appointments || []).map((a) => ({
          ...a,
          id: a._id || a.id,
        }));

        // Find confirmed or in-progress appointment
        const eligible = allApts.find(
          (a) => a.status === "Confirmed" || a.status === "In Progress"
        );

        if (eligible) {
          try {
            const detailRes = await fetchAppointmentById(eligible.id);
            setCurrentAppointment({
              ...detailRes.appointment,
              id: detailRes.appointment._id || detailRes.appointment.id,
            });
            setPreviousAppointments(detailRes.previousAppointments || []);
          } catch {
            setCurrentAppointment(eligible);
          }
          setInterpreterConnected(!!eligible.interpreterRequested);
          if (eligible.interpreterLanguage) {
            setTargetLanguage(eligible.interpreterLanguage);
          }
        } else {
          // If no confirmed, check if there is a pending appointment
          const pending = allApts.find((a) => a.status === "Pending");
          if (pending) {
            setCurrentAppointment(pending);
          } else {
            setCurrentAppointment(null);
          }
        }
      }
    } catch (err) {
      console.error("Error loading consultation session:", err);
      setError(err.message || "Failed to load consultation session");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestInterpreter = async (lang) => {
    if (!currentAppointment) return;
    try {
      setRequestingInterp(true);
      const chosenLang = lang || targetLanguage || "Spanish";
      await requestAppointmentInterpreter(currentAppointment.id, chosenLang);
      setInterpreterConnected(true);
      setCurrentAppointment((prev) => ({
        ...prev,
        interpreterRequested: true,
        interpreterLanguage: chosenLang,
      }));
      setInterpSuccess(`Live interpreter requested for ${chosenLang}`);
      setTimeout(() => setInterpSuccess(""), 3500);
    } catch (err) {
      setError(err.message || "Failed to request interpreter");
    } finally {
      setRequestingInterp(false);
    }
  };

  if (loading) {
    return (
      <div
        className="consultation-room-container"
        style={{ padding: "50px 20px", textAlign: "center" }}
      >
        <div className="spinner"></div>
        <p style={{ marginTop: "16px", color: "#556c70", fontWeight: "600" }}>
          Verifying consultation session status...
        </p>
      </div>
    );
  }

  // =========================================================================
  // STATE 1: NO ACTIVE APPOINTMENT
  // =========================================================================
  if (!currentAppointment) {
    return (
      <div className="consultation-room-container" style={{ padding: "30px 20px" }}>
        <div
          className="empty-appointments-box"
          style={{
            maxWidth: "540px",
            margin: "20px auto",
            background: "#ffffff",
            padding: "40px 30px",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            border: "1px solid #d5eaec",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "#eaf6f7",
              color: "#087f8c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
            }}
          >
            <Video size={32} />
          </div>

          <h3
            style={{
              color: "#173b42",
              fontSize: "20px",
              marginBottom: "8px",
              fontWeight: "700",
            }}
          >
            No Active Consultation
          </h3>
          <p
            style={{
              color: "#556c70",
              fontSize: "14px",
              lineHeight: "1.6",
              marginBottom: "24px",
            }}
          >
            You currently have no active consultation scheduled. When you book and
            confirm a consultation with a doctor, your live session link will appear
            here.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => setActiveTab("appointments")}
              className="cancel-btn"
              style={{ padding: "10px 20px" }}
            >
              View My Appointments
            </button>
            <button
              onClick={() => setActiveTab("find-doctor")}
              className="confirm-btn"
              style={{ padding: "10px 22px" }}
            >
              <Stethoscope size={16} />
              <span>Book an Appointment</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE 2: PENDING APPOINTMENT
  // =========================================================================
  if (currentAppointment.status === "Pending") {
    return (
      <div className="consultation-room-container" style={{ padding: "30px 20px" }}>
        <div
          className="empty-appointments-box"
          style={{
            maxWidth: "600px",
            margin: "20px auto",
            background: "#ffffff",
            padding: "36px 32px",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            border: "1px solid #d5eaec",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "#fffbeb",
              color: "#d97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
            }}
          >
            <Clock size={32} />
          </div>

          <h3
            style={{
              color: "#173b42",
              fontSize: "21px",
              marginBottom: "6px",
              fontWeight: "700",
            }}
          >
            Waiting for Doctor Confirmation
          </h3>
          <p
            style={{
              color: "#556c70",
              fontSize: "14px",
              lineHeight: "1.6",
              marginBottom: "20px",
            }}
          >
            Your consultation with <strong>{currentAppointment.doctorName}</strong>{" "}
            has been booked and is currently pending doctor review. The live
            consultation room will be unlocked once confirmed.
          </p>

          <div
            style={{
              background: "#f0f7f8",
              padding: "16px",
              borderRadius: "12px",
              textAlign: "left",
              marginBottom: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: "13px",
              color: "#173b42",
            }}
          >
            <div>
              <strong>Doctor:</strong> {currentAppointment.doctorName} (
              {currentAppointment.specialty})
            </div>
            <div>
              <strong>Scheduled Time:</strong> {currentAppointment.date} at{" "}
              {currentAppointment.time}
            </div>
            <div>
              <strong>Consultation Mode:</strong>{" "}
              {currentAppointment.type || "Video Call"}
            </div>
            <div>
              <strong>Reason for Visit:</strong>{" "}
              {currentAppointment.reason || "General health consultation"}
            </div>
            <div>
              <strong>Appointment ID:</strong> #{currentAppointment.id}
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              onClick={() => setActiveTab("appointments")}
              className="cancel-btn"
              style={{ padding: "10px 20px" }}
            >
              View My Appointments
            </button>
            <button
              onClick={() => setActiveTab("overview")}
              className="confirm-btn"
              style={{ padding: "10px 22px" }}
            >
              Back to Overview
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE 5A: COMPLETED APPOINTMENT
  // =========================================================================
  if (currentAppointment.status === "Completed") {
    return (
      <div className="consultation-room-container" style={{ padding: "30px 20px" }}>
        <div
          className="empty-appointments-box"
          style={{
            maxWidth: "580px",
            margin: "20px auto",
            background: "#ffffff",
            padding: "36px 32px",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            border: "1px solid #d5eaec",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "#ecfdf5",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
            }}
          >
            <CheckCircle2 size={32} />
          </div>

          <h3
            style={{
              color: "#173b42",
              fontSize: "21px",
              marginBottom: "6px",
              fontWeight: "700",
            }}
          >
            Consultation Completed
          </h3>
          <p
            style={{
              color: "#556c70",
              fontSize: "14px",
              lineHeight: "1.6",
              marginBottom: "20px",
            }}
          >
            Your consultation with <strong>{currentAppointment.doctorName}</strong> on{" "}
            {currentAppointment.date} has concluded. You can access your doctor
            prescription and medical notes anytime.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              onClick={() => setActiveTab("medical-history")}
              className="confirm-btn"
              style={{ padding: "11px 22px" }}
            >
              View Prescriptions & Notes
            </button>
            <button
              onClick={() => setActiveTab("appointments")}
              className="cancel-btn"
              style={{ padding: "11px 20px" }}
            >
              All Consultations
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE 5B: CANCELLED APPOINTMENT
  // =========================================================================
  if (currentAppointment.status === "Cancelled") {
    return (
      <div className="consultation-room-container" style={{ padding: "30px 20px" }}>
        <div
          className="empty-appointments-box"
          style={{
            maxWidth: "560px",
            margin: "20px auto",
            background: "#ffffff",
            padding: "36px",
            borderRadius: "16px",
            border: "1px solid #d5eaec",
            textAlign: "center",
          }}
        >
          <AlertCircle size={48} style={{ color: "#ef4444", marginBottom: "12px" }} />
          <h3
            style={{
              color: "#173b42",
              fontSize: "20px",
              marginBottom: "6px",
            }}
          >
            Consultation Cancelled
          </h3>
          <p
            style={{
              color: "#556c70",
              fontSize: "14px",
              lineHeight: "1.6",
              marginBottom: "20px",
            }}
          >
            This appointment was cancelled and is no longer available.
          </p>
          <button
            onClick={() => setActiveTab("appointments")}
            className="confirm-btn"
            style={{ margin: "0 auto" }}
          >
            Return to Appointments
          </button>
        </div>
      </div>
    );
  }

  // Details from MongoDB models
  const doctorName =
    currentAppointment.doctorName ||
    currentAppointment.doctor?.name ||
    "Healthcare Doctor";
  const doctorSpecialty =
    currentAppointment.specialty ||
    currentAppointment.doctor?.specialty ||
    "Medical Specialist";
  const patientData = currentAppointment.patient || user || {};
  const patientName = patientData.name || user?.name || "Patient";

  // =========================================================================
  // STATE 3: CONFIRMED APPOINTMENT BUT NOT YET JOINED
  // =========================================================================
  if (!isJoined) {
    return (
      <div className="consultation-room-container" style={{ padding: "30px 20px" }}>
        <div
          style={{
            maxWidth: "620px",
            margin: "10px auto",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "36px 32px",
            boxShadow: "0 10px 35px rgba(0, 0, 0, 0.06)",
            border: "1px solid #d5eaec",
          }}
        >
          {/* Header Banner */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
              paddingBottom: "16px",
              borderBottom: "1px solid #eef4f5",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "#eaf6f7",
                  color: "#087f8c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Stethoscope size={24} />
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "19px",
                    color: "#173b42",
                    fontWeight: "700",
                  }}
                >
                  Upcoming Consultation
                </h3>
                <span style={{ fontSize: "13px", color: "#556c70" }}>
                  ID: #{currentAppointment.id}
                </span>
              </div>
            </div>

            <span
              style={{
                fontSize: "12px",
                fontWeight: "700",
                background: "#dcfce7",
                color: "#15803d",
                padding: "4px 12px",
                borderRadius: "16px",
                border: "1px solid #bbf7d0",
              }}
            >
              ● Confirmed
            </span>
          </div>

          {/* Appointment Details Grid */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                background: "#f8fafb",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid #e2ecee",
              }}
            >
              <h4 style={{ margin: "0 0 4px 0", fontSize: "16px", color: "#173b42" }}>
                {doctorName}
              </h4>
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  color: "#087f8c",
                  fontWeight: "600",
                }}
              >
                {doctorSpecialty}
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div
                style={{
                  background: "#fafcfc",
                  border: "1px solid #d5eaec",
                  padding: "12px",
                  borderRadius: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: "#6b878c",
                    display: "block",
                    marginBottom: "4px",
                    fontWeight: "700",
                  }}
                >
                  CONSULTATION DATE & TIME
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#173b42",
                  }}
                >
                  <Calendar size={14} style={{ color: "#087f8c" }} />
                  <span>
                    {currentAppointment.date} &bull; {currentAppointment.time}
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: "#fafcfc",
                  border: "1px solid #d5eaec",
                  padding: "12px",
                  borderRadius: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: "#6b878c",
                    display: "block",
                    marginBottom: "4px",
                    fontWeight: "700",
                  }}
                >
                  TELEMEDICINE MODE
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#173b42",
                  }}
                >
                  <Video size={14} style={{ color: "#087f8c" }} />
                  <span>{currentAppointment.type || "Video Call"}</span>
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#fafcfc",
                border: "1px solid #d5eaec",
                padding: "12px",
                borderRadius: "10px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  color: "#6b878c",
                  display: "block",
                  marginBottom: "4px",
                  fontWeight: "700",
                }}
              >
                REASON FOR CONSULTATION
              </span>
              <p style={{ margin: 0, fontSize: "13px", color: "#24464d" }}>
                {currentAppointment.reason || "General medical consultation"}
              </p>
            </div>

            {currentAppointment.interpreterRequested && (
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: "#15803d",
                }}
              >
                <Languages size={16} />
                <span>
                  Live Medical Interpreter requested in{" "}
                  <strong>
                    {currentAppointment.interpreterLanguage ||
                      "Preferred Language"}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Join Actions */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              onClick={() => setActiveTab("appointments")}
              className="cancel-btn"
              style={{ padding: "11px 20px" }}
            >
              Back to Appointments
            </button>
            <button
              onClick={() => setIsJoined(true)}
              className="confirm-btn"
              style={{ padding: "11px 24px", fontSize: "14px" }}
              id="patient-enter-live-room-btn"
            >
              <Video size={17} />
              <span>Join Consultation</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE 4: ACTIVE / JOINED CONSULTATION ROOM
  // =========================================================================
  return (
    <ActivePatientVideoRoom
      currentAppointment={currentAppointment}
      user={user}
      doctorName={doctorName}
      doctorSpecialty={doctorSpecialty}
      patientData={patientData}
      patientName={patientName}
      targetLanguage={targetLanguage}
      setTargetLanguage={setTargetLanguage}
      translationActive={translationActive}
      setTranslationActive={setTranslationActive}
      interpreterConnected={interpreterConnected}
      handleRequestInterpreter={handleRequestInterpreter}
      requestingInterp={requestingInterp}
      previousAppointments={previousAppointments}
      onLeaveRoom={() => setIsJoined(false)}
      setActiveTab={setActiveTab}
    />
  );
}

export default ConsultationRoom;
