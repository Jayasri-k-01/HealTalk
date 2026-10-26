import { useState, useEffect } from "react";
import {
  fetchMyAppointments,
  cancelAppointment as cancelAppointmentApi,
  requestAppointmentInterpreter,
} from "../../services/appointmentService";
import {
  Calendar,
  Clock,
  Video,
  User,
  CheckCircle2,
  XCircle,
  FileText,
  Languages,
  ArrowRight,
  AlertCircle,
  Download,
  Search,
  Info,
  X,
  ShieldCheck,
  Globe,
  Loader2,
} from "lucide-react";

const POPULAR_LANGUAGES = [
  "Spanish",
  "French",
  "Hindi",
  "Tamil",
  "Telugu",
  "Mandarin",
  "Arabic",
  "Russian",
  "Portuguese",
  "German",
  "Vietnamese",
  "Korean",
];

function MyAppointments({ setActiveTab, onJoinConsultation }) {
  const [activeFilter, setActiveFilter] = useState("Upcoming");
  const [searchTerm, setSearchTerm] = useState("");
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [interpreterModalApt, setInterpreterModalApt] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("Spanish");
  const [customLanguage, setCustomLanguage] = useState("");
  const [requestingInterpreter, setRequestingInterpreter] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchMyAppointments();
      const rawList = res.appointments || [];
      const formatted = rawList.map((apt) => ({
        ...apt,
        id: apt._id || apt.id,
      }));
      setAppointmentsList(formatted);
    } catch (err) {
      console.error("Error loading appointments:", err);
      setError(err.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }
    try {
      setCancellingId(id);
      await cancelAppointmentApi(id);
      setAppointmentsList((prev) =>
        prev.map((apt) =>
          apt.id === id ? { ...apt, status: "Cancelled", interpreterStatus: "Cancelled" } : apt
        )
      );
      if (selectedAppointment && selectedAppointment.id === id) {
        setSelectedAppointment((prev) => ({ ...prev, status: "Cancelled", interpreterStatus: "Cancelled" }));
      }
      setActionMessage("Appointment cancelled successfully.");
      setTimeout(() => setActionMessage(""), 3500);
    } catch (err) {
      setError(err.message || "Failed to cancel appointment");
    } finally {
      setCancellingId(null);
    }
  };

  const handleOpenInterpreterModal = (apt) => {
    setInterpreterModalApt(apt);
    setSelectedLanguage(apt.interpreterLanguage || "Spanish");
    setCustomLanguage("");
    setError("");
  };

  const handleSubmitInterpreterRequest = async (e) => {
    if (e) e.preventDefault();
    if (!interpreterModalApt) return;

    const langToRequest = (customLanguage.trim() || selectedLanguage || "").trim();
    if (!langToRequest) {
      setError("Please select or type a language for interpretation.");
      return;
    }

    try {
      setRequestingInterpreter(true);
      setError("");
      const res = await requestAppointmentInterpreter(interpreterModalApt.id, langToRequest);
      const updatedApt = res.appointment;

      setAppointmentsList((prev) =>
        prev.map((apt) =>
          apt.id === interpreterModalApt.id
            ? {
                ...apt,
                interpreterRequested: true,
                interpreterLanguage: langToRequest,
                interpreterStatus: "Requested",
                interpreter: null,
              }
            : apt
        )
      );

      if (selectedAppointment && selectedAppointment.id === interpreterModalApt.id) {
        setSelectedAppointment((prev) => ({
          ...prev,
          interpreterRequested: true,
          interpreterLanguage: langToRequest,
          interpreterStatus: "Requested",
          interpreter: null,
        }));
      }

      setActionMessage(`Live ${langToRequest} interpreter requested successfully!`);
      setInterpreterModalApt(null);
      setTimeout(() => setActionMessage(""), 4000);
    } catch (err) {
      console.error("Error submitting interpreter request:", err);
      setError(err.message || "Failed to submit interpreter request");
    } finally {
      setRequestingInterpreter(false);
    }
  };

  // Dynamic counts
  const allCount = appointmentsList.length;
  const upcomingCount = appointmentsList.filter(
    (a) => a.status === "Confirmed" || a.status === "Pending" || a.status === "In Progress"
  ).length;
  const completedCount = appointmentsList.filter((a) => a.status === "Completed").length;
  const cancelledCount = appointmentsList.filter((a) => a.status === "Cancelled").length;

  // Filter by tab
  const tabFiltered = appointmentsList.filter((apt) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Upcoming") {
      return apt.status === "Confirmed" || apt.status === "Pending" || apt.status === "In Progress";
    }
    if (activeFilter === "Completed") return apt.status === "Completed";
    if (activeFilter === "Cancelled") return apt.status === "Cancelled";
    return true;
  });

  // Filter by search query
  const filteredAppointments = tabFiltered.filter((apt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const docName = (apt.doctorName || "").toLowerCase();
    const spec = (apt.specialty || "").toLowerCase();
    const reason = (apt.reason || "").toLowerCase();
    return docName.includes(term) || spec.includes(term) || reason.includes(term);
  });

  return (
    <div className="my-appointments-container">
      {/* Header & Tabs */}
      <div className="appointments-header">
        <div>
          <h2>My Consultations & Appointments</h2>
          <p>Track your scheduled telemedicine sessions and view past consultation records</p>
        </div>

        <div className="appointments-tab-pills">
          <button
            className={`tab-pill ${activeFilter === "All" ? "active" : ""}`}
            onClick={() => setActiveFilter("All")}
          >
            All ({allCount})
          </button>
          <button
            className={`tab-pill ${activeFilter === "Upcoming" ? "active" : ""}`}
            onClick={() => setActiveFilter("Upcoming")}
          >
            Upcoming ({upcomingCount})
          </button>
          <button
            className={`tab-pill ${activeFilter === "Completed" ? "active" : ""}`}
            onClick={() => setActiveFilter("Completed")}
          >
            Completed ({completedCount})
          </button>
          <button
            className={`tab-pill ${activeFilter === "Cancelled" ? "active" : ""}`}
            onClick={() => setActiveFilter("Cancelled")}
          >
            Cancelled ({cancelledCount})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ position: "relative", width: "100%", maxWidth: "450px" }}>
        <Search
          size={18}
          style={{
            position: "absolute",
            left: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#6b878c",
          }}
        />
        <input
          type="text"
          placeholder="Search by doctor name, specialty, or symptoms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px 10px 42px",
            borderRadius: "10px",
            border: "1.5px solid #d5eaec",
            background: "#ffffff",
            fontSize: "14px",
            color: "#173b42",
            outline: "none",
          }}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              color: "#8aa1a5",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {actionMessage && (
        <div className="toast-notification">
          <CheckCircle2 size={18} style={{ color: "#10b981" }} />
          <span>{actionMessage}</span>
        </div>
      )}

      {error && (
        <div className="auth-alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Appointments List */}
      <div className="appointments-list">
        {loading ? (
          <div className="empty-appointments-box">
            <div className="spinner"></div>
            <p style={{ marginTop: "12px" }}>Loading your appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="empty-appointments-box">
            <Calendar size={40} className="empty-icon" />
            <h3>No {activeFilter === "All" ? "" : activeFilter} Appointments Found</h3>
            <p>
              {searchTerm
                ? "No appointments match your search criteria."
                : `You currently have no consultations listed under ${activeFilter.toLowerCase()}.`}
            </p>
            {activeFilter === "Upcoming" && !searchTerm && (
              <button
                onClick={() => setActiveTab("find-doctor")}
                className="find-doctor-btn"
              >
                Schedule an Appointment
              </button>
            )}
          </div>
        ) : (
          filteredAppointments.map((apt) => (
            <div key={apt.id} className="appointment-card">
              <div className="apt-card-main">
                <div className="doc-avatar-mid">
                  <User size={26} />
                </div>

                <div className="apt-info">
                  <div className="apt-header-line">
                    <h3>{apt.doctorName}</h3>
                    <span className={`status-badge status-${apt.status.toLowerCase()}`}>
                      {apt.status}
                    </span>
                  </div>

                  <p className="apt-spec">{apt.specialty}</p>

                  <div className="apt-meta-tags">
                    <span className="apt-tag">
                      <Calendar size={14} /> {apt.date}
                    </span>
                    <span className="apt-tag">
                      <Clock size={14} /> {apt.time}
                    </span>
                    <span className="apt-tag">
                      <Video size={14} /> {apt.type || "Video Call"}
                    </span>
                    {apt.interpreterRequested && (
                      apt.interpreterStatus === "Accepted" || (apt.interpreter && apt.interpreterStatus !== "Cancelled") ? (
                        <span
                          className="apt-tag"
                          style={{
                            background: "#ecfdf5",
                            color: "#059669",
                            border: "1px solid #a7f3d0",
                            fontWeight: "600",
                          }}
                        >
                          <ShieldCheck size={14} /> Interpreter Confirmed: {apt.interpreter?.name || "Assigned"} ({apt.interpreterLanguage})
                        </span>
                      ) : (
                        <span className="apt-tag interpreter-tag">
                          <Languages size={14} /> Interpreter Requested ({apt.interpreterLanguage})
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="apt-card-actions">
                <button
                  onClick={() => setSelectedAppointment(apt)}
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

                {/* Request Interpreter Action Button */}
                {apt.status !== "Cancelled" && apt.status !== "Completed" && (
                  (!apt.interpreterRequested || (apt.interpreterStatus !== "Requested" && apt.interpreterStatus !== "Accepted")) ? (
                    <button
                      type="button"
                      onClick={() => handleOpenInterpreterModal(apt)}
                      style={{
                        padding: "8px 13px",
                        borderRadius: "8px",
                        border: "1.5px solid #c7d2fe",
                        background: "#eef2ff",
                        color: "#4f46e5",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Languages size={15} />
                      <span>Request Interpreter</span>
                    </button>
                  ) : null
                )}

                {apt.status === "Pending" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#b45309",
                        background: "#fef3c7",
                        padding: "6px 12px",
                        borderRadius: "14px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Clock size={12} /> Awaiting Confirmation
                    </span>
                    <button
                      onClick={() => handleCancelAppointment(apt.id)}
                      className="cancel-apt-btn"
                      disabled={cancellingId === apt.id}
                    >
                      {cancellingId === apt.id ? "Cancelling..." : "Cancel"}
                    </button>
                  </div>
                )}

                {(apt.status === "Confirmed" || apt.status === "In Progress") && (
                  <>
                    <button
                      onClick={() => {
                        if (onJoinConsultation) {
                          onJoinConsultation(apt);
                        } else {
                          setActiveTab("consultations");
                        }
                      }}
                      className="enter-room-btn"
                    >
                      <Video size={16} />
                      <span>Join Consultation</span>
                    </button>
                    <button
                      onClick={() => handleCancelAppointment(apt.id)}
                      className="cancel-apt-btn"
                      disabled={cancellingId === apt.id}
                    >
                      {cancellingId === apt.id ? "Cancelling..." : "Cancel"}
                    </button>
                  </>
                )}

                {apt.status === "Completed" && (
                  <div className="completed-actions">
                    <button
                      onClick={() => setActiveTab("medical-history")}
                      className="download-rx-btn"
                    >
                      <Download size={16} />
                      <span>Prescriptions & Notes</span>
                    </button>
                  </div>
                )}

                {apt.status === "Cancelled" && (
                  <span className="cancelled-note" style={{ color: "#94a3b8", fontSize: "13px" }}>
                    Appointment Cancelled
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="modal-overlay">
          <div className="booking-modal-card" style={{ maxWidth: "560px" }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="doc-avatar-mid">
                  <User size={26} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px" }}>
                    Appointment Details
                  </h3>
                  <span className="doc-sub" style={{ fontSize: "13px", color: "#087f8c", fontWeight: "600" }}>
                    ID: {selectedAppointment.id}
                  </span>
                </div>
              </div>
              <button
                className="close-modal-btn"
                onClick={() => setSelectedAppointment(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Doctor & Status banner */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#f0f7f8",
                  padding: "14px 16px",
                  borderRadius: "12px",
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: "16px", color: "#173b42" }}>
                    {selectedAppointment.doctorName}
                  </h4>
                  <span style={{ fontSize: "13px", color: "#556c70" }}>
                    {selectedAppointment.specialty}
                  </span>
                </div>
                <span className={`status-badge status-${selectedAppointment.status.toLowerCase()}`}>
                  {selectedAppointment.status}
                </span>
              </div>

              {/* Schedule Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ background: "#fafcfc", border: "1px solid #d5eaec", padding: "12px", borderRadius: "10px" }}>
                  <span style={{ fontSize: "12px", color: "#6b878c", display: "block", marginBottom: "4px" }}>
                    Consultation Date
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", color: "#173b42" }}>
                    <Calendar size={16} style={{ color: "#087f8c" }} />
                    <span>{selectedAppointment.date}</span>
                  </div>
                </div>

                <div style={{ background: "#fafcfc", border: "1px solid #d5eaec", padding: "12px", borderRadius: "10px" }}>
                  <span style={{ fontSize: "12px", color: "#6b878c", display: "block", marginBottom: "4px" }}>
                    Scheduled Time
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", color: "#173b42" }}>
                    <Clock size={16} style={{ color: "#087f8c" }} />
                    <span>{selectedAppointment.time}</span>
                  </div>
                </div>
              </div>

              {/* Telemedicine Mode & Language */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ background: "#fafcfc", border: "1px solid #d5eaec", padding: "12px", borderRadius: "10px" }}>
                  <span style={{ fontSize: "12px", color: "#6b878c", display: "block", marginBottom: "4px" }}>
                    Session Mode
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", color: "#173b42" }}>
                    <Video size={16} style={{ color: "#087f8c" }} />
                    <span>{selectedAppointment.type || "Video Call"}</span>
                  </div>
                </div>

                <div style={{ background: "#fafcfc", border: "1px solid #d5eaec", padding: "12px", borderRadius: "10px" }}>
                  <span style={{ fontSize: "12px", color: "#6b878c", display: "block", marginBottom: "4px" }}>
                    Live Interpreter Status
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", color: "#173b42" }}>
                    <Languages size={16} style={{ color: selectedAppointment.interpreterRequested ? "#4f46e5" : "#94a3b8" }} />
                    <span>
                      {selectedAppointment.interpreterRequested
                        ? selectedAppointment.interpreterStatus === "Accepted"
                          ? `Assigned: ${selectedAppointment.interpreter?.name || "Interpreter"} (${selectedAppointment.interpreterLanguage})`
                          : `Requested: ${selectedAppointment.interpreterLanguage}`
                        : "Not Requested"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Interpreter Status Card in Modal */}
              {selectedAppointment.interpreterRequested ? (
                <div
                  style={{
                    background: selectedAppointment.interpreterStatus === "Accepted" ? "#f0fdf4" : "#eef2ff",
                    border: selectedAppointment.interpreterStatus === "Accepted" ? "1px solid #bbf7d0" : "1px solid #c7d2fe",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                  }}
                >
                  {selectedAppointment.interpreterStatus === "Accepted" ? (
                    <ShieldCheck size={20} style={{ color: "#16a34a", marginTop: "2px", flexShrink: 0 }} />
                  ) : (
                    <Languages size={20} style={{ color: "#4f46e5", marginTop: "2px", flexShrink: 0 }} />
                  )}
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "13px", color: selectedAppointment.interpreterStatus === "Accepted" ? "#166534" : "#3730a3" }}>
                      {selectedAppointment.interpreterStatus === "Accepted"
                        ? `Certified Interpreter Assigned (${selectedAppointment.interpreterLanguage})`
                        : `Interpreter Requested: ${selectedAppointment.interpreterLanguage}`}
                    </div>
                    <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: selectedAppointment.interpreterStatus === "Accepted" ? "#15803d" : "#4338ca", lineHeight: "1.4" }}>
                      {selectedAppointment.interpreterStatus === "Accepted"
                        ? `${selectedAppointment.interpreter?.name || "Your assigned interpreter"} will join the consultation to provide live ${selectedAppointment.interpreterLanguage} translation.`
                        : `Your request for a certified ${selectedAppointment.interpreterLanguage} interpreter is active and waiting for an available interpreter to accept.`}
                    </p>
                  </div>
                </div>
              ) : selectedAppointment.status !== "Cancelled" && selectedAppointment.status !== "Completed" ? (
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 14px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "13px", color: "#475569" }}>
                    <span>Need live language translation for this session?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const apt = selectedAppointment;
                      setSelectedAppointment(null);
                      handleOpenInterpreterModal(apt);
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "none",
                      background: "#4f46e5",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Languages size={14} />
                    <span>Request Now</span>
                  </button>
                </div>
              ) : null}

              {/* Reason / Symptoms */}
              <div style={{ background: "#fafcfc", border: "1px solid #d5eaec", padding: "14px", borderRadius: "10px" }}>
                <span style={{ fontSize: "12px", color: "#6b878c", display: "block", marginBottom: "6px", fontWeight: "600" }}>
                  Reason for Visit / Symptoms
                </span>
                <p style={{ margin: 0, fontSize: "14px", color: "#24464d", lineHeight: "1.5" }}>
                  {selectedAppointment.reason || "No symptoms or reason specified."}
                </p>
              </div>

              {/* Status Note */}
              {selectedAppointment.status === "Pending" && (
                <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", padding: "12px 14px", borderRadius: "10px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <Clock size={18} style={{ color: "#d97706", flexShrink: 0, marginTop: "2px" }} />
                  <div style={{ fontSize: "13px", color: "#92400e" }}>
                    <strong>Awaiting Doctor Review</strong>
                    <p style={{ margin: "2px 0 0 0" }}>
                      This appointment is pending doctor confirmation. You will be able to join the consultation room once approved.
                    </p>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="modal-actions" style={{ marginTop: "10px", display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setSelectedAppointment(null)}
                  style={{ flex: "1" }}
                >
                  Close
                </button>

                {(selectedAppointment.status === "Confirmed" || selectedAppointment.status === "In Progress") && (
                  <button
                    type="button"
                    className="confirm-btn"
                    onClick={() => {
                      const apt = selectedAppointment;
                      setSelectedAppointment(null);
                      if (onJoinConsultation) {
                        onJoinConsultation(apt);
                      } else {
                        setActiveTab("consultations");
                      }
                    }}
                    style={{ flex: "2" }}
                  >
                    <Video size={16} />
                    <span>Join Consultation</span>
                  </button>
                )}

                {(selectedAppointment.status === "Pending" || selectedAppointment.status === "Confirmed") && (
                  <button
                    type="button"
                    className="cancel-apt-btn"
                    onClick={() => handleCancelAppointment(selectedAppointment.id)}
                    disabled={cancellingId === selectedAppointment.id}
                    style={{
                      padding: "11px 18px",
                      borderRadius: "10px",
                      border: "1px solid #ef4444",
                      background: "#fef2f2",
                      color: "#dc2626",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    {cancellingId === selectedAppointment.id ? "Cancelling..." : "Cancel Visit"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Request Interpreter Modal */}
      {interpreterModalApt && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="booking-modal-card" style={{ maxWidth: "520px", borderRadius: "16px" }}>
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
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Request Medical Interpreter</h3>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Live language translation for your consultation</span>
                </div>
              </div>
              <button
                className="close-modal-btn"
                onClick={() => {
                  setInterpreterModalApt(null);
                  setError("");
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitInterpreterRequest} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Appointment Information Card */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b", marginBottom: "8px" }}>
                  Appointment Information
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Doctor</span>
                    <strong style={{ color: "#0f172a" }}>{interpreterModalApt.doctorName}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Specialty</span>
                    <strong style={{ color: "#0f172a" }}>{interpreterModalApt.specialty}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Date & Time</span>
                    <strong style={{ color: "#0f172a" }}>{interpreterModalApt.date} &bull; {interpreterModalApt.time}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Appointment ID</span>
                    <strong style={{ color: "#4f46e5" }}>{interpreterModalApt.id}</strong>
                  </div>
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1e293b", marginBottom: "8px" }}>
                  Select Required Language
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                  {POPULAR_LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        setSelectedLanguage(lang);
                        setCustomLanguage("");
                      }}
                      style={{
                        padding: "7px 14px",
                        borderRadius: "20px",
                        border: selectedLanguage === lang && !customLanguage ? "2px solid #4f46e5" : "1px solid #cbd5e1",
                        background: selectedLanguage === lang && !customLanguage ? "#eef2ff" : "#ffffff",
                        color: selectedLanguage === lang && !customLanguage ? "#4f46e5" : "#334155",
                        fontWeight: selectedLanguage === lang && !customLanguage ? "600" : "500",
                        fontSize: "13px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {lang}
                    </button>
                  ))}
                </div>

                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="Or type another language (e.g. Cantonese, Bengali, Polish)..."
                    value={customLanguage}
                    onChange={(e) => {
                      setCustomLanguage(e.target.value);
                      if (e.target.value) setSelectedLanguage("");
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "13px",
                      color: "#0f172a",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "12px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <Globe size={18} style={{ color: "#2563eb", flexShrink: 0, marginTop: "2px" }} />
                <p style={{ margin: 0, fontSize: "12.5px", color: "#1e40af", lineHeight: "1.4" }}>
                  An authenticated interpreter certified in <strong>{customLanguage.trim() || selectedLanguage}</strong> will receive your request and be assigned to your appointment.
                </p>
              </div>

              {error && (
                <div className="auth-alert alert-error" style={{ margin: 0 }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="modal-actions" style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setInterpreterModalApt(null);
                    setError("");
                  }}
                  style={{ flex: "1" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestingInterpreter}
                  style={{
                    flex: "2",
                    padding: "11px 18px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#4f46e5",
                    color: "#ffffff",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: requestingInterpreter ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {requestingInterpreter ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <Languages size={16} />
                      <span>Submit Interpreter Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyAppointments;
