import { useState, useEffect, useCallback } from "react";
import {
  getInterpreterApplications,
  getUserDetails,
  approveInterpreterApplication,
  rejectInterpreterApplication,
  getAdminUsers,
} from "../../services/adminService";
import {
  Globe,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Eye,
  FileCheck,
  GraduationCap,
  Award,
  Phone,
  Mail,
  Calendar,
  X,
  Loader2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  Languages,
  UserCheck,
  Ban,
} from "lucide-react";

function InterpreterVerification({ onUpdateStats }) {
  const [interpreters, setInterpreters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, all: 0 });

  // View Details Modal State
  const [selectedInterpreter, setSelectedInterpreter] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Approval / Rejection Action Modals
  const [approvingInterpreter, setApprovingInterpreter] = useState(null);
  const [rejectingInterpreter, setRejectingInterpreter] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch counts across all statuses
  const fetchCounts = useCallback(async () => {
    try {
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        getAdminUsers({ role: "interpreter", status: "pending", limit: 1 }),
        getAdminUsers({ role: "interpreter", status: "approved", limit: 1 }),
        getAdminUsers({ role: "interpreter", status: "rejected", limit: 1 }),
      ]);
      const p = pendingRes?.totalUsers || 0;
      const a = approvedRes?.totalUsers || 0;
      const r = rejectedRes?.totalUsers || 0;
      setCounts({
        pending: p,
        approved: a,
        rejected: r,
        all: p + a + r,
      });
    } catch (err) {
      console.error("Failed to load verification counts:", err);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInterpreterApplications({
        status: activeTab,
        search: debouncedSearch,
        page: currentPage,
        limit: 10,
      });

      setInterpreters(data?.users || []);
      setTotalPages(data?.totalPages || 1);
      setTotalApplications(data?.totalUsers || 0);
      fetchCounts();
    } catch (err) {
      console.error("Failed to load interpreter applications:", err);
      setError("Unable to load interpreter verification applications.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, currentPage, fetchCounts]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // View Details
  const handleOpenDetails = async (interp) => {
    setSelectedInterpreter(interp);
    try {
      setDetailsLoading(true);
      const full = await getUserDetails(interp._id);
      if (full) {
        setSelectedInterpreter(full);
      }
    } catch (err) {
      console.error("Failed to fetch full application details:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedInterpreter(null);
  };

  // Confirm Approval
  const handleApproveInterpreter = async () => {
    if (!approvingInterpreter) return;
    try {
      setActionLoading(true);
      await approveInterpreterApplication(approvingInterpreter._id);
      setFeedback({
        type: "success",
        text: `${approvingInterpreter.name} has been approved successfully as a verified interpreter!`,
      });
      setApprovingInterpreter(null);
      if (selectedInterpreter && selectedInterpreter._id === approvingInterpreter._id) {
        setSelectedInterpreter(null);
      }
      fetchApplications();
      if (onUpdateStats) {
        onUpdateStats();
      }
    } catch (err) {
      console.error("Approval error:", err);
      setFeedback({
        type: "error",
        text: err?.response?.data?.message || "Failed to approve interpreter.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Rejection
  const handleRejectInterpreter = async () => {
    if (!rejectingInterpreter) return;
    try {
      setActionLoading(true);
      await rejectInterpreterApplication(rejectingInterpreter._id, rejectionReason);
      setFeedback({
        type: "success",
        text: `Interpreter application for ${rejectingInterpreter.name} has been rejected.`,
      });
      setRejectingInterpreter(null);
      setRejectionReason("");
      if (selectedInterpreter && selectedInterpreter._id === rejectingInterpreter._id) {
        setSelectedInterpreter(null);
      }
      fetchApplications();
      if (onUpdateStats) {
        onUpdateStats();
      }
    } catch (err) {
      console.error("Rejection error:", err);
      setFeedback({
        type: "error",
        text: err?.response?.data?.message || "Failed to reject interpreter.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not provided";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Not provided";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getAvatarInitials = (name) => {
    if (!name) return "IN";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="users-management-view interpreter-verification-view">
      {/* Top Banner */}
      <div className="users-header-card" style={{ marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>
            Interpreter Verification Center
          </h2>
          <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
            Review language credentials, certifications, and authorize interpreters on the HealTalk platform
          </p>
        </div>
        <div className="users-count-pill" style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}>
          <ShieldCheck size={16} />
          <span>{counts.pending} Pending Review</span>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`users-alert ${feedback.type === "success" ? "alert-success" : "error"}`}
          style={{
            padding: "12px 18px",
            backgroundColor: feedback.type === "success" ? "#f0fdf4" : "#fef2f2",
            borderColor: feedback.type === "success" ? "#dcfce7" : "#fee2e2",
            color: feedback.type === "success" ? "#15803d" : "#991b1b",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
            fontWeight: "500",
            marginBottom: "20px",
          }}
        >
          {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="users-controls-card" style={{ marginBottom: "20px" }}>
        {/* Status Filter Tabs */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            className={`admin-tab-btn ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("pending");
              setCurrentPage(1);
            }}
          >
            Pending ({counts.pending})
          </button>
          <button
            className={`admin-tab-btn ${activeTab === "approved" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("approved");
              setCurrentPage(1);
            }}
          >
            Approved ({counts.approved})
          </button>
          <button
            className={`admin-tab-btn ${activeTab === "rejected" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("rejected");
              setCurrentPage(1);
            }}
          >
            Rejected ({counts.rejected})
          </button>
          <button
            className={`admin-tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("all");
              setCurrentPage(1);
            }}
          >
            All ({counts.all})
          </button>
        </div>

        {/* Search & Refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, justifyContent: "flex-end" }}>
          <div className="users-search-box" style={{ maxWidth: "320px" }}>
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search interpreter, language, cert..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="search-clear-btn" onClick={() => setSearchTerm("")}>
                <X size={14} />
              </button>
            )}
          </div>

          <button className="users-refresh-btn" onClick={fetchApplications} title="Refresh Applications">
            <RefreshCw size={16} className={loading ? "spin-icon" : ""} />
          </button>
        </div>
      </div>

      {/* Applications Table Card */}
      <div className="users-table-card">
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th style={{ minWidth: "220px" }}>Interpreter</th>
                <th style={{ minWidth: "160px" }}>Languages</th>
                <th style={{ minWidth: "160px" }}>Qualification / Certification</th>
                <th style={{ minWidth: "120px" }}>Experience</th>
                <th style={{ minWidth: "140px" }}>Verification Details</th>
                <th style={{ minWidth: "130px" }}>Submitted Date</th>
                <th style={{ minWidth: "110px" }}>Status</th>
                <th style={{ minWidth: "200px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`skel-interp-${idx}`} className="skeleton-row">
                    <td>
                      <div className="skeleton-user-cell">
                        <div className="skeleton-avatar" />
                        <div className="skeleton-line w-120" />
                      </div>
                    </td>
                    <td><div className="skeleton-line w-100" /></td>
                    <td><div className="skeleton-line w-100" /></td>
                    <td><div className="skeleton-line w-70" /></td>
                    <td><div className="skeleton-line w-90" /></td>
                    <td><div className="skeleton-line w-80" /></td>
                    <td><div className="skeleton-line w-70" /></td>
                    <td style={{ textAlign: "right" }}><div className="skeleton-line w-100 ml-auto" /></td>
                  </tr>
                ))
              ) : interpreters.length === 0 ? (
                <tr>
                  <td colSpan={8} className="users-empty-cell">
                    <div className="users-empty-state">
                      <div className="empty-icon-circle" style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}>
                        <Globe size={32} />
                      </div>
                      <h3>No interpreter applications found</h3>
                      <p>
                        {activeTab === "pending"
                          ? "New interpreter registrations awaiting administrative verification will appear here."
                          : "No interpreter records matching current filters."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                interpreters.map((item) => {
                  const isPending = (item.status || "pending") === "pending";
                  const isApproved = item.status === "approved";
                  const isRejected = item.status === "rejected";
                  const languages = item.languages?.length
                    ? item.languages.join(", ")
                    : item.language || "Not provided";
                  const qualification = item.qualification || item.specialization || "Not provided";
                  const experience = item.experience || "Not provided";

                  return (
                    <tr key={item._id}>
                      <td>
                        <div className="user-profile-cell">
                          <div
                            className="user-table-avatar"
                            style={{
                              backgroundColor: "#f3e8ff",
                              color: "#7c3aed",
                              fontWeight: 700,
                            }}
                          >
                            {getAvatarInitials(item.name)}
                          </div>
                          <div className="user-name-cell">
                            <span className="user-name-text">{item.name}</span>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>{item.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className="specialty-badge-pill"
                          style={{
                            backgroundColor: "#f3e8ff",
                            color: "#7c3aed",
                          }}
                        >
                          <Languages size={13} />
                          {languages}
                        </span>
                      </td>
                      <td>{qualification}</td>
                      <td>{experience}</td>
                      <td>
                        <code className="info-code" style={{ color: "#7c3aed", fontWeight: 600 }}>
                          {item.licenseNumber || "Credential Verified"}
                        </code>
                      </td>
                      <td className="user-date-cell">
                        <div className="date-with-icon">
                          <Calendar size={13} />
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`user-status-badge ${
                            isApproved ? "approved" : isRejected ? "rejected" : "pending"
                          }`}
                        >
                          <span
                            className={`status-dot ${
                              isApproved ? "green" : isRejected ? "red" : "amber"
                            }`}
                          />
                          {item.status || "Pending"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="user-actions-row">
                          <button
                            className="btn-action-details"
                            onClick={() => handleOpenDetails(item)}
                            title="View Full Application"
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </button>

                          {isPending && (
                            <>
                              <button
                                className="btn-action-activate"
                                onClick={() => setApprovingInterpreter(item)}
                                title="Approve Interpreter"
                              >
                                <CheckCircle2 size={14} />
                                <span>Approve</span>
                              </button>
                              <button
                                className="btn-action-deactivate"
                                onClick={() => {
                                  setRejectingInterpreter(item);
                                  setRejectionReason("");
                                }}
                                title="Reject Interpreter"
                              >
                                <XCircle size={14} />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && interpreters.length > 0 && (
          <div className="users-pagination-bar">
            <div className="pagination-info">
              Showing <strong>{interpreters.length}</strong> of <strong>{totalApplications}</strong> applications
            </div>
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>
              <span className="pagination-page-indicator">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="pagination-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          1. VIEW INTERPRETER APPLICATION DETAILS MODAL (CENTERED MODAL)
         ========================================================================= */}
      {selectedInterpreter && (
        <div className="doctor-modal-overlay" onClick={handleCloseDetails}>
          <div className="doctor-modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Fixed Header */}
            <div className="doctor-modal-header">
              <div className="doctor-modal-header-left">
                <div
                  className="doctor-modal-avatar"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                    boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)",
                  }}
                >
                  {getAvatarInitials(selectedInterpreter.name)}
                </div>
                <div className="doctor-modal-titles">
                  <h3>
                    <span>{selectedInterpreter.name}</span>
                    {selectedInterpreter.isVerified && (
                      <ShieldCheck size={16} style={{ color: "#7c3aed" }} title="Verified Interpreter" />
                    )}
                    <span
                      style={{
                        padding: "2px 8px",
                        backgroundColor:
                          selectedInterpreter.status === "approved"
                            ? "#dcfce7"
                            : selectedInterpreter.status === "rejected"
                            ? "#fee2e2"
                            : "#fef3c7",
                        color:
                          selectedInterpreter.status === "approved"
                            ? "#166534"
                            : selectedInterpreter.status === "rejected"
                            ? "#991b1b"
                            : "#b45309",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        marginLeft: "4px",
                      }}
                    >
                      {selectedInterpreter.status || "Pending"}
                    </span>
                  </h3>
                  <p>
                    {selectedInterpreter.language || "Medical Interpreter"} • Complete verification information
                  </p>
                </div>
              </div>
              <button className="doctor-modal-close-btn" onClick={handleCloseDetails} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="doctor-modal-body">
              {detailsLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#7c3aed", fontSize: "13px", padding: "8px 0" }}>
                  <Loader2 size={16} className="spin-icon" />
                  <span>Loading interpreter verification details...</span>
                </div>
              )}

              {/* 1. Personal & Contact Information */}
              <div className="doctor-modal-section">
                <h4 className="doctor-modal-section-title">
                  <Mail size={14} style={{ color: "#7c3aed" }} />
                  <span>Personal & Contact Information</span>
                </h4>
                <div className="doctor-modal-grid-2">
                  <div className="doctor-modal-card">
                    <span className="doctor-modal-label">Interpreter Name</span>
                    <strong className="doctor-modal-value">{selectedInterpreter.name || "Not provided"}</strong>
                  </div>
                  <div className="doctor-modal-card">
                    <span className="doctor-modal-label">Email Address</span>
                    <strong className="doctor-modal-value">{selectedInterpreter.email || "Not provided"}</strong>
                  </div>
                  <div className="doctor-modal-card">
                    <span className="doctor-modal-label">Phone Number</span>
                    <strong className={`doctor-modal-value ${!selectedInterpreter.phone ? "muted" : ""}`}>
                      {selectedInterpreter.phone || "Not provided"}
                    </strong>
                  </div>
                  <div className="doctor-modal-card">
                    <span className="doctor-modal-label">Submitted Date</span>
                    <strong className="doctor-modal-value">{formatDate(selectedInterpreter.createdAt)}</strong>
                  </div>
                </div>
              </div>

              {/* 2. Languages & Qualifications */}
              <div className="doctor-modal-section">
                <h4 className="doctor-modal-section-title">
                  <GraduationCap size={14} style={{ color: "#7c3aed" }} />
                  <span>Languages & Qualifications</span>
                </h4>
                <div className="doctor-modal-grid-2">
                  <div className="doctor-modal-card">
                    <span className="doctor-modal-label">Languages</span>
                    <strong className="doctor-modal-value" style={{ color: "#7c3aed" }}>
                      {selectedInterpreter.languages?.length
                        ? selectedInterpreter.languages.join(", ")
                        : selectedInterpreter.language || "Not provided"}
                    </strong>
                  </div>
                  <div className="doctor-modal-card">
                    <span className="doctor-modal-label">Experience</span>
                    <strong className={`doctor-modal-value ${!selectedInterpreter.experience ? "muted" : ""}`}>
                      {selectedInterpreter.experience || "Not provided"}
                    </strong>
                  </div>
                  <div className="doctor-modal-card" style={{ gridColumn: "1 / -1" }}>
                    <span className="doctor-modal-label">Qualification / Certification</span>
                    <strong className={`doctor-modal-value ${(!selectedInterpreter.qualification && !selectedInterpreter.specialization) ? "muted" : ""}`}>
                      {selectedInterpreter.qualification || selectedInterpreter.specialization || "Not provided"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 3. Verification Documents / Details Checklist */}
              <div className="doctor-modal-section">
                <h4 className="doctor-modal-section-title">
                  <FileCheck size={14} style={{ color: "#7c3aed" }} />
                  <span>Verification Documents & Details</span>
                </h4>
                <div
                  style={{
                    background: "#faf5ff",
                    border: "1px solid #f3e8ff",
                    borderRadius: "10px",
                    padding: "14px 16px",
                    fontSize: "13px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#7c3aed" }}>
                    <CheckCircle2 size={16} />
                    <span>Language proficiency credential & medical translation qualification recorded</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#7c3aed" }}>
                    <CheckCircle2 size={16} />
                    <span>Applicant identity and contact details verified on HealTalk registry</span>
                  </div>
                  {selectedInterpreter.licenseNumber && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b21a8" }}>
                      <CheckCircle2 size={16} />
                      <span>Registration/Certification Number: <strong>{selectedInterpreter.licenseNumber}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Current Status & Rejection Notice if applicable */}
              <div className="doctor-modal-section">
                <h4 className="doctor-modal-section-title">
                  <ShieldCheck size={14} style={{ color: "#7c3aed" }} />
                  <span>Current Status</span>
                </h4>
                <div
                  className={`doctor-modal-status-banner ${
                    selectedInterpreter.status === "approved"
                      ? "approved"
                      : selectedInterpreter.status === "rejected"
                      ? "suspended"
                      : ""
                  }`}
                  style={
                    selectedInterpreter.status === "pending"
                      ? { backgroundColor: "#fffbeb", border: "1px solid #fde68a" }
                      : {}
                  }
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {selectedInterpreter.status === "approved" ? (
                      <CheckCircle2 size={22} style={{ color: "#16a34a", flexShrink: 0 }} />
                    ) : selectedInterpreter.status === "rejected" ? (
                      <XCircle size={22} style={{ color: "#dc2626", flexShrink: 0 }} />
                    ) : (
                      <Clock size={22} style={{ color: "#d97706", flexShrink: 0 }} />
                    )}
                    <div>
                      <strong
                        style={{
                          display: "block",
                          fontSize: "13px",
                          color:
                            selectedInterpreter.status === "approved"
                              ? "#166534"
                              : selectedInterpreter.status === "rejected"
                              ? "#991b1b"
                              : "#92400e",
                        }}
                      >
                        {selectedInterpreter.status === "approved"
                          ? "Approved Medical Interpreter"
                          : selectedInterpreter.status === "rejected"
                          ? "Rejected Application"
                          : "Pending Administrative Review"}
                      </strong>
                      <span
                        style={{
                          fontSize: "12px",
                          color:
                            selectedInterpreter.status === "approved"
                              ? "#15803d"
                              : selectedInterpreter.status === "rejected"
                              ? "#b91c1c"
                              : "#b45309",
                        }}
                      >
                        {selectedInterpreter.status === "approved"
                          ? "Interpreter is verified and authorized to join translation sessions."
                          : selectedInterpreter.status === "rejected"
                          ? selectedInterpreter.rejectionReason || "Application did not meet verification criteria."
                          : "Application is awaiting admin approval to join consultations."}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Modal Footer with Actions */}
            <div className="doctor-modal-footer">
              {selectedInterpreter.status === "pending" && (
                <>
                  <button
                    className="btn-modal-activate"
                    onClick={() => setApprovingInterpreter(selectedInterpreter)}
                  >
                    <CheckCircle2 size={16} />
                    <span>Approve</span>
                  </button>
                  <button
                    className="btn-modal-deactivate"
                    onClick={() => {
                      setRejectingInterpreter(selectedInterpreter);
                      setRejectionReason("");
                    }}
                  >
                    <XCircle size={16} />
                    <span>Reject</span>
                  </button>
                </>
              )}
              <button className="doctor-modal-btn-close" onClick={handleCloseDetails}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. APPROVE CONFIRMATION DIALOG MODAL
         ========================================================================= */}
      {approvingInterpreter && (
        <div className="doctor-confirm-overlay" onClick={() => setApprovingInterpreter(null)}>
          <div className="doctor-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="doctor-confirm-icon-circle activate">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="doctor-confirm-title">Approve Interpreter Application?</h3>
            <p className="doctor-confirm-message">
              Are you sure you want to approve <strong>{approvingInterpreter.name}</strong> as a verified interpreter on HealTalk?
            </p>

            <div className="doctor-confirm-actions">
              <button
                className="doctor-confirm-btn-cancel"
                onClick={() => setApprovingInterpreter(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="doctor-confirm-btn-confirm activate"
                onClick={handleApproveInterpreter}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 size={15} className="spin-icon" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Approve</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. REJECT CONFIRMATION DIALOG MODAL WITH REASON
         ========================================================================= */}
      {rejectingInterpreter && (
        <div className="doctor-confirm-overlay" onClick={() => setRejectingInterpreter(null)}>
          <div
            className="doctor-confirm-dialog"
            style={{ maxWidth: "480px", textAlign: "left" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div className="doctor-confirm-icon-circle deactivate" style={{ margin: 0, width: "44px", height: "44px" }}>
                <XCircle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                  Reject Interpreter Application
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
                  {rejectingInterpreter.name}
                </p>
              </div>
            </div>

            <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 12px 0" }}>
              Please provide a short rejection reason for the applicant's record:
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Language certification documentation could not be verified."
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: "18px",
              }}
            />

            <div className="doctor-confirm-actions">
              <button
                className="doctor-confirm-btn-cancel"
                onClick={() => setRejectingInterpreter(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="doctor-confirm-btn-confirm deactivate"
                onClick={handleRejectInterpreter}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 size={15} className="spin-icon" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Reject</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InterpreterVerification;
