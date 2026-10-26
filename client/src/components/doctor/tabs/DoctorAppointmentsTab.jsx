import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  Video,
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  UserCheck,
  Globe,
  Loader2,
  X,
  Phone,
  Mail,
  FileText,
  CalendarDays,
  List,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { fetchDoctorAppointments, cancelAppointment, confirmAppointment } from "../../../services/appointmentService";

// Helper to parse Appointment Date + Time accurately into a JavaScript Date object
const parseAppointmentDateTime = (dateStr, timeStr) => {
  if (!dateStr) return null;

  let year, month, day;
  if (typeof dateStr === "string" && dateStr.includes("-")) {
    const parts = dateStr.split("-");
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1; // 0-indexed in JS Date
    day = parseInt(parts[2], 10);
  } else {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    year = d.getFullYear();
    month = d.getMonth();
    day = d.getDate();
  }

  let hours = 0;
  let minutes = 0;

  if (timeStr && typeof timeStr === "string") {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      const modifier = match[3] ? match[3].toUpperCase() : null;

      if (modifier === "PM" && hours < 12) {
        hours += 12;
      }
      if (modifier === "AM" && hours === 12) {
        hours = 0;
      }
    }
  }

  return new Date(year, month, day, hours, minutes, 0);
};

// Returns true if an appointment is in the future relative to current date & time and not completed/cancelled
const isAppointmentUpcoming = (apt) => {
  if (!apt) return false;
  if (apt.status === "Completed" || apt.status === "Cancelled") {
    return false;
  }

  const aptDate = parseAppointmentDateTime(apt.date, apt.time);
  if (!aptDate) return false;

  const now = new Date();
  return aptDate.getTime() >= now.getTime();
};

// Returns true if appointment is eligible to be joined (MUST BE CONFIRMED OR IN PROGRESS)
const isAppointmentJoinable = (apt) => {
  if (!apt) return false;
  // CRITICAL: A Pending or Cancelled or Completed appointment must NEVER be joinable
  if (apt.status !== "Confirmed" && apt.status !== "In Progress") {
    return false;
  }

  const aptDate = parseAppointmentDateTime(apt.date, apt.time);
  if (!aptDate) return false;

  const now = new Date();
  // Eligible if active or within today's window
  const windowEnd = new Date(aptDate.getTime() + 120 * 60 * 1000);
  return now.getTime() <= windowEnd.getTime() && aptDate.getTime() <= (now.getTime() + 60 * 60 * 1000);
};

