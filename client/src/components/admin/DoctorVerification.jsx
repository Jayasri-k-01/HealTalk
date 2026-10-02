import { useState, useEffect, useCallback } from "react";
import {
  getDoctorApplications,
  getDoctorVerificationDetails,
  approveDoctorApplication,
  rejectDoctorApplication,
} from "../../services/adminService";
import {
  Stethoscope,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Eye,
  FileCheck,
  Building,
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
} from "lucide-react";

function DoctorVerification({ onUpdateStats }) {
  const [doctors, setDoctors] = useState([]);
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
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Approval / Rejection Action Modals
  const [approvingDoctor, setApprovingDoctor] = useState(null);
  const [rejectingDoctor, setRejectingDoctor] = useState(null);
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

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDoctorApplications({
        status: activeTab,
        search: debouncedSearch,
        page: currentPage,
        limit: 10,
      });

      setDoctors(data?.doctors || []);
      setTotalPages(data?.totalPages || 1);
      setTotalApplications(data?.totalApplications || 0);
      if (data?.counts) {
        setCounts(data.counts);
      }
    } catch (err) {
      console.error("Failed to load doctor applications:", err);
      setError("Unable to load doctor verification applications.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, currentPage]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // View Details
  const handleOpenDetails = async (doc) => {
    setSelectedDoctor(doc);
    try {
      setDetailsLoading(true);
      const full = await getDoctorVerificationDetails(doc._id);
      setSelectedDoctor(full);
    } catch (err) {
      console.error("Failed to fetch full application details:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedDoctor(null);
  };

  // Confirm Approval
  const handleApproveDoctor = async () => {
    if (!approvingDoctor) return;
    try {
      setActionLoading(true);
      await approveDoctorApplication(approvingDoctor._id);
      setFeedback({
        type: "success",
        text: `Dr. ${approvingDoctor.name} has been approved successfully!`,
      });
      setApprovingDoctor(null);
      if (selectedDoctor && selectedDoctor._id === approvingDoctor._id) {
        setSelectedDoctor(null);
      }
      fetchApplications();
      if (onUpdateStats) {
        onUpdateStats();
      }
    } catch (err) {
      console.error("Approval error:", err);
      setFeedback({
        type: "error",
        text: err?.response?.data?.message || "Failed to approve doctor.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Rejection
  const handleRejectDoctor = async () => {
    if (!rejectingDoctor) return;
    try {
      setActionLoading(true);
      await rejectDoctorApplication(rejectingDoctor._id, rejectionReason);
      setFeedback({
        type: "success",
        text: `Doctor application for ${rejectingDoctor.name} has been rejected.`,
      });
      setRejectingDoctor(null);
      setRejectionReason("");
      if (selectedDoctor && selectedDoctor._id === rejectingDoctor._id) {
        setSelectedDoctor(null);
      }
      fetchApplications();
      if (onUpdateStats) {
        onUpdateStats();
      }
    } catch (err) {
      console.error("Rejection error:", err);
      setFeedback({
        type: "error",
        text: err?.response?.data?.message || "Failed to reject doctor.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getAvatarInitials = (name) => {
    if (!name) return "DR";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="users-management-view">
      {/* Top Banner */}
      <div className="users-header-card">
        <div>
          <h2>Doctor Verification Center</h2>
          <p>Review medical credentials, licenses, and authorize doctors on the HealTalk platform.</p>
        </div>
        <div className="users-count-pill" style={{ backgroundColor: "#ccfbf1", color: "#0f766e" }}>
          <Stethoscope size={16} />
          <span>{counts.pending} Pending Review</span>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`users-alert ${feedback.type === "success" ? "alert-success" : "error"}`}
          style={{
            backgroundColor: feedback.type === "success" ? "#f0fdf4" : "#fef2f2",
            borderColor: feedback.type === "success" ? "#dcfce7" : "#fee2e2",
            color: feedback.type === "success" ? "#15803d" : "#991b1b",
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
      <div className="users-controls-card">
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
              placeholder="Search doctor, license, hospital..."
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
                <th>Doctor</th>
                <th>Specialization</th>
                <th>Qualification</th>
                <th>Experience</th>
                <th>License / Reg No.</th>
                <th>Submitted Date</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`skel-doc-${idx}`} className="skeleton-row">
                    <td>
                      <div className="skeleton-user-cell">
                        <div className="skeleton-avatar" />
                        <div className="skeleton-line w-120" />
                      </div>
                    </td>
                    <td><div className="skeleton-line w-100" /></td>
                    <td><div className="skeleton-line w-80" /></td>
                    <td><div className="skeleton-line w-70" /></td>
                    <td><div className="skeleton-line w-90" /></td>
                    <td><div className="skeleton-line w-80" /></td>
                    <td><div className="skeleton-line w-70" /></td>
                    <td style={{ textAlign: "right" }}><div className="skeleton-line w-100 ml-auto" /></td>
                  </tr>
                ))
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="users-empty-cell">
                    <div className="users-empty-state">
                      <div className="empty-icon-circle" style={{ backgroundColor: "#f0fdfa", color: "#0f766e" }}>
                        <Stethoscope size={32} />
                      </div>
                      <h3>No doctor applications found</h3>
                      <p>
                        {activeTab === "pending"
                          ? "New doctor registrations awaiting administrative verification will appear here."
                          : "No doctor records matching current filters."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                doctors.map((doc) => {
                  const isPending = (doc.status || "pending") === "pending";
                  const isApproved = doc.status === "approved";
                  const isRejected = doc.status === "rejected";

                  return (
                    <tr key={doc._id}>
                      <td>
                        <div className="user-profile-cell">
                          <div className="user-table-avatar doctor">
                            {getAvatarInitials(doc.name)}
                          </div>
                          <div className="user-name-cell">
                            <span className="user-name-text">{doc.name}</span>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>{doc.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontWeight: 600,
                            color: "#0f766e",
                            fontSize: "12px",
                          }}
                        >
                          <Stethoscope size={13} />
                          {doc.specialization || "General Medicine"}
                        </span>
                      </td>
                      <td>{doc.qualification || "MD / MBBS"}</td>
                      <td>{doc.experience || "N/A"}</td>
                      <td>
                        <code className="info-code" style={{ color: "#0f766e", fontWeight: 600 }}>
                          {doc.licenseNumber || "Pending"}
                        </code>
                      </td>
                      <td className="user-date-cell">
                        <div className="date-with-icon">
                          <Calendar size={13} />
                          <span>{formatDate(doc.createdAt)}</span>
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
                          {doc.status || "Pending"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="user-actions-row">
                          <button
                            className="btn-action-details"
                            onClick={() => handleOpenDetails(doc)}
                            title="View Full Application"
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </button>

                          {isPending && (
                            <>
                              <button
                                className="btn-action-activate"
                                onClick={() => setApprovingDoctor(doc)}
                                title="Approve Doctor"
                              >
                                <CheckCircle2 size={14} />
                                <span>Approve</span>
                              </button>
                              <button
                                className="btn-action-deactivate"
                                onClick={() => {
                                  setRejectingDoctor(doc);
                                  setRejectionReason("");
                                }}
                                title="Reject Doctor"
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
        {!loading && doctors.length > 0 && (
          <div className="users-pagination-bar">
            <div className="pagination-info">
              Showing <strong>{doctors.length}</strong> of <strong>{totalApplications}</strong> applications
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
          1. VIEW DOCTOR APPLICATION DETAILS MODAL
         ========================================================================= */}
      {selectedDoctor && (
        <div className="admin-modal-backdrop" onClick={handleCloseDetails}>
          <div className="admin-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>Doctor Application Review</h3>
                <p>Verify medical credentials and authorizing credentials</p>
              </div>
              <button className="modal-close-btn" onClick={handleCloseDetails}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {detailsLoading ? (
                <div className="modal-loading-box">
                  <Loader2 size={30} className="spin-icon" />
                  <span>Loading application record...</span>
                </div>
              ) : (
                <>
                  {/* Doctor Banner */}
                  <div className="modal-user-banner" style={{ background: "#f0fdfa", borderColor: "#ccfbf1" }}>
                    <div className="modal-user-avatar doctor">
                      {getAvatarInitials(selectedDoctor.name)}
                    </div>
                    <div className="modal-user-banner-info">
                      <h4>{selectedDoctor.name}</h4>
                      <div className="modal-user-badges">
                        <span className="user-role-badge doctor">Medical Doctor</span>
                        <span
                          className={`user-status-badge ${
                            selectedDoctor.status === "approved"
                              ? "approved"
                              : selectedDoctor.status === "rejected"
                              ? "rejected"
                              : "pending"
                          }`}
                        >
                          <span
                            className={`status-dot ${
                              selectedDoctor.status === "approved"
                                ? "green"
                                : selectedDoctor.status === "rejected"
                                ? "red"
                                : "amber"
                            }`}
                          />
                          {selectedDoctor.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 1: Personal Information */}
                  <div className="modal-section-title">
                    <Mail size={14} />
                    Personal Information
                  </div>
                  <div className="modal-info-grid">
                    <div className="modal-info-item">
                      <span className="info-label">Full Name</span>
                      <span className="info-value">{selectedDoctor.name}</span>
                    </div>
                    <div className="modal-info-item">
                      <span className="info-label">Email Address</span>
                      <span className="info-value">{selectedDoctor.email}</span>
                    </div>
                    <div className="modal-info-item">
                      <span className="info-label">Phone Number</span>
                      <span className="info-value">{selectedDoctor.phone || "Not provided"}</span>
                    </div>
                    <div className="modal-info-item">
                      <span className="info-label">Languages Spoken</span>
                      <span className="info-value">{selectedDoctor.language || "English"}</span>
                    </div>
                  </div>

                  {/* Section 2: Professional Information */}
                  <div className="modal-section-title">
                    <Stethoscope size={14} />
                    Professional Credentials & Licensing
                  </div>
                  <div className="modal-info-grid">
                    <div className="modal-info-item">
                      <span className="info-label">Specialization</span>
                      <span className="info-value" style={{ color: "#0f766e" }}>
                        {selectedDoctor.specialization || "General Physician"}
                      </span>
                    </div>
                    <div className="modal-info-item">
                      <span className="info-label">Medical Degree / Qualification</span>
                      <span className="info-value">{selectedDoctor.qualification || "MD / MBBS"}</span>
                    </div>
                    <div className="modal-info-item">
                      <span className="info-label">Years of Experience</span>
                      <span className="info-value">{selectedDoctor.experience || "N/A"}</span>
                    </div>
                    <div className="modal-info-item">
                      <span className="info-label">Medical Registration / License No.</span>
                      <code className="info-code" style={{ fontSize: "12px", color: "#0f766e" }}>
                        {selectedDoctor.licenseNumber || "N/A"}
                      </code>
                    </div>
                    <div className="modal-info-item full-width">
                      <span className="info-label">Hospital / Clinic Affiliation</span>
                      <span className="info-value">{selectedDoctor.hospital || "Independent Practice"}</span>
                    </div>
                  </div>

                  {/* Section 3: Document Status Placeholder */}
                  <div className="modal-section-title">
                    <FileCheck size={14} />
                    Document Verification Checklist
                  </div>
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "12px 16px",
                      fontSize: "13px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0f766e" }}>
                      <CheckCircle2 size={16} />
                      <span>State Medical License Number verified in digital registry format</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0f766e" }}>
                      <CheckCircle2 size={16} />
                      <span>Applicant identity & institutional affiliation details recorded</span>
                    </div>
                  </div>

                  {/* Section 4: Application Timeline */}
                  <div className="modal-section-title">
                    <Calendar size={14} />
                    Application Timeline
                  </div>
                  <div className="modal-info-grid">
                    <div className="modal-info-item">
                      <span className="info-label">Submitted On</span>
                      <span className="info-value">{formatDate(selectedDoctor.createdAt)}</span>
                    </div>
                    <div className="modal-info-item">
                      <span className="info-label">Verification Status</span>
                      <span className="info-value text-capitalize">{selectedDoctor.status}</span>
                    </div>
                    {selectedDoctor.rejectionReason && (
                      <div className="modal-info-item full-width">
                        <span className="info-label" style={{ color: "#dc2626" }}>Rejection Reason</span>
                        <p className="modal-bio-text" style={{ color: "#991b1b", background: "#fef2f2" }}>
                          {selectedDoctor.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="modal-action-buttons">
                    {selectedDoctor.status === "pending" && (
                      <>
                        <button
                          className="btn-modal-activate"
                          onClick={() => setApprovingDoctor(selectedDoctor)}
                        >
                          <CheckCircle2 size={16} />
                          <span>Approve Doctor</span>
                        </button>
                        <button
                          className="btn-modal-deactivate"
                          onClick={() => {
                            setRejectingDoctor(selectedDoctor);
                            setRejectionReason("");
                          }}
                        >
                          <XCircle size={16} />
                          <span>Reject Application</span>
                        </button>
                      </>
                    )}
                    <button className="btn-modal-close" onClick={handleCloseDetails}>
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. APPROVE CONFIRMATION DIALOG MODAL
         ========================================================================= */}
      {approvingDoctor && (
        <div className="admin-modal-backdrop" onClick={() => setApprovingDoctor(null)}>
          <div
            className="admin-details-modal"
            style={{ maxWidth: "440px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>Approve Doctor Application?</h3>
                <p>Authorize healthcare provider on HealTalk</p>
              </div>
              <button className="modal-close-btn" onClick={() => setApprovingDoctor(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: "20px 24px" }}>
              <p style={{ fontSize: "14px", color: "#334155", margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to approve <strong>Dr. {approvingDoctor.name}</strong>?
              </p>
              <div
                style={{
                  background: "#f0fdfa",
                  border: "1px solid #ccfbf1",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#0f766e",
                  marginTop: "12px",
                }}
              >
                ✓ Status will become <strong>Approved</strong>
                <br />
                ✓ Doctor will be immediately active for patient consultations
              </div>

              <div className="modal-action-buttons" style={{ marginTop: "16px" }}>
                <button
                  className="btn-modal-close"
                  onClick={() => setApprovingDoctor(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  className="btn-modal-activate"
                  onClick={handleApproveDoctor}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 size={16} className="spin-icon" /> : <CheckCircle2 size={16} />}
                  <span>Approve Doctor</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. REJECT CONFIRMATION DIALOG MODAL WITH REASON
         ========================================================================= */}
      {rejectingDoctor && (
        <div className="admin-modal-backdrop" onClick={() => setRejectingDoctor(null)}>
          <div
            className="admin-details-modal"
            style={{ maxWidth: "480px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>Reject Doctor Application</h3>
                <p>Provide rejection rationale for applicant records</p>
              </div>
              <button className="modal-close-btn" onClick={() => setRejectingDoctor(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: "20px 24px" }}>
              <p style={{ fontSize: "14px", color: "#334155", margin: 0 }}>
                Rejecting application for <strong>Dr. {rejectingDoctor.name}</strong>.
              </p>

              <div style={{ marginTop: "14px" }}>
                <label
                  htmlFor="rejection-reason"
                  style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}
                >
                  Reason for rejection (Optional):
                </label>
                <textarea
                  id="rejection-reason"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. License credentials could not be verified with state medical board."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    fontFamily: "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div className="modal-action-buttons" style={{ marginTop: "16px" }}>
                <button
                  className="btn-modal-close"
                  onClick={() => setRejectingDoctor(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  className="btn-modal-deactivate"
                  onClick={handleRejectDoctor}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 size={16} className="spin-icon" /> : <XCircle size={16} />}
                  <span>Reject Application</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorVerification;
