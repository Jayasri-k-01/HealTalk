import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getAdminDoctors,
  getAdminDoctorDetails,
  updateDoctorStatus,
} from "../../services/adminService";
import {
  Stethoscope,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Eye,
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
  Ban,
  UserCheck,
  Languages,
  DollarSign,
  Star,
  FileText,
} from "lucide-react";

function DoctorsManagement({ onUpdateStats }) {
  const [doctorsList, setDoctorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'approved' (Active) | 'suspended' (Inactive)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // View Details Modal State
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Confirmation Modal State for Activate / Deactivate
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    doctor: null,
    targetStatus: null, // 'suspended' or 'approved'
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch doctors from MongoDB
  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminDoctors({
        limit: 100,
        page: 1,
      });

      const allDoctors = data?.doctors || [];
      // Strictly keep only approved and suspended doctors (pending/rejected belong in Doctor Verification)
      const managedDoctors = allDoctors.filter(
        (doc) => doc.status === "approved" || doc.status === "suspended"
      );

      setDoctorsList(managedDoctors);
    } catch (err) {
      console.error("Failed to load doctors:", err);
      setError("Unable to load doctors list. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Calculate Summary Statistics
  const stats = useMemo(() => {
    const total = doctorsList.length;
    const active = doctorsList.filter((d) => d.status === "approved").length;
    const inactive = doctorsList.filter((d) => d.status === "suspended").length;
    return { total, active, inactive };
  }, [doctorsList]);

  // Extract unique specialties for the filter dropdown
  const uniqueSpecialties = useMemo(() => {
    const set = new Set();
    doctorsList.forEach((d) => {
      const spec = d.specialization || d.specialty;
      if (spec && spec.trim() !== "") {
        set.add(spec.trim());
      }
    });
    // Add common specialties as choices
    ["Cardiology", "Dermatology", "General Medicine", "Neurology", "Pediatrics", "Psychiatry", "Orthopedics"].forEach((s) => set.add(s));
    return Array.from(set).sort();
  }, [doctorsList]);

  // Clean doctor name to avoid duplicate "Dr. Dr."
  const formatDoctorName = (name) => {
    if (!name) return "Doctor";
    let clean = name.trim();
    clean = clean.replace(/^(dr\.?|doctor)\s+/i, "").trim();
    return `Dr. ${clean}`;
  };

  // Initials Helper
  const getAvatarInitials = (name) => {
    if (!name) return "DR";
    let clean = name.trim().replace(/^(dr\.?|doctor)\s+/i, "").trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase() || "DR";
  };

  // Filter and search doctors locally
  const filteredDoctors = useMemo(() => {
    return doctorsList.filter((doc) => {
      // Status filter
      if (statusFilter === "approved" && doc.status !== "approved") return false;
      if (statusFilter === "suspended" && doc.status !== "suspended") return false;

      // Specialty filter
      if (specialtyFilter !== "all") {
        const docSpec = (doc.specialization || doc.specialty || "").toLowerCase();
        if (!docSpec.includes(specialtyFilter.toLowerCase())) return false;
      }

      // Search filter
      if (debouncedSearch.trim() !== "") {
        const query = debouncedSearch.toLowerCase();
        const nameMatch = (doc.name || "").toLowerCase().includes(query);
        const emailMatch = (doc.email || "").toLowerCase().includes(query);
        const specMatch = (doc.specialization || "").toLowerCase().includes(query);
        const hospitalMatch = (doc.hospital || "").toLowerCase().includes(query);
        if (!nameMatch && !emailMatch && !specMatch && !hospitalMatch) return false;
      }

      return true;
    });
  }, [doctorsList, statusFilter, specialtyFilter, debouncedSearch]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / pageSize));
  const paginatedDoctors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDoctors.slice(start, start + pageSize);
  }, [filteredDoctors, currentPage, pageSize]);

  // Open Details Modal - Fetch real MongoDB doctor data
  const handleOpenDetails = async (doctor) => {
    setSelectedDoctor(doctor);
    try {
      setDetailsLoading(true);
      const full = await getAdminDoctorDetails(doctor._id);
      if (full) {
        setSelectedDoctor(full);
      }
    } catch (err) {
      console.error("Failed to fetch full doctor details:", err);
      setFeedback({
        type: "error",
        text: err?.response?.data?.message || "Failed to load doctor details from database.",
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedDoctor(null);
  };

  // Open Confirmation Modal
  const handlePromptStatusChange = (doctor, targetStatus) => {
    setConfirmModal({
      isOpen: true,
      doctor,
      targetStatus,
    });
  };

  const handleCloseConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      doctor: null,
      targetStatus: null,
    });
  };

  // Execute Status Change (Activate / Deactivate) in MongoDB
  const handleExecuteStatusChange = async () => {
    const { doctor, targetStatus } = confirmModal;
    if (!doctor || !targetStatus) return;

    try {
      setActionLoading(true);
      const res = await updateDoctorStatus(doctor._id, targetStatus);

      const actionText = targetStatus === "approved" ? "activated" : "deactivated";
      setFeedback({
        type: "success",
        text: res?.message || `${formatDoctorName(doctor.name)} has been successfully ${actionText}.`,
      });

      // Update local state immediately
      setDoctorsList((prev) =>
        prev.map((d) =>
          d._id === doctor._id
            ? { ...d, status: targetStatus, isVerified: targetStatus === "approved" }
            : d
        )
      );

      if (selectedDoctor && selectedDoctor._id === doctor._id) {
        setSelectedDoctor((prev) => ({
          ...prev,
          status: targetStatus,
          isVerified: targetStatus === "approved",
        }));
      }

      if (onUpdateStats) {
        onUpdateStats();
      }

      handleCloseConfirmModal();
    } catch (err) {
      console.error("Failed to update doctor status:", err);
      setFeedback({
        type: "error",
        text: err?.response?.data?.message || "Failed to update doctor status. Please try again.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Format Date Helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="users-management-view doctors-management-view">
      {/* 1. HEADER */}
      <div className="users-header-card" style={{ marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>
            Doctors
          </h2>
          <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
            Manage approved doctors on the HealTalk platform
          </p>
        </div>
        <div className="users-count-pill" style={{ backgroundColor: "#e0f2fe", color: "#0369a1" }}>
          <Stethoscope size={16} />
          <span>{stats.total} Managed Doctors</span>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedback && (
        <div
          style={{
            padding: "12px 18px",
            backgroundColor: feedback.type === "success" ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${feedback.type === "success" ? "#bbf7d0" : "#fee2e2"}`,
            color: feedback.type === "success" ? "#166534" : "#991b1b",
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
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              padding: "2px",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 2. SUMMARY CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        {/* Total Doctors */}
        <div
          className="admin-stat-card"
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "#e0f2fe",
              color: "#0284c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Stethoscope size={24} />
          </div>
          <div>
            <span style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "#64748b", letterSpacing: "0.5px" }}>
              Total Doctors
            </span>
            <div style={{ fontSize: "26px", fontWeight: "700", color: "#0f172a", lineHeight: "1.2", marginTop: "2px" }}>
              {stats.total}
            </div>
          </div>
        </div>

        {/* Active Doctors */}
        <div
          className="admin-stat-card"
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "#dcfce7",
              color: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <UserCheck size={24} />
          </div>
          <div>
            <span style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "#64748b", letterSpacing: "0.5px" }}>
              Active Doctors
            </span>
            <div style={{ fontSize: "26px", fontWeight: "700", color: "#16a34a", lineHeight: "1.2", marginTop: "2px" }}>
              {stats.active}
            </div>
          </div>
        </div>

        {/* Inactive Doctors */}
        <div
          className="admin-stat-card"
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "#fee2e2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Ban size={24} />
          </div>
          <div>
            <span style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "#64748b", letterSpacing: "0.5px" }}>
              Inactive Doctors
            </span>
            <div style={{ fontSize: "26px", fontWeight: "700", color: "#dc2626", lineHeight: "1.2", marginTop: "2px" }}>
              {stats.inactive}
            </div>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & FILTERS */}
      <div className="users-controls-card" style={{ marginBottom: "20px" }}>
        {/* Search Input */}
        <div className="users-search-box">
          <Search className="search-icon" size={17} />
          <input
            type="text"
            placeholder="Search by doctor name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="search-clear-btn"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="users-filters-group">
          {/* Specialty Filter */}
          <div className="filter-select-wrapper">
            <label htmlFor="specialty-filter">Specialty:</label>
            <select
              id="specialty-filter"
              value={specialtyFilter}
              onChange={(e) => {
                setSpecialtyFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Specialties</option>
              {uniqueSpecialties.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="filter-select-wrapper">
            <label htmlFor="doctor-status-filter">Status:</label>
            <select
              id="doctor-status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="approved">Active</option>
              <option value="suspended">Inactive</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            className="users-refresh-btn"
            onClick={fetchDoctors}
            disabled={loading}
            title="Refresh list"
            aria-label="Refresh doctors"
          >
            <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4. DOCTORS TABLE */}
      <div className="admin-table-card">
        {loading ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <Loader2 size={36} className="spin-icon" style={{ color: "#087f8c", margin: "0 auto 12px" }} />
            <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>Loading doctors database...</p>
          </div>
        ) : error ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <AlertCircle size={36} style={{ color: "#ef4444", margin: "0 auto 12px" }} />
            <p style={{ color: "#ef4444", fontWeight: "600", margin: "0 0 12px 0" }}>{error}</p>
            <button
              onClick={fetchDoctors}
              style={{
                padding: "8px 18px",
                backgroundColor: "#087f8c",
                color: "#ffffff",
                borderRadius: "8px",
                border: "none",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <Stethoscope size={44} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />
            <h4 style={{ margin: "0 0 6px 0", color: "#334155", fontSize: "16px" }}>No doctors found</h4>
            <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 16px 0" }}>
              {searchTerm || specialtyFilter !== "all" || statusFilter !== "all"
                ? "No approved doctors match your current search and filter criteria."
                : "No approved doctors are currently registered on the platform."}
            </p>
            {(searchTerm || specialtyFilter !== "all" || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSpecialtyFilter("all");
                  setStatusFilter("all");
                }}
                style={{
                  padding: "7px 16px",
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  color: "#334155",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Responsive horizontal scroll container */}
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: "240px" }}>Doctor</th>
                    <th style={{ minWidth: "200px" }}>Email</th>
                    <th style={{ minWidth: "140px" }}>Specialty</th>
                    <th style={{ minWidth: "120px" }}>Languages</th>
                    <th style={{ minWidth: "110px" }}>Experience</th>
                    <th style={{ minWidth: "130px" }}>Consultation Fee</th>
                    <th style={{ minWidth: "110px" }}>Status</th>
                    <th style={{ minWidth: "130px" }}>Registration Date</th>
                    <th style={{ minWidth: "200px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDoctors.map((doc) => {
                    const isActive = doc.status === "approved";
                    const specialty = doc.specialization || doc.specialty || "General Medicine";
                    const languages = doc.languages?.length
                      ? doc.languages.join(", ")
                      : doc.language || "English";
                    const experience = doc.experience && String(doc.experience).trim() !== ""
                      ? doc.experience
                      : "Not provided";
                    const fee = doc.consultationFee && String(doc.consultationFee).trim() !== ""
                      ? doc.consultationFee
                      : doc.fee && String(doc.fee).trim() !== ""
                      ? doc.fee
                      : "Not provided";
                    const displayName = formatDoctorName(doc.name);

                    return (
                      <tr key={doc._id}>
                        {/* 1. Doctor Column: Clean single row Avatar | Name */}
                        <td>
                          <div className="doctor-row-cell">
                            <div className="doctor-avatar-circle">
                              {getAvatarInitials(doc.name)}
                            </div>
                            <div className="doctor-name-col">
                              <div className="doctor-full-name">
                                <span>{displayName}</span>
                                {doc.isVerified && (
                                  <ShieldCheck size={14} style={{ color: "#087f8c", flexShrink: 0 }} title="Verified Doctor" />
                                )}
                              </div>
                              <div className="doctor-sub-info">
                                {doc.hospital || doc.licenseNumber ? (
                                  <>
                                    {doc.hospital && <span>{doc.hospital}</span>}
                                    {doc.hospital && doc.licenseNumber && <span> • </span>}
                                    {doc.licenseNumber && <span>Lic: {doc.licenseNumber}</span>}
                                  </>
                                ) : (
                                  <span>HealTalk Specialist</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Email */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#475569" }}>
                            <Mail size={14} style={{ color: "#94a3b8", flexShrink: 0 }} />
                            <span>{doc.email}</span>
                          </div>
                        </td>

                        {/* 3. Specialty */}
                        <td>
                          <span className="specialty-badge-pill">
                            {specialty}
                          </span>
                        </td>

                        {/* 4. Languages */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#334155" }}>
                            <Languages size={14} style={{ color: "#64748b", flexShrink: 0 }} />
                            <span>{languages}</span>
                          </div>
                        </td>

                        {/* 5. Experience */}
                        <td>
                          <span style={{ color: "#334155", fontWeight: "500" }}>
                            {experience}
                          </span>
                        </td>

                        {/* 6. Consultation Fee */}
                        <td>
                          <span className="consultation-fee-pill">
                            {fee}
                          </span>
                        </td>

                        {/* 7. Status */}
                        <td>
                          {isActive ? (
                            <span className="user-status-badge approved" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
                              <span className="status-dot green" />
                              Active
                            </span>
                          ) : (
                            <span className="user-status-badge suspended" style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>
                              <span className="status-dot red" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* 8. Registration Date */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#64748b" }}>
                            <Calendar size={13} style={{ flexShrink: 0 }} />
                            <span>{formatDate(doc.createdAt)}</span>
                          </div>
                        </td>

                        {/* 9. Actions */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                            {/* View Details */}
                            <button
                              className="btn-table-action-view"
                              onClick={() => handleOpenDetails(doc)}
                              title="View doctor details"
                            >
                              <Eye size={13} />
                              <span>View Details</span>
                            </button>

                            {/* Deactivate / Activate Button */}
                            {isActive ? (
                              <button
                                className="btn-table-action-deactivate"
                                onClick={() => handlePromptStatusChange(doc, "suspended")}
                                title="Deactivate doctor account"
                              >
                                <Ban size={13} />
                                <span>Deactivate</span>
                              </button>
                            ) : (
                              <button
                                className="btn-table-action-activate"
                                onClick={() => handlePromptStatusChange(doc, "approved")}
                                title="Activate doctor account"
                              >
                                <UserCheck size={13} />
                                <span>Activate</span>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderTop: "1px solid #f1f5f9",
                  background: "#ffffff",
                }}
              >
                <div style={{ fontSize: "13px", color: "#64748b" }}>
                  Showing <strong style={{ color: "#0f172a" }}>{(currentPage - 1) * pageSize + 1}</strong> to{" "}
                  <strong style={{ color: "#0f172a" }}>
                    {Math.min(currentPage * pageSize, filteredDoctors.length)}
                  </strong>{" "}
                  of <strong style={{ color: "#0f172a" }}>{filteredDoctors.length}</strong> doctors
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: currentPage === 1 ? "#f8fafc" : "#ffffff",
                      color: currentPage === 1 ? "#94a3b8" : "#334155",
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "13px",
                    }}
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>

                  <span style={{ fontSize: "13px", color: "#475569", padding: "0 4px" }}>
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: currentPage === totalPages ? "#f8fafc" : "#ffffff",
                      color: currentPage === totalPages ? "#94a3b8" : "#334155",
                      cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "13px",
                    }}
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 5. VIEW DETAILS MODAL */}
      {selectedDoctor && (
        <div className="doctor-modal-overlay" onClick={handleCloseDetails}>
          <div className="doctor-modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="doctor-modal-header">
              <div className="doctor-modal-header-left">
                <div className="doctor-modal-avatar">
                  {getAvatarInitials(selectedDoctor.name)}
                </div>
                <div className="doctor-modal-titles">
                  <h3>
                    <span>{formatDoctorName(selectedDoctor.name)}</span>
                    {selectedDoctor.isVerified && (
                      <ShieldCheck size={16} style={{ color: "#087f8c" }} title="Verified Doctor" />
                    )}
                    <span
                      style={{
                        padding: "2px 8px",
                        backgroundColor: selectedDoctor.status === "approved" ? "#dcfce7" : "#fee2e2",
                        color: selectedDoctor.status === "approved" ? "#166534" : "#991b1b",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        marginLeft: "4px",
                      }}
                    >
                      {selectedDoctor.status === "approved" ? "Active" : "Inactive"}
                    </span>
                  </h3>
                  <p>
                    {selectedDoctor.specialization || selectedDoctor.specialty || selectedDoctor.doctorProfile?.specialty || "General Medicine Specialist"} • Complete profile and professional information
                  </p>
                </div>
              </div>
              <button className="doctor-modal-close-btn" onClick={handleCloseDetails} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="doctor-modal-body">
              {detailsLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#087f8c", fontSize: "13px", padding: "8px 0" }}>
                  <Loader2 size={16} className="spin-icon" />
                  <span>Loading full doctor credentials...</span>
                </div>
              )}

              {/* 1. Profile & Contact Information */}
              <div className="doctor-modal-section">
                <h4 className="doctor-modal-section-title">
                  <Mail size={14} style={{ color: "#087f8c" }} />
                  <span>Profile & Contact Information</span>
                </h4>
                <div className="doctor-modal-grid-2">
                  <div className="doctor-modal-card">
                    <span className="doctor-modal-label">Full Name</span>
                    <strong className="doctor-modal-value">{formatDoctorName(selectedDoctor.name)}</strong>
                  </div>
                  <div className="doctor-modal-card">
                    <span className="doctor-modal-label">Email Address</span>
                    <strong className="doctor-modal-value">{selectedDoctor.email || "Not provided"}</strong>
                  </div>
                  <div className="doctor-modal-card">
                    <span className="doctor-modal-label">Phone Number</span>
                    <strong className={`doctor-modal-value ${!selectedDoctor.phone ? "muted" : ""}`}>
                      {selectedDoctor.phone || "Not provided"}
                    </strong>
                  </div>
                  <div className="doctor-modal-card">
                    <span className="doctor-modal-label">Registration Date</span>
                    <strong className="doctor-modal-value">{formatDate(selectedDoctor.createdAt)}</strong>
                  </div>
                </div>
              </div>

              {/* 2. Professional Information */}
              <div className="doctor-modal-section">
                <h4 className="doctor-modal-section-title">
                  <GraduationCap size={14} style={{ color: "#087f8c" }} />
                  <span>Professional Information</span>
                </h4>
                <div className="doctor-modal-grid-3">
                  <div className="doctor-modal-card">
                    <span className="doctor-modal-label">Specialty</span>
                    <strong className="doctor-modal-value highlight-cyan">
                      {selectedDoctor.specialization || selectedDoctor.specialty || selectedDoctor.doctorProfile?.specialty || "Not provided"}
                    </strong>
                  </div>
                  <div className="doctor-modal-card">
                    <span className="doctor-modal-label">Qualification</span>
                    <strong className={`doctor-modal-value ${!selectedDoctor.qualification ? "muted" : ""}`}>
                      {selectedDoctor.qualification || "Not provided"}
                    </strong>
                  </div>
                  <div className="doctor-modal-card">
                    <span className="doctor-modal-label">Experience</span>
                    <strong className={`doctor-modal-value ${(!selectedDoctor.experience && !selectedDoctor.doctorProfile?.experience) ? "muted" : ""}`}>
                      {selectedDoctor.experience || selectedDoctor.doctorProfile?.experience || "Not provided"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 3. Consultation Fee */}
              <div className="doctor-modal-section">
                <h4 className="doctor-modal-section-title">
                  <DollarSign size={14} style={{ color: "#087f8c" }} />
                  <span>Consultation Fee</span>
                </h4>
                <div className="doctor-modal-card">
                  <span className="doctor-modal-label">Doctor's Consultation Fee</span>
                  <div>
                    {((selectedDoctor.consultationFee && String(selectedDoctor.consultationFee).trim() !== "") ||
                      (selectedDoctor.fee && String(selectedDoctor.fee).trim() !== "") ||
                      (selectedDoctor.doctorProfile?.fee && String(selectedDoctor.doctorProfile.fee).trim() !== "")) ? (
                      <span className="consultation-fee-pill" style={{ fontSize: "14px", padding: "6px 14px", marginTop: "2px" }}>
                        {selectedDoctor.consultationFee || selectedDoctor.fee || selectedDoctor.doctorProfile?.fee}
                      </span>
                    ) : (
                      <span className="doctor-modal-value muted">Not provided</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Hospital & License Information */}
              <div className="doctor-modal-section">
                <h4 className="doctor-modal-section-title">
                  <Building size={14} style={{ color: "#087f8c" }} />
                  <span>Hospital / License Information</span>
                </h4>
                <div className="doctor-modal-grid-2">
                  <div className="doctor-modal-card">
                    <span className="doctor-modal-label">Hospital Affiliation</span>
                    <strong className={`doctor-modal-value ${(!selectedDoctor.hospital && !selectedDoctor.doctorProfile?.hospital) ? "muted" : ""}`}>
                      {selectedDoctor.hospital || selectedDoctor.doctorProfile?.hospital || "Not provided"}
                    </strong>
                  </div>
                  <div className="doctor-modal-card">
                    <span className="doctor-modal-label">License / Registration</span>
                    <strong className={`doctor-modal-value ${(!selectedDoctor.licenseNumber && !selectedDoctor.doctorProfile?.licenseNumber) ? "muted" : ""}`}>
                      {selectedDoctor.licenseNumber || selectedDoctor.doctorProfile?.licenseNumber || "Not provided"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 5. Professional Bio */}
              <div className="doctor-modal-section">
                <h4 className="doctor-modal-section-title">
                  <FileText size={14} style={{ color: "#087f8c" }} />
                  <span>Professional Bio</span>
                </h4>
                <p className={`doctor-modal-bio-box ${(!selectedDoctor.bio && !selectedDoctor.doctorProfile?.bio) ? "muted" : ""}`}>
                  {selectedDoctor.bio || selectedDoctor.doctorProfile?.bio || "Not provided"}
                </p>
              </div>

              {/* 6. Languages */}
              <div className="doctor-modal-section">
                <h4 className="doctor-modal-section-title">
                  <Languages size={14} style={{ color: "#087f8c" }} />
                  <span>Languages</span>
                </h4>
                <div className="doctor-modal-chips-row">
                  {selectedDoctor.doctorProfile?.languages?.length ? (
                    selectedDoctor.doctorProfile.languages.map((lang) => (
                      <span key={lang} className="doctor-modal-chip">
                        {lang}
                      </span>
                    ))
                  ) : selectedDoctor.languages?.length ? (
                    selectedDoctor.languages.map((lang) => (
                      <span key={lang} className="doctor-modal-chip">
                        {lang}
                      </span>
                    ))
                  ) : (
                    <span className="doctor-modal-value muted">
                      {selectedDoctor.language || "Not provided"}
                    </span>
                  )}
                </div>
              </div>

              {/* 7. Availability */}
              <div className="doctor-modal-section">
                <h4 className="doctor-modal-section-title">
                  <Clock size={14} style={{ color: "#087f8c" }} />
                  <span>Availability</span>
                </h4>
                {((selectedDoctor.availableSlots && selectedDoctor.availableSlots.length > 0) || (selectedDoctor.doctorProfile?.availableSlots && selectedDoctor.doctorProfile.availableSlots.length > 0)) ? (
                  <div className="doctor-modal-chips-row">
                    {(selectedDoctor.availableSlots || selectedDoctor.doctorProfile.availableSlots).map((slot, idx) => (
                      <span key={idx} className="doctor-modal-chip green">
                        <Clock size={12} />
                        <span>{slot}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="doctor-modal-value muted" style={{ margin: 0 }}>Not provided</p>
                )}
              </div>

              {/* 8. Account Status */}
              <div className="doctor-modal-section">
                <h4 className="doctor-modal-section-title">
                  <ShieldCheck size={14} style={{ color: "#087f8c" }} />
                  <span>Account Status</span>
                </h4>
                <div className={`doctor-modal-status-banner ${selectedDoctor.status === "approved" ? "approved" : "suspended"}`}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {selectedDoctor.status === "approved" ? (
                      <CheckCircle2 size={22} style={{ color: "#16a34a", flexShrink: 0 }} />
                    ) : (
                      <Ban size={22} style={{ color: "#dc2626", flexShrink: 0 }} />
                    )}
                    <div>
                      <strong style={{ display: "block", fontSize: "13px", color: selectedDoctor.status === "approved" ? "#166534" : "#991b1b" }}>
                        {selectedDoctor.status === "approved"
                          ? "Active Provider Account"
                          : "Deactivated / Suspended Provider Account"}
                      </strong>
                      <span style={{ fontSize: "12px", color: selectedDoctor.status === "approved" ? "#15803d" : "#b91c1c" }}>
                        {selectedDoctor.status === "approved"
                          ? "Doctor is currently accepting patient appointments and consultations."
                          : "Doctor is temporarily suspended and cannot receive patient consultations."}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="doctor-modal-footer">
              <button className="doctor-modal-btn-close" onClick={handleCloseDetails}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. CONFIRMATION MODAL FOR DEACTIVATE / ACTIVATE */}
      {confirmModal.isOpen && confirmModal.doctor && (
        <div className="doctor-confirm-overlay" onClick={handleCloseConfirmModal}>
          <div className="doctor-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className={`doctor-confirm-icon-circle ${confirmModal.targetStatus === "suspended" ? "deactivate" : "activate"}`}>
              {confirmModal.targetStatus === "suspended" ? <Ban size={28} /> : <CheckCircle2 size={28} />}
            </div>
            <h3 className="doctor-confirm-title">
              {confirmModal.targetStatus === "suspended" ? "Deactivate Doctor?" : "Activate Doctor?"}
            </h3>
            <p className="doctor-confirm-message">
              {confirmModal.targetStatus === "suspended" ? (
                <>
                  Are you sure you want to deactivate <strong>{formatDoctorName(confirmModal.doctor.name)}</strong>?
                </>
              ) : (
                <>
                  Are you sure you want to activate <strong>{formatDoctorName(confirmModal.doctor.name)}</strong>?
                </>
              )}
            </p>

            <div className="doctor-confirm-actions">
              <button
                className="doctor-confirm-btn-cancel"
                onClick={handleCloseConfirmModal}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className={`doctor-confirm-btn-confirm ${confirmModal.targetStatus === "suspended" ? "deactivate" : "activate"}`}
                onClick={handleExecuteStatusChange}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 size={15} className="spin-icon" />
                    <span>Processing...</span>
                  </>
                ) : confirmModal.targetStatus === "suspended" ? (
                  <span>Deactivate</span>
                ) : (
                  <span>Activate</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorsManagement;