function DoctorAppointmentsTab({ onNavigateTab }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all"); // all, pending, upcoming, completed, cancelled
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list"); // list, calendar
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [actionToast, setActionToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (message) => {
    setActionToast(message);
    setTimeout(() => setActionToast(null), 3500);
  };

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDoctorAppointments();
      if (data && data.appointments) {
        const formatted = data.appointments.map((apt) => {
          const isVideo = (apt.type || "Video Call").toLowerCase().includes("video");
          const patientObj = apt.patient && typeof apt.patient === "object" ? apt.patient : null;
          const patientName = patientObj?.name || (typeof apt.patient === "string" ? apt.patient : "Patient");
          const patientAge = patientObj?.age || null;
          const patientGender = patientObj?.gender || null;
          const patientEmail = patientObj?.email || "";
          const patientPhone = patientObj?.phone || "";
          const language = patientObj?.language || apt.interpreterLanguage || "English";
          const requiresInterpreter = !!apt.interpreterRequested;
          const interpreterStatus = apt.interpreterStatus || (requiresInterpreter ? "Requested" : "Not Requested");
          const interpreterLanguage = apt.interpreterLanguage || (requiresInterpreter ? language : null);
          const interpreterName = apt.interpreter?.name || (interpreterLanguage ? `${interpreterLanguage} Interpreter` : null);

          return {
            id: String(apt._id),
            patientId: patientObj?._id ? String(patientObj._id) : `APT-${String(apt._id).slice(-6)}`,
            patientName,
            patientAge,
            patientGender,
            patientEmail,
            patientPhone,
            date: apt.date,
            time: apt.time,
            type: isVideo ? "video" : "chat",
            rawType: apt.type || "Video Call",
            language,
            requiresInterpreter,
            interpreterRequested: requiresInterpreter,
            interpreterLanguage,
            interpreterStatus,
            interpreter: apt.interpreter || null,
            interpreterName,
            status: apt.status || "Pending",
            reason: apt.reason || "Medical Consultation",
            symptoms: apt.reason || "",
            notes: apt.notes || "",
            createdAt: apt.createdAt,
          };
        });
        setAppointments(formatted);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      console.error("Failed to load doctor appointments from MongoDB:", err);
      setError(err.message || "Failed to load appointments from server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Real Cancellation / Rejection Handler connected to backend PUT /api/appointments/:id/cancel
  const handleCancelAppointment = async (aptId) => {
    try {
      setActionLoading(true);
      await cancelAppointment(aptId);
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === aptId ? { ...apt, status: "Cancelled" } : apt))
      );
      if (selectedAppointment && selectedAppointment.id === aptId) {
        setSelectedAppointment((prev) => ({ ...prev, status: "Cancelled" }));
      }
      showToast("Appointment cancelled / rejected successfully.");
    } catch (err) {
      console.error("Failed to cancel appointment:", err);
      showToast(err.message || "Failed to cancel appointment");
    } finally {
      setActionLoading(false);
    }
  };

  // Real Accept / Confirm Handler connected to backend PUT /api/appointments/:id/confirm
  const handleConfirmAppointment = async (aptId) => {
    try {
      setActionLoading(true);
      await confirmAppointment(aptId);
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === aptId ? { ...apt, status: "Confirmed" } : apt))
      );
      if (selectedAppointment && selectedAppointment.id === aptId) {
        setSelectedAppointment((prev) => ({ ...prev, status: "Confirmed" }));
      }
      showToast("Appointment accepted & confirmed. You can now start the consultation when ready.");
    } catch (err) {
      console.error("Failed to confirm appointment:", err);
      showToast(err.message || "Failed to confirm appointment");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter and Search Logic
  const filteredAppointments = appointments.filter((apt) => {
    let matchesFilter = true;
    if (activeFilter === "pending") {
      matchesFilter = apt.status === "Pending";
    } else if (activeFilter === "upcoming") {
      matchesFilter = apt.status === "Confirmed" || apt.status === "In Progress" || isAppointmentUpcoming(apt);
    } else if (activeFilter === "completed") {
      matchesFilter = apt.status === "Completed";
    } else if (activeFilter === "cancelled") {
      matchesFilter = apt.status === "Cancelled";
    } else {
      matchesFilter = true; // "all"
    }

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      apt.patientName.toLowerCase().includes(q) ||
      apt.reason.toLowerCase().includes(q) ||
      apt.language.toLowerCase().includes(q) ||
      apt.id.toLowerCase().includes(q) ||
      apt.date.toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="doctor-tab-loading">
        <Loader2 size={32} className="doctor-spin-icon" />
        <p>Loading appointments registry from MongoDB...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="doctor-card">
        <div className="doctor-empty-state">
          <AlertCircle size={40} className="text-danger mb-2" />
          <h4>Unable to Load Appointments</h4>
          <p>{error}</p>
          <button
            type="button"
            className="doctor-btn-primary doctor-btn-sm"
            onClick={loadAppointments}
          >
            <RefreshCw size={14} />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  const pendingCount = appointments.filter((a) => a.status === "Pending").length;
  const upcomingCount = appointments.filter((a) => a.status === "Confirmed" || a.status === "In Progress" || isAppointmentUpcoming(a)).length;
  const completedCount = appointments.filter((a) => a.status === "Completed").length;
  const cancelledCount = appointments.filter((a) => a.status === "Cancelled").length;

  return (
    <div className="doctor-appointments-tab">
      {actionToast && (
        <div className="doctor-toast">
          <CheckCircle2 size={16} />
          <span>{actionToast}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="doctor-tab-header">
        <div className="doctor-tab-title-group">
          <h2>Appointments Registry</h2>
          <p>Manage booked consultations, patient history, and scheduled video sessions</p>
        </div>
        <div className="doctor-header-actions">
          <div className="doctor-view-switcher">
            <button
              type="button"
              className={`switcher-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="Table View"
            >
              <List size={15} />
              <span>List</span>
            </button>
            <button
              type="button"
              className={`switcher-btn ${viewMode === "calendar" ? "active" : ""}`}
              onClick={() => setViewMode("calendar")}
              title="Calendar Schedule View"
            >
              <CalendarDays size={15} />
              <span>Day View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="doctor-filter-bar">
        <div className="doctor-filter-tabs">
          <button
            type="button"
            className={`filter-tab-btn ${activeFilter === "all" ? "active" : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            All Appointments ({appointments.length})
          </button>
          <button
            type="button"
            className={`filter-tab-btn ${activeFilter === "pending" ? "active" : ""}`}
            onClick={() => setActiveFilter("pending")}
          >
            Pending Requests ({pendingCount})
          </button>
          <button
            type="button"
            className={`filter-tab-btn ${activeFilter === "upcoming" ? "active" : ""}`}
            onClick={() => setActiveFilter("upcoming")}
          >
            Confirmed / Upcoming ({upcomingCount})
          </button>
          <button
            type="button"
            className={`filter-tab-btn ${activeFilter === "completed" ? "active" : ""}`}
            onClick={() => setActiveFilter("completed")}
          >
            Completed ({completedCount})
          </button>
          <button
            type="button"
            className={`filter-tab-btn ${activeFilter === "cancelled" ? "active" : ""}`}
            onClick={() => setActiveFilter("cancelled")}
          >
            Cancelled ({cancelledCount})
          </button>
        </div>

        <div className="doctor-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search patient, symptoms, or language..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content: List View or Calendar/Day View */}
      {viewMode === "list" ? (
        <div className="doctor-card table-card">
          {filteredAppointments.length === 0 ? (
            <div className="doctor-empty-state">
              <Calendar size={40} className="empty-icon" />
              <h4>No appointments match your filter</h4>
              <p>Try clearing your search query or selecting a different status filter tab.</p>
              {searchQuery && (
                <button
                  type="button"
                  className="doctor-btn-secondary doctor-btn-sm"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveFilter("all");
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="doctor-table-responsive">
              <table className="doctor-data-table">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Date & Time</th>
                    <th>Type</th>
                    <th>Language & Translation</th>
                    <th>Reason / Chief Complaint</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((apt) => {
                    const isVideo = apt.type === "video";
                    return (
                      <tr key={apt.id} className="table-row-hover">
                        <td>
                          <div className="table-patient-cell">
                            <div className="patient-avatar-badge sm">
                              {apt.patientName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="patient-meta-compact">
                              <span className="name">{apt.patientName}</span>
                              <span className="sub">
                                {apt.patientAge ? `${apt.patientAge}y` : ""}
                                {apt.patientAge && apt.patientGender ? " • " : ""}
                                {apt.patientGender || (!apt.patientAge ? apt.patientEmail || "Patient" : "")}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="table-time-cell">
                            <span className="date">{apt.date}</span>
                            <span className="time">{apt.time}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`consult-type-pill ${isVideo ? "video" : "chat"}`}>
                            {isVideo ? <Video size={11} /> : <MessageSquare size={11} />}
                            {isVideo ? "Video" : "Chat"}
                          </span>
                        </td>
                        <td>
                          <div className="table-lang-cell">
                            <span className="lang-name">
                              <Globe size={12} /> {apt.language}
                            </span>
                            {apt.requiresInterpreter && (
                              <span
                                className="interpreter-needed-badge sm"
                                title={`Interpreter: ${apt.interpreterName || "Assigned"}`}
                              >
                                <UserCheck size={10} />
                                {apt.interpreterName ? apt.interpreterName.split(" ")[0] : "Req"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="table-reason-cell" title={apt.reason}>
                            {apt.reason}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`doctor-status-badge ${apt.status
                              .toLowerCase()
                              .replace(" ", "-")}`}
                          >
                            {apt.status}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions-cell">
                            {apt.status === "Pending" ? (
                              <button
                                type="button"
                                className="doctor-btn-primary doctor-btn-sm"
                                onClick={() => setSelectedAppointment(apt)}
                                title="View & respond to appointment request"
                                style={{ background: "#d97706", borderColor: "#d97706" }}
                              >
                                <Eye size={13} />
                                <span>View Request</span>
                              </button>
                            ) : isAppointmentJoinable(apt) ? (
                              <>
                                <button
                                  type="button"
                                  className="doctor-btn-primary doctor-btn-sm"
                                  onClick={() => onNavigateTab("consultations", apt)}
                                  title="Enter live consultation room"
                                >
                                  <Video size={13} />
                                  <span>{apt.status === "In Progress" ? "Continue" : "Start Consulting"}</span>
                                </button>
                                <button
                                  type="button"
                                  className="doctor-btn-secondary doctor-btn-sm"
                                  onClick={() => setSelectedAppointment(apt)}
                                  title="View full appointment details"
                                >
                                  <Eye size={13} />
                                  <span>Details</span>
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className="doctor-btn-secondary doctor-btn-sm"
                                onClick={() => setSelectedAppointment(apt)}
                                title="View full appointment details"
                              >
                                <Eye size={13} />
                                <span>Details</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Day / Time Slots Calendar View */
        <div className="doctor-card day-calendar-card">
          <div className="calendar-day-header">
            <div className="day-info">
              <h3>Today's Clinical Schedule — {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</h3>
              <p>Visual timeline of today's booked video consultations and chat sessions</p>
            </div>
            <span className="today-badge">Today</span>
          </div>

          <div className="timeline-grid">
            {[
              "09:00 AM",
              "09:30 AM",
              "10:00 AM",
              "10:15 AM",
              "11:00 AM",
              "11:30 AM",
              "01:00 PM",
              "01:15 PM",
              "02:00 PM",
              "03:15 PM",
              "03:30 PM",
              "04:30 PM",
            ].map((slotTime) => {
              const todayStr = new Date().toISOString().split("T")[0];
              const matchedApt = appointments.find(
                (a) => a.time === slotTime && a.date === todayStr
              );
              return (
                <div key={slotTime} className={`timeline-row ${matchedApt ? "has-booking" : "empty"}`}>
                  <div className="timeline-time-label">
                    <Clock size={13} />
                    <span>{slotTime}</span>
                  </div>
                  <div className="timeline-slot-content">
                    {matchedApt ? (
                      <div className={`timeline-booking-card ${matchedApt.status.toLowerCase().replace(" ", "-")}`}>
                        <div className="booking-top">
                          <div className="booking-patient">
                            <strong>{matchedApt.patientName}</strong>
                            {(matchedApt.patientAge || matchedApt.patientGender) && (
                              <span> ({[matchedApt.patientAge ? `${matchedApt.patientAge}y` : "", matchedApt.patientGender].filter(Boolean).join(", ")})</span>
                            )}
                          </div>
                          <span className={`doctor-status-badge ${matchedApt.status.toLowerCase().replace(" ", "-")}`}>
                            {matchedApt.status}
                          </span>
                        </div>
                        <div className="booking-body">
                          <span className="reason">{matchedApt.reason}</span>
                          <span className="lang">
                            <Globe size={11} /> {matchedApt.language}
                            {matchedApt.requiresInterpreter && " (Interpreter assigned)"}
                          </span>
                        </div>
                        <div className="booking-actions">
                          <button
                            type="button"
                            className="doctor-btn-link"
                            onClick={() => setSelectedAppointment(matchedApt)}
                          >
                            View Details
                          </button>
                          {isAppointmentJoinable(matchedApt) && (
                            <button
                              type="button"
                              className="doctor-btn-primary doctor-btn-xs"
                              onClick={() => onNavigateTab("consultations", matchedApt)}
                            >
                              Join Session
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="timeline-available-slot">
                        <span>Available Consultation Slot (30 mins)</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="doc-apt-modal-backdrop" onClick={() => setSelectedAppointment(null)}>
          <div className="doc-apt-modal-container" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-apt-title">
            {/* Header */}
            <div className="doc-apt-modal-header">
              <div className="doc-apt-header-title-group">
                <h3 id="modal-apt-title">Appointment Details</h3>
                <span className="doc-apt-ref-badge" title={selectedAppointment.id}>
                  Ref: #{selectedAppointment.id.length > 8 ? selectedAppointment.id.slice(-8).toUpperCase() : selectedAppointment.id}
                </span>
              </div>
              <button
                type="button"
                className="doc-apt-close-btn"
                onClick={() => setSelectedAppointment(null)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="doc-apt-modal-body">
              {/* Patient Banner */}
              <div className="doc-apt-patient-banner">
                <div className="doc-apt-avatar">
                  {selectedAppointment.patientName.slice(0, 2).toUpperCase()}
                </div>
                <div className="doc-apt-patient-info">
                  <div className="doc-apt-name-row">
                    <h4>{selectedAppointment.patientName}</h4>
                  </div>
                  <div className="doc-apt-sub-meta">
                    {selectedAppointment.patientAge && (
                      <span>{selectedAppointment.patientAge} yrs</span>
                    )}
                    {selectedAppointment.patientAge && selectedAppointment.patientGender && (
                      <span className="dot-sep">•</span>
                    )}
                    {selectedAppointment.patientGender && (
                      <span>{selectedAppointment.patientGender}</span>
                    )}
                    {(selectedAppointment.patientAge || selectedAppointment.patientGender) && (
                      <span className="dot-sep">•</span>
                    )}
                    <span className="doc-apt-lang-chip">
                      <Globe size={11} /> {selectedAppointment.language}
                    </span>
                  </div>
                </div>
                <div className="doc-apt-status-wrap">
                  <span
                    className={`doc-apt-status-pill status-${selectedAppointment.status
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    <span className="status-indicator-dot"></span>
                    {selectedAppointment.status}
                  </span>
                </div>
              </div>

              {/* Consultation Info Grid */}
              <div className="doc-apt-info-grid">
                <div className="doc-apt-info-card">
                  <span className="doc-apt-card-label">Scheduled Date & Time</span>
                  <div className="doc-apt-card-val">
                    <Calendar size={13} className="doc-apt-val-icon text-teal" />
                    <span>{selectedAppointment.date} at {selectedAppointment.time}</span>
                  </div>
                </div>

                <div className="doc-apt-info-card">
                  <span className="doc-apt-card-label">Session Format</span>
                  <div className="doc-apt-card-val">
                    {selectedAppointment.type === "video" ? (
                      <Video size={13} className="doc-apt-val-icon text-blue" />
                    ) : (
                      <MessageSquare size={13} className="doc-apt-val-icon text-purple" />
                    )}
                    <span>
                      {selectedAppointment.type === "video" ? "Video Consultation" : "Live Chat Consultation"}
                    </span>
                  </div>
                </div>

                <div className="doc-apt-info-card">
                  <span className="doc-apt-card-label">Patient Email</span>
                  <div className="doc-apt-card-val" title={selectedAppointment.patientEmail || ""}>
                    <Mail size={13} className="doc-apt-val-icon" />
                    <span className="truncate-val">{selectedAppointment.patientEmail || "Not provided"}</span>
                  </div>
                </div>

                <div className="doc-apt-info-card">
                  <span className="doc-apt-card-label">Patient Phone</span>
                  <div className="doc-apt-card-val">
                    <Phone size={13} className="doc-apt-val-icon" />
                    <span>{selectedAppointment.patientPhone || "Not provided"}</span>
                  </div>
                </div>
              </div>

              {/* Chief Medical Complaint */}
              <div className="doc-apt-section-card">
                <div className="doc-apt-section-header">
                  <FileText size={13} className="text-teal" />
                  <span>Chief Medical Complaint / Reason</span>
                </div>
                <div className="doc-apt-section-content">
                  <p className="doc-apt-reason-text">{selectedAppointment.reason}</p>
                  {selectedAppointment.symptoms && selectedAppointment.symptoms !== selectedAppointment.reason && (
                    <div className="doc-apt-symptoms-callout">
                      <strong>Reported Symptoms:</strong> {selectedAppointment.symptoms}
                    </div>
                  )}
                </div>
              </div>

              {/* Language & Interpreter Support */}
              <div className="doc-apt-section-card">
                <div className="doc-apt-section-header">
                  <Globe size={13} className="text-teal" />
                  <span>Language & Translation Support</span>
                </div>
                <div className="doc-apt-interp-content">
                  <div className={`doc-apt-interp-box ${selectedAppointment.requiresInterpreter ? "requested" : "fluent"}`}>
                    <div className="doc-apt-interp-icon-wrap">
                      {selectedAppointment.requiresInterpreter ? (
                        <UserCheck size={16} />
                      ) : (
                        <Globe size={16} />
                      )}
                    </div>
                    <div className="doc-apt-interp-details">
                      <div className="doc-apt-interp-primary">
                        Primary Language: <strong>{selectedAppointment.language}</strong>
                      </div>
                      <p className="doc-apt-interp-desc">
                        {selectedAppointment.requiresInterpreter
                          ? selectedAppointment.interpreterStatus === "Accepted"
                            ? `Certified Interpreter Assigned: ${selectedAppointment.interpreter?.name || selectedAppointment.interpreterName} (${selectedAppointment.interpreterLanguage})`
                            : `Interpreter Requested: ${selectedAppointment.interpreterLanguage} (Pending Interpreter Match)`
                          : "Patient has not requested an interpreter for this session."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinical Notes (if available) */}
              {selectedAppointment.notes && (
                <div className="doc-apt-section-card">
                  <div className="doc-apt-section-header">
                    <FileText size={13} className="text-slate" />
                    <span>Doctor Clinical Notes</span>
                  </div>
                  <div className="doc-apt-section-content">
                    <p className="doc-apt-notes-text">{selectedAppointment.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="doc-apt-modal-footer">
              <div className="doc-apt-footer-left">
                {selectedAppointment.status === "Pending" && (
                  <button
                    type="button"
                    className="doc-apt-btn-cancel"
                    disabled={actionLoading}
                    onClick={() => handleCancelAppointment(selectedAppointment.id)}
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 size={12} className="doctor-spin-icon" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      "Reject Request"
                    )}
                  </button>
                )}
                {selectedAppointment.status === "Confirmed" && (
                  <button
                    type="button"
                    className="doc-apt-btn-cancel"
                    disabled={actionLoading}
                    onClick={() => handleCancelAppointment(selectedAppointment.id)}
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 size={12} className="doctor-spin-icon" />
                        <span>Cancelling...</span>
                      </>
                    ) : (
                      "Cancel Appointment"
                    )}
                  </button>
                )}
              </div>
              <div className="doc-apt-footer-right">
                {selectedAppointment.status === "Pending" && (
                  <button
                    type="button"
                    className="doctor-btn-primary"
                    style={{
                      background: "#16a34a",
                      borderColor: "#16a34a",
                      color: "#ffffff",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 18px",
                      borderRadius: "8px",
                      fontWeight: "600",
                    }}
                    disabled={actionLoading}
                    onClick={() => handleConfirmAppointment(selectedAppointment.id)}
                  >
                    {actionLoading ? (
                      <Loader2 size={14} className="doctor-spin-icon" />
                    ) : (
                      <CheckCircle2 size={15} />
                    )}
                    <span>Accept Appointment</span>
                  </button>
                )}
                {(selectedAppointment.status === "Confirmed" || selectedAppointment.status === "In Progress") && (
                  <button
                    type="button"
                    className="doc-apt-btn-join"
                    onClick={() => {
                      const apt = selectedAppointment;
                      setSelectedAppointment(null);
                      onNavigateTab("consultations", apt);
                    }}
                  >
                    <Video size={14} />
                    <span>{selectedAppointment.status === "In Progress" ? "Continue Consultation" : "Start Consulting"}</span>
                  </button>
                )}
                {selectedAppointment.status === "Completed" && (
                  <button
                    type="button"
                    className="doctor-btn-secondary"
                    onClick={() => {
                      const apt = selectedAppointment;
                      setSelectedAppointment(null);
                      onNavigateTab("prescriptions", {
                        patientName: apt.patientName,
                        patientId: apt.patientId,
                        patientAge: apt.patientAge,
                        patientGender: apt.patientGender,
                        diagnosis: apt.reason,
                        preferredLanguage: apt.language,
                        appointmentId: apt.id,
                      });
                    }}
                  >
                    <FileText size={14} />
                    <span>View / Issue Prescription</span>
                  </button>
                )}
                <button
                  type="button"
                  className="doc-apt-btn-close"
                  onClick={() => setSelectedAppointment(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorAppointmentsTab;
