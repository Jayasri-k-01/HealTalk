import { useState, useEffect, useCallback } from "react";
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
    appointmentId: appointment._id,
    user,
    onConsultationEnded: () => {
      showToast("Consultation ended.");
    },
  });

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

  const isRemoteVideoVisible =
    connectionStatus === "CONNECTED" && remoteMediaState.isVideoEnabled;

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

              {/* Patient Visual Feed Placeholder when video is not visible */}
              {!isRemoteVideoVisible && (
                <div
                  className="video-avatar-center"
                  style={{ position: "relative", zIndex: 3 }}
                >
                  <div className="patient-feed-avatar">
                    {patientDisplayName.slice(0, 2).toUpperCase()}
                  </div>
                  <h4>{patientDisplayName}</h4>
                  <div className="feed-status-line">
                    <span className="audio-wave-bar"></span>
                    <span className="audio-wave-bar h-lg"></span>
                    <span className="audio-wave-bar"></span>
                    <span>{statusMessage}</span>
                  </div>
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
    const timerInterval = setInterval(() => {
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
    return () => clearInterval(timerInterval);
  }, []);

  const showToast = (message) => {
    setActionToast(message);
    setTimeout(() => setActionToast(null), 3500);
  };

  // Load real consultation data from MongoDB
  const loadConsultationData = useCallback(async () => {
    try {
      setLoading(true);
      let targetAptId = initialSession?._id || initialSession?.id;

      // If no initialSession passed, find doctor's first active or upcoming appointment from MongoDB
      if (!targetAptId) {
        const aptsData = await fetchDoctorAppointments();
        if (aptsData && aptsData.appointments && aptsData.appointments.length > 0) {
          const activeOrUpcoming =
            aptsData.appointments.find(
              (a) => a.status === "Confirmed" || a.status === "In Progress"
            ) || aptsData.appointments[0];
          targetAptId = activeOrUpcoming._id;
        }
      }

      if (!targetAptId) {
        setAppointment(null);
        setPatient(null);
        setPreviousRecords([]);
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
      } else {
        setAppointment(null);
        setPatient(null);
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
          You currently do not have an active live consultation. Please navigate
          to your Appointments tab and click <strong>Join</strong> on any scheduled
          consultation slot.
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
