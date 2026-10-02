import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getAdminAppointments,
  updateAdminAppointmentStatus,
  getAdminAppointmentDetails,
} from "../../services/adminService";
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Eye,
  User,
  Stethoscope,
  Globe,
  FileText,
  CalendarCheck,
  CalendarX,
  ChevronDown,
  X,
  TrendingUp,
  Tag,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper to parse time string like "09:00 AM" to minutes for reliable sorting
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 999999;
  const str = String(timeStr).trim().toLowerCase();
  const match = str.match(/(\d{1,2}):(\d{2})(?:\s*(am|pm))?/i);
  if (!match) return 999999;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3];

  if (period) {
    if (period.toLowerCase() === "pm" && hours < 12) hours += 12;
    if (period.toLowerCase() === "am" && hours === 12) hours = 0;
  }
  return hours * 60 + minutes;
};

// Format date nicely e.g. "Wednesday, Sep 23, 2026"
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "Not provided";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
};

function AppointmentsManagement({ onUpdateStats }) {
  const todayDateStr = useMemo(() => getLocalDateString(), []);

  // Filter and view states
  const [selectedDate, setSelectedDate] = useState(todayDateStr);
  const [activeStatusTab, setActiveStatusTab] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Data states
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    totalToday: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal / Detail state
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch appointments from MongoDB backend
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getAdminAppointments({
        date: selectedDate,
        status: activeStatusTab === "all" ? "" : activeStatusTab,
        type: selectedType === "all" ? "" : selectedType,
        search: debouncedSearch,
      });

      const fetchedList = res.appointments || [];

      // Sort today's appointments by time earliest first
      fetchedList.sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));

      setAppointments(fetchedList);

      if (res.stats) {
        setStats({
          totalToday: res.stats.totalToday ?? 0,
          upcoming: res.stats.upcoming ?? 0,
          completed: res.stats.completed ?? 0,
          cancelled: res.stats.cancelled ?? 0,
        });
      }
    } catch (err) {
      console.error("Failed to load appointments from MongoDB:", err);
      setError("Unable to load appointments. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, activeStatusTab, selectedType, debouncedSearch]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Handle open appointment details
  const handleOpenDetails = async (apt) => {
    setSelectedAppointment(apt);
    try {
      setModalLoading(true);
      const res = await getAdminAppointmentDetails(apt._id || apt.id);
      if (res?.appointment) {
        setSelectedAppointment(res.appointment);
      }
    } catch (err) {
      console.warn("Could not load extended details:", err);
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Status Update
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedAppointment) return;
    try {
      setStatusUpdating(true);
      const aptId = selectedAppointment._id || selectedAppointment.id;
      const res = await updateAdminAppointmentStatus(aptId, newStatus);

      setActionSuccess(`Appointment status successfully updated to ${newStatus}`);
      setTimeout(() => setActionSuccess(""), 3500);

      // Update in local state
      setAppointments((prev) =>
        prev.map((item) =>
          (item._id || item.id) === aptId
            ? { ...item, status: newStatus }
            : item
        )
      );

      // Update selected appointment in modal
      if (res.appointment) {
        setSelectedAppointment(res.appointment);
      } else {
        setSelectedAppointment((prev) => ({ ...prev, status: newStatus }));
      }

      // Refresh stats and parent dashboard stats
      fetchAppointments();
      if (onUpdateStats) onUpdateStats();
    } catch (err) {
      console.error("Failed to update status:", err);
      setError(err.message || "Failed to update appointment status");
    } finally {
      setStatusUpdating(false);
    }
  };

  // Reset to Today
  const handleResetToToday = () => {
    setSelectedDate(todayDateStr);
    setActiveStatusTab("all");
    setSelectedType("all");
    setSearchTerm("");
  };

  const isViewingToday = selectedDate === todayDateStr;

  // Render Type Badge
  const renderTypeIcon = (type) => {
    const t = (type || "").toLowerCase();
    if (t.includes("video")) return <Video size={14} className="apt-type-icon video" />;
    if (t.includes("voice") || t.includes("call") || t.includes("phone"))
      return <Phone size={14} className="apt-type-icon voice" />;
    return <MessageSquare size={14} className="apt-type-icon chat" />;
  };

  // Render Status Badge
  const renderStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "confirmed" || s === "upcoming") {
      return (
        <span className="admin-status-tag approved" title="Confirmed / Upcoming Consultation">
          <Clock size={12} style={{ marginRight: "4px" }} />
          Upcoming
        </span>
      );
    }
    if (s === "completed") {
      return (
        <span className="admin-status-tag" style={{ backgroundColor: "#ecfdf5", color: "#047857" }} title="Completed">
          <CheckCircle2 size={12} style={{ marginRight: "4px" }} />
          Completed
        </span>
      );
    }
    if (s === "cancelled") {
      return (
        <span className="admin-status-tag rejected" title="Cancelled">
          <XCircle size={12} style={{ marginRight: "4px" }} />
          Cancelled
        </span>
      );
    }
    return <span className="admin-status-tag pending">{status || "Pending"}</span>;
  };

  // Safe field extractor with "Not provided" fallback
  const getField = (val) => {
    if (val === null || val === undefined || String(val).trim() === "") {
      return "Not provided";
    }
    return val;
  };

  return (
    <div className="admin-appointments-page">
      {/* 1. PAGE HEADER & DATE BAR */}
      <div className="admin-appointments-header">
        <div>
          <div className="admin-date-indicator">
            <span className="admin-date-chip">
              <Calendar size={15} />
              {isViewingToday ? "Today's Schedule" : "Viewing Date"}:{" "}
              <strong>{formatDisplayDate(selectedDate)}</strong>
            </span>
            {!isViewingToday && (
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={handleResetToToday}
                style={{ padding: "4px 10px", fontSize: "12px", height: "auto" }}
              >
                Back to Today
              </button>
            )}
          </div>
          <h2 className="admin-section-heading">Appointments for Today</h2>
          <p className="admin-section-sub">
            Monitor, review, and manage all patient consultations scheduled for today in real time.
          </p>
        </div>

        <div className="admin-header-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Date Selector */}
          <div className="admin-date-picker-wrapper">
            <input
              type="date"
              className="admin-input-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              title="Filter by appointment date"
            />
          </div>

          <button
            type="button"
            className="admin-notif-btn"
            onClick={fetchAppointments}
            title="Refresh Appointments"
            aria-label="Refresh Appointments"
          >
            <RefreshCw size={17} className={loading ? "spin-icon" : ""} />
          </button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="admin-alert-banner error" style={{ marginBottom: "20px" }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
          <button
            onClick={fetchAppointments}
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: "none",
              color: "#991b1b",
              textDecoration: "underline",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ACTION SUCCESS BANNER */}
      {actionSuccess && (
        <div className="admin-alert-banner success" style={{ marginBottom: "20px" }}>
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 2. SUMMARY CARDS FOR TODAY */}
      <section className="admin-stats-grid" style={{ marginBottom: "24px" }}>
        {/* Total Appointments Today */}
        <div
          className={`admin-stat-card appointments ${activeStatusTab === "all" ? "card-highlight" : ""}`}
          onClick={() => setActiveStatusTab("all")}
          style={{ cursor: "pointer" }}
        >
          <div className="admin-stat-top">
            <div className="admin-stat-icon-box">
              <Calendar size={22} />
            </div>
            <span className="admin-stat-pill">Today</span>
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-number">
              {loading ? <Loader2 size={20} className="spin-icon" /> : stats.totalToday}
            </div>
            <div className="admin-stat-label">Total Appointments Today</div>
          </div>
          <div className="admin-stat-subtext">
            <TrendingUp size={13} style={{ color: "#087f8c" }} />
            <span>Scheduled for {isViewingToday ? "today" : selectedDate}</span>
          </div>
        </div>

        {/* Upcoming */}
        <div
          className={`admin-stat-card doctors ${activeStatusTab === "upcoming" ? "card-highlight" : ""}`}
          onClick={() => setActiveStatusTab("upcoming")}
          style={{ cursor: "pointer" }}
        >
          <div className="admin-stat-top">
            <div className="admin-stat-icon-box" style={{ background: "rgba(14, 165, 233, 0.12)", color: "#0284c7" }}>
              <Clock size={22} />
            </div>
            <span className="admin-stat-pill" style={{ background: "#e0f2fe", color: "#0369a1" }}>
              Confirmed
            </span>
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-number" style={{ color: "#0284c7" }}>
              {loading ? <Loader2 size={20} className="spin-icon" /> : stats.upcoming}
            </div>
            <div className="admin-stat-label">Upcoming</div>
          </div>
          <div className="admin-stat-subtext">
            <CalendarCheck size={13} style={{ color: "#0284c7" }} />
            <span>Awaiting or in progress</span>
          </div>
        </div>

        {/* Completed */}
        <div
          className={`admin-stat-card patients ${activeStatusTab === "completed" ? "card-highlight" : ""}`}
          onClick={() => setActiveStatusTab("completed")}
          style={{ cursor: "pointer" }}
        >
          <div className="admin-stat-top">
            <div className="admin-stat-icon-box" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
              <CheckCircle2 size={22} />
            </div>
            <span className="admin-stat-pill" style={{ background: "#ecfdf5", color: "#047857" }}>
              Finished
            </span>
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-number" style={{ color: "#059669" }}>
              {loading ? <Loader2 size={20} className="spin-icon" /> : stats.completed}
            </div>
            <div className="admin-stat-label">Completed</div>
          </div>
          <div className="admin-stat-subtext">
            <CheckCircle2 size={13} style={{ color: "#10b981" }} />
            <span>Consultations concluded</span>
          </div>
        </div>

        {/* Cancelled */}
        <div
          className={`admin-stat-card pending-interp ${activeStatusTab === "cancelled" ? "card-highlight" : ""}`}
          onClick={() => setActiveStatusTab("cancelled")}
          style={{ cursor: "pointer" }}
        >
          <div className="admin-stat-top">
            <div className="admin-stat-icon-box" style={{ background: "rgba(239, 68, 68, 0.12)", color: "#ef4444" }}>
              <CalendarX size={22} />
            </div>
            <span className="admin-stat-pill rose">Cancelled</span>
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-number" style={{ color: "#dc2626" }}>
              {loading ? <Loader2 size={20} className="spin-icon" /> : stats.cancelled}
            </div>
            <div className="admin-stat-label">Cancelled</div>
          </div>
          <div className="admin-stat-subtext">
            <XCircle size={13} style={{ color: "#ef4444" }} />
            <span>Cancelled sessions</span>
          </div>
        </div>
      </section>

      {/* 3. REDESIGNED FILTERS, SEARCH AND CUSTOM DROPDOWN */}
      <div className="apt-filter-container">
        <div className="apt-filter-topbar">
          {/* Modern Search Box */}
          <div className="apt-search-wrapper">
            <Search size={17} className="apt-search-icon" />
            <input
              type="text"
              placeholder="Search patient, doctor, specialty, reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="apt-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="apt-search-clear"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Redesigned Custom Type Dropdown */}
          <div className="apt-custom-select-wrapper">
            <label className="apt-select-label" htmlFor="apt-type-filter">
              <Filter size={14} className="apt-select-lead-icon" />
              <span>Type:</span>
            </label>
            <div className="apt-select-field-box">
              <select
                id="apt-type-filter"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="apt-custom-select"
              >
                <option value="all">All Consultation Types</option>
                <option value="Video Call">Video Call</option>
                <option value="Voice Call">Voice Call</option>
                <option value="Chat">Chat</option>
              </select>
              <ChevronDown size={15} className="apt-select-arrow" />
            </div>
          </div>
        </div>

        {/* Redesigned Modern Filter Tabs */}
        <div className="apt-segmented-tabs">
          <button
            type="button"
            className={`apt-tab-button ${activeStatusTab === "all" ? "active" : ""}`}
            onClick={() => setActiveStatusTab("all")}
          >
            <span className="apt-tab-label">All Appointments</span>
            <span className="apt-tab-counter">{stats.totalToday}</span>
          </button>

          <button
            type="button"
            className={`apt-tab-button upcoming ${activeStatusTab === "upcoming" ? "active" : ""}`}
            onClick={() => setActiveStatusTab("upcoming")}
          >
            <span className="apt-tab-dot upcoming" />
            <span className="apt-tab-label">Upcoming</span>
            <span className="apt-tab-counter upcoming">{stats.upcoming}</span>
          </button>

          <button
            type="button"
            className={`apt-tab-button completed ${activeStatusTab === "completed" ? "active" : ""}`}
            onClick={() => setActiveStatusTab("completed")}
          >
            <span className="apt-tab-dot completed" />
            <span className="apt-tab-label">Completed</span>
            <span className="apt-tab-counter completed">{stats.completed}</span>
          </button>

          <button
            type="button"
            className={`apt-tab-button cancelled ${activeStatusTab === "cancelled" ? "active" : ""}`}
            onClick={() => setActiveStatusTab("cancelled")}
          >
            <span className="apt-tab-dot cancelled" />
            <span className="apt-tab-label">Cancelled</span>
            <span className="apt-tab-counter cancelled">{stats.cancelled}</span>
          </button>
        </div>
      </div>

      {/* 4. APPOINTMENTS TABLE LIST */}
      <div className="users-table-card">
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th style={{ width: "22%" }}>Patient Name</th>
                <th style={{ width: "22%" }}>Doctor Name</th>
                <th style={{ width: "13%" }}>Date</th>
                <th style={{ width: "13%" }}>Time</th>
                <th style={{ width: "15%" }}>Appointment Type</th>
                <th style={{ width: "15%" }}>Status</th>
                <th style={{ width: "10%", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "60px 20px" }}>
                    <Loader2 size={32} className="spin-icon" style={{ color: "#087f8c", margin: "0 auto 12px" }} />
                    <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>
                      Fetching appointments from MongoDB...
                    </p>
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                /* EMPTY STATE AS REQUIRED */
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "64px 20px" }}>
                    <div className="apt-empty-state">
                      <div className="apt-empty-icon-box">
                        <Calendar size={36} style={{ color: "#087f8c" }} />
                      </div>
                      <h4 className="apt-empty-title">No appointments scheduled for today.</h4>
                      <p className="apt-empty-desc">
                        {searchTerm || activeStatusTab !== "all" || selectedType !== "all"
                          ? "No appointments match your active search or filter criteria."
                          : "There are currently no patient consultation sessions booked for today's schedule."}
                      </p>
                      {(searchTerm || activeStatusTab !== "all" || selectedType !== "all" || !isViewingToday) && (
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          onClick={handleResetToToday}
                          style={{ marginTop: "14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                          <RefreshCw size={14} />
                          Reset Filters & View Today
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => {
                  const patientName =
                    apt.patient?.name || (typeof apt.patient === "string" ? apt.patient : "Not provided");
                  const patientEmail = apt.patient?.email || "";
                  const patientInitial = (patientName.charAt(0) || "P").toUpperCase();

                  const doctorName =
                    apt.doctor?.name || apt.doctorName || "Not provided";
                  const specialty =
                    apt.specialty || apt.doctor?.specialty || "Specialist";

                  return (
                    <tr key={apt._id || apt.id}>
                      {/* Patient Name */}
                      <td>
                        <div className="users-user-cell">
                          <div
                            className="users-user-avatar"
                            style={{ background: "#e0f2fe", color: "#0369a1", fontWeight: 700 }}
                          >
                            {patientInitial}
                          </div>
                          <div className="users-user-meta">
                            <span className="users-user-name">{patientName}</span>
                            {patientEmail && (
                              <span className="users-user-email" title={patientEmail}>
                                {patientEmail}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Doctor Name */}
                      <td>
                        <div className="users-user-cell">
                          <div
                            className="users-user-avatar"
                            style={{ background: "rgba(8, 127, 140, 0.12)", color: "#087f8c" }}
                          >
                            <Stethoscope size={16} />
                          </div>
                          <div className="users-user-meta">
                            <span className="users-user-name">{doctorName}</span>
                            <span className="users-user-email" style={{ color: "#087f8c", fontWeight: 500 }}>
                              {specialty}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td>
                        <span className="apt-date-text">
                          {apt.date || "Today"}
                        </span>
                      </td>

                      {/* Time (Earliest First) */}
                      <td>
                        <div className="apt-time-badge">
                          <Clock size={13} style={{ color: "#087f8c" }} />
                          <span>{apt.time || "--:--"}</span>
                        </div>
                      </td>

                      {/* Appointment Type */}
                      <td>
                        <div className="apt-type-chip">
                          {renderTypeIcon(apt.type)}
                          <span>{apt.type || "Video Call"}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        {renderStatusBadge(apt.status)}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="users-action-btn view"
                          onClick={() => handleOpenDetails(apt)}
                          title="View appointment details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info showing total items */}
        {!loading && appointments.length > 0 && (
          <div className="users-table-footer" style={{ justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              Showing <strong>{appointments.length}</strong> appointment{appointments.length !== 1 ? "s" : ""} sorted chronologically by time.
            </span>
            <span className="admin-stat-pill">Sorted by Earliest First</span>
          </div>
        )}
      </div>

      {/* 5. CENTERED APPOINTMENT DETAILS MODAL OVERLAY */}
      {selectedAppointment && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setSelectedAppointment(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-details-modal apt-details-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Title and Prominent X Close Button */}
            <div className="modal-header">
              <div className="modal-title-group">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Calendar size={18} style={{ color: "#087f8c" }} />
                  <h3>Appointment Details</h3>
                </div>
                <p>Consultation session record and participant details</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedAppointment(null)}
                aria-label="Close modal"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body with Internal Scroll */}
            <div className="modal-body apt-modal-body-scroll">
              {modalLoading ? (
                <div className="modal-loading-box">
                  <Loader2 size={30} className="spin-icon" style={{ color: "#087f8c" }} />
                  <span>Loading appointment records...</span>
                </div>
              ) : (
                <div className="apt-modal-content-stack">
                  {/* Status Banner */}
                  <div className="apt-modal-status-banner">
                    <div>
                      <span className="apt-modal-sub-label">Current Status</span>
                      <strong className="apt-modal-status-text">
                        {getField(selectedAppointment.status)}
                      </strong>
                    </div>
                    {renderStatusBadge(selectedAppointment.status)}
                  </div>

                  {/* Consultation Schedule Grid */}
                  <div className="apt-modal-grid-3">
                    <div className="apt-modal-grid-card">
                      <span className="apt-modal-field-label">
                        <Calendar size={13} />
                        Appointment Date
                      </span>
                      <div className="apt-modal-field-val">
                        {getField(selectedAppointment.date)}
                      </div>
                    </div>

                    <div className="apt-modal-grid-card">
                      <span className="apt-modal-field-label">
                        <Clock size={13} />
                        Appointment Time
                      </span>
                      <div className="apt-modal-field-val highlight">
                        {getField(selectedAppointment.time)}
                      </div>
                    </div>

                    <div className="apt-modal-grid-card">
                      <span className="apt-modal-field-label">
                        <Tag size={13} />
                        Appointment Type
                      </span>
                      <div className="apt-modal-field-val">
                        {getField(selectedAppointment.type)}
                      </div>
                    </div>
                  </div>

                  {/* Two-Column Participant Cards */}
                  <div className="apt-modal-grid-2">
                    {/* Patient Information Card */}
                    <div className="apt-modal-profile-card">
                      <div className="apt-modal-card-header patient">
                        <User size={15} />
                        <span>Patient Information</span>
                      </div>
                      <div className="apt-modal-card-body">
                        <div className="apt-field-row">
                          <span className="apt-label">Patient Name:</span>
                          <span className="apt-val-bold">
                            {getField(selectedAppointment.patient?.name)}
                          </span>
                        </div>
                        <div className="apt-field-row">
                          <span className="apt-label">Patient Email:</span>
                          <span className="apt-val" title={selectedAppointment.patient?.email}>
                            {getField(selectedAppointment.patient?.email)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Doctor Information Card */}
                    <div className="apt-modal-profile-card">
                      <div className="apt-modal-card-header doctor">
                        <Stethoscope size={15} />
                        <span>Doctor Information</span>
                      </div>
                      <div className="apt-modal-card-body">
                        <div className="apt-field-row">
                          <span className="apt-label">Doctor Name:</span>
                          <span className="apt-val-bold">
                            {getField(selectedAppointment.doctor?.name || selectedAppointment.doctorName)}
                          </span>
                        </div>
                        <div className="apt-field-row">
                          <span className="apt-label">Specialty:</span>
                          <span className="apt-val-badge">
                            {getField(selectedAppointment.specialty || selectedAppointment.doctor?.specialty)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reason for Consultation */}
                  <div className="apt-modal-info-box">
                    <div className="apt-modal-info-header">
                      <FileText size={15} />
                      <span>Reason for Consultation</span>
                    </div>
                    <p className="apt-modal-info-text">
                      {getField(selectedAppointment.reason)}
                    </p>
                  </div>

                  {/* Language Interpreter Information */}
                  <div className={`apt-modal-interp-box ${selectedAppointment.interpreterRequested ? "requested" : ""}`}>
                    <Globe size={18} className="apt-interp-icon" />
                    <div style={{ flex: 1 }}>
                      <div className="apt-interp-title">
                        Language Interpreter
                      </div>
                      <div className="apt-interp-sub">
                        {selectedAppointment.interpreterRequested ? (
                          <>
                            <strong>Requested</strong> • Language:{" "}
                            <span className="apt-interp-lang-tag">
                              {getField(selectedAppointment.interpreterLanguage)}
                            </span>
                          </>
                        ) : (
                          "No interpreter requested for this session"
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Admin Status Management Action Controls */}
                  <div className="apt-modal-actions-area">
                    <span className="apt-actions-label">
                      Update Appointment Status:
                    </span>
                    <div className="apt-actions-buttons">
                      {/* Upcoming / Confirmed Button (Blue) */}
                      <button
                        type="button"
                        className="apt-action-btn btn-status-confirmed"
                        disabled={statusUpdating || (selectedAppointment.status || "").toLowerCase() === "confirmed"}
                        onClick={() => handleUpdateStatus("Confirmed")}
                        title="Set status to Upcoming / Confirmed"
                      >
                        {statusUpdating ? (
                          <Loader2 size={14} className="spin-icon" />
                        ) : (
                          <Clock size={14} />
                        )}
                        <span>Set Upcoming / Confirmed</span>
                      </button>

                      {/* Mark as Completed Button (Green) */}
                      <button
                        type="button"
                        className="apt-action-btn btn-status-completed"
                        disabled={statusUpdating || (selectedAppointment.status || "").toLowerCase() === "completed"}
                        onClick={() => handleUpdateStatus("Completed")}
                        title="Mark consultation as completed"
                      >
                        {statusUpdating ? (
                          <Loader2 size={14} className="spin-icon" />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        <span>Mark as Completed</span>
                      </button>

                      {/* Cancel Appointment Button (Red) */}
                      <button
                        type="button"
                        className="apt-action-btn btn-status-cancelled"
                        disabled={statusUpdating || (selectedAppointment.status || "").toLowerCase() === "cancelled"}
                        onClick={() => handleUpdateStatus("Cancelled")}
                        title="Cancel this appointment"
                      >
                        {statusUpdating ? (
                          <Loader2 size={14} className="spin-icon" />
                        ) : (
                          <XCircle size={14} />
                        )}
                        <span>Cancel Appointment</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with Clean Secondary Close Button */}
            <div className="apt-modal-footer">
              <button
                type="button"
                className="apt-btn-close-footer"
                onClick={() => setSelectedAppointment(null)}
              >
                <X size={15} />
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentsManagement;
