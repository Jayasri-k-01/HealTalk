import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getAdminInterpreters,
  getAdminInterpreterDetails,
  updateInterpreterStatus,
} from "../../services/adminService";
import {
  Globe,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Eye,
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
  GraduationCap,
  Briefcase,
  Shield,
} from "lucide-react";

function InterpretersManagement({ onUpdateStats }) {
  const [interpretersList, setInterpretersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'approved' (Active) | 'suspended' (Inactive)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // View Details Modal State
  const [selectedInterpreter, setSelectedInterpreter] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Confirmation Modal State for Activate / Deactivate
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    interpreter: null,
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

  // Fetch interpreters from MongoDB
  const fetchInterpreters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminInterpreters({
        limit: 100,
        page: 1,
      });

      const allInterpreters = data?.interpreters || [];
      // Keep approved and suspended interpreters for the main Interpreters management page
      const managedInterpreters = allInterpreters.filter(
        (interp) => interp.status === "approved" || interp.status === "suspended"
      );

      setInterpretersList(managedInterpreters);
    } catch (err) {
      console.error("Failed to load interpreters:", err);
      setError("Unable to load interpreters list. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterpreters();
  }, [fetchInterpreters]);

  // Calculate Summary Statistics
  const stats = useMemo(() => {
    const total = interpretersList.length;
    const active = interpretersList.filter((d) => d.status === "approved").length;
    const inactive = interpretersList.filter((d) => d.status === "suspended").length;
    return { total, active, inactive };
  }, [interpretersList]);

  // Extract unique languages for filter dropdown
  const uniqueLanguages = useMemo(() => {
    const set = new Set();
    interpretersList.forEach((item) => {
      if (item.languages && Array.isArray(item.languages)) {
        item.languages.forEach((l) => l && set.add(l.trim()));
      } else if (item.language && item.language.trim() !== "") {
        set.add(item.language.trim());
      }
    });
    // Add common fallback options
    ["Spanish", "French", "Mandarin", "Arabic", "Russian", "German", "Hindi", "Japanese", "Portuguese"].forEach((l) => set.add(l));
    return Array.from(set).sort();
  }, [interpretersList]);

  // Initials Helper
  const getAvatarInitials = (name) => {
    if (!name) return "IN";
    const clean = name.trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase() || "IN";
  };

  // Filter and search interpreters locally
  const filteredInterpreters = useMemo(() => {
    return interpretersList.filter((item) => {
      // Status filter
      if (statusFilter === "approved" && item.status !== "approved") return false;
      if (statusFilter === "suspended" && item.status !== "suspended") return false;

      // Language filter
      if (languageFilter !== "all") {
        const langStr = Array.isArray(item.languages)
          ? item.languages.join(" ").toLowerCase()
          : (item.language || "").toLowerCase();
        if (!langStr.includes(languageFilter.toLowerCase())) return false;
      }

      // Search filter
      if (debouncedSearch.trim() !== "") {
        const query = debouncedSearch.toLowerCase();
        const nameMatch = (item.name || "").toLowerCase().includes(query);
        const emailMatch = (item.email || "").toLowerCase().includes(query);
        const langMatch = (item.language || "").toLowerCase().includes(query);
        const certMatch = (item.qualification || item.specialization || "").toLowerCase().includes(query);
        if (!nameMatch && !emailMatch && !langMatch && !certMatch) return false;
      }

      return true;
    });
  }, [interpretersList, statusFilter, languageFilter, debouncedSearch]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredInterpreters.length / pageSize));
  const paginatedInterpreters = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInterpreters.slice(start, start + pageSize);
  }, [filteredInterpreters, currentPage, pageSize]);

  // Open Details Modal - Fetch real MongoDB interpreter data
  const handleOpenDetails = async (interpreter) => {
    setSelectedInterpreter(interpreter);
    try {
      setDetailsLoading(true);
      const full = await getAdminInterpreterDetails(interpreter._id);
      if (full) {
        setSelectedInterpreter(full);
      }
    } catch (err) {
      console.error("Failed to fetch full interpreter details:", err);
      setFeedback({
        type: "error",
        text: err?.response?.data?.message || "Failed to load interpreter details from database.",
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedInterpreter(null);
  };

  // Open Confirmation Modal
  const handlePromptStatusChange = (interpreter, targetStatus) => {
    setConfirmModal({
      isOpen: true,
      interpreter,
      targetStatus,
    });
  };

  const handleCloseConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      interpreter: null,
      targetStatus: null,
    });
  };

  // Execute Status Change (Activate / Deactivate) in MongoDB
  const handleExecuteStatusChange = async () => {
    const { interpreter, targetStatus } = confirmModal;
    if (!interpreter || !targetStatus) return;

    try {
      setActionLoading(true);
      const res = await updateInterpreterStatus(interpreter._id, targetStatus);

      const actionText = targetStatus === "approved" ? "activated" : "deactivated";
      setFeedback({
        type: "success",
        text: res?.message || `${interpreter.name} has been successfully ${actionText}.`,
      });

      // Update local state immediately
      setInterpretersList((prev) =>
        prev.map((i) =>
          i._id === interpreter._id
            ? { ...i, status: targetStatus, isVerified: targetStatus === "approved" }
            : i
        )
      );

      if (selectedInterpreter && selectedInterpreter._id === interpreter._id) {
        setSelectedInterpreter((prev) => ({
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
      console.error("Failed to update interpreter status:", err);
      setFeedback({
        type: "error",
        text: err?.response?.data?.message || "Failed to update interpreter status. Please try again.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Format Date Helper
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

  return (
    <div className="users-management-view interpreters-management-view">
      {/* 1. HEADER */}
      <div className="users-header-card" style={{ marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>
            Interpreters
          </h2>
          <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
            Manage approved medical language interpreters on the HealTalk platform
          </p>
        </div>
        <div className="users-count-pill" style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}>
          <Globe size={16} />
          <span>{stats.total} Managed Interpreters</span>
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
        {/* Total Interpreters */}
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
              backgroundColor: "#f3e8ff",
              color: "#7c3aed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Globe size={24} />
          </div>
          <div>
            <span style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "#64748b", letterSpacing: "0.5px" }}>
              Total Interpreters
            </span>
            <div style={{ fontSize: "26px", fontWeight: "700", color: "#0f172a", lineHeight: "1.2", marginTop: "2px" }}>
              {stats.total}
            </div>
          </div>
        </div>

        {/* Active Interpreters */}
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
              Active Interpreters
            </span>
            <div style={{ fontSize: "26px", fontWeight: "700", color: "#16a34a", lineHeight: "1.2", marginTop: "2px" }}>
              {stats.active}
            </div>
          </div>
        </div>

        {/* Inactive Interpreters */}
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
              Inactive Interpreters
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
            placeholder="Search by interpreter name or email..."
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
          {/* Language Filter */}
          <div className="filter-select-wrapper">
            <label htmlFor="language-filter">Language:</label>
            <select
              id="language-filter"
              value={languageFilter}
              onChange={(e) => {
                setLanguageFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Languages</option>
              {uniqueLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="filter-select-wrapper">
            <label htmlFor="interpreter-status-filter">Status:</label>
            <select
              id="interpreter-status-filter"
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
            onClick={fetchInterpreters}
            disabled={loading}
            title="Refresh list"
            aria-label="Refresh interpreters"
          >
            <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4. INTERPRETERS TABLE */}
      <div className="admin-table-card">
        {loading ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <Loader2 size={36} className="spin-icon" style={{ color: "#7c3aed", margin: "0 auto 12px" }} />
            <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>Loading interpreters database...</p>
          </div>
        ) : error ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <AlertCircle size={36} style={{ color: "#ef4444", margin: "0 auto 12px" }} />
            <p style={{ color: "#ef4444", fontWeight: "600", margin: "0 0 12px 0" }}>{error}</p>
            <button
              onClick={fetchInterpreters}
              style={{
                padding: "8px 18px",
                backgroundColor: "#7c3aed",
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
        ) : filteredInterpreters.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <Globe size={44} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />
            <h4 style={{ margin: "0 0 6px 0", color: "#334155", fontSize: "16px" }}>No interpreters found</h4>
            <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 16px 0" }}>
              {searchTerm || languageFilter !== "all" || statusFilter !== "all"
                ? "No approved interpreters match your current search and filter criteria."
                : "No approved interpreters are currently registered on the platform."}
            </p>
            {(searchTerm || languageFilter !== "all" || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setLanguageFilter("all");
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
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: "220px" }}>Interpreter</th>
                    <th style={{ minWidth: "200px" }}>Email</th>
                    <th style={{ minWidth: "160px" }}>Languages</th>
                    <th style={{ minWidth: "120px" }}>Experience</th>
                    <th style={{ minWidth: "160px" }}>Qualification / Certification</th>
                    <th style={{ minWidth: "110px" }}>Status</th>
                    <th style={{ minWidth: "130px" }}>Registration Date</th>
                    <th style={{ minWidth: "200px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInterpreters.map((item) => {
                    const isActive = item.status === "approved";
                    const languages = item.languages?.length
                      ? item.languages.join(", ")
                      : item.language || "Not provided";
                    const experience = item.experience && String(item.experience).trim() !== ""
                      ? item.experience
                      : "Not provided";
                    const qualification = item.qualification || item.specialization || "Not provided";

                    return (
                      <tr key={item._id}>
                        {/* 1. Interpreter Column: Avatar | Name */}
                        <td>
                          <div className="doctor-row-cell">
                            <div
                              className="doctor-avatar-circle"
                              style={{
                                background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                                color: "#ffffff",
                              }}
                            >
                              {getAvatarInitials(item.name)}
                            </div>
                            <div className="doctor-name-col">
                              <div className="doctor-full-name">
                                <span>{item.name}</span>
                                {item.isVerified && (
                                  <ShieldCheck size={14} style={{ color: "#7c3aed", flexShrink: 0 }} title="Verified Interpreter" />
                                )}
                              </div>
                              <div className="doctor-sub-info">
                                <span>{item.language || "Certified Interpreter"}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Email */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#475569" }}>
                            <Mail size={14} style={{ color: "#94a3b8", flexShrink: 0 }} />
                            <span>{item.email}</span>
                          </div>
                        </td>

                        {/* 3. Languages */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#334155" }}>
                            <Languages size={14} style={{ color: "#7c3aed", flexShrink: 0 }} />
                            <span className="specialty-badge-pill" style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}>
                              {languages}
                            </span>
                          </div>
                        </td>

                        {/* 4. Experience */}
                        <td>
                          <span style={{ color: "#334155", fontWeight: "500" }}>
                            {experience}
                          </span>
                        </td>

                        {/* 5. Qualification / Certification */}
                        <td>
                          <span style={{ color: "#334155", fontWeight: "500" }}>
                            {qualification}
                          </span>
                        </td>

                        {/* 6. Status */}
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

                        {/* 7. Registration Date */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#64748b" }}>
                            <Calendar size={13} style={{ flexShrink: 0 }} />
                            <span>{formatDate(item.createdAt)}</span>
                          </div>
                        </td>

                        {/* 8. Actions */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                            {/* View Details */}
                            <button
                              className="btn-table-action-view"
                              onClick={() => handleOpenDetails(item)}
                              title="View interpreter details"
                            >
                              <Eye size={13} />
                              <span>View Details</span>
                            </button>

                            {/* Deactivate / Activate Button */}
                            {isActive ? (
                              <button
                                className="btn-table-action-deactivate"
                                onClick={() => handlePromptStatusChange(item, "suspended")}
                                title="Deactivate interpreter account"
                              >
                                <Ban size={13} />
                                <span>Deactivate</span>
                              </button>
                            ) : (
                              <button
                                className="btn-table-action-activate"
                                onClick={() => handlePromptStatusChange(item, "approved")}
                                title="Activate interpreter account"
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
                    {Math.min(currentPage * pageSize, filteredInterpreters.length)}
                  </strong>{" "}
                  of <strong style={{ color: "#0f172a" }}>{filteredInterpreters.length}</strong> interpreters
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
      {selectedInterpreter && (
        <div className="doctor-modal-overlay" onClick={handleCloseDetails}>
          <div className="doctor-modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
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
                        backgroundColor: selectedInterpreter.status === "approved" ? "#dcfce7" : "#fee2e2",
                        color: selectedInterpreter.status === "approved" ? "#166534" : "#991b1b",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        marginLeft: "4px",
                      }}
                    >
                      {selectedInterpreter.status === "approved" ? "Active" : "Inactive"}
                    </span>
                  </h3>
                  <p>
                    {selectedInterpreter.language || "Language Interpreter"} • Complete profile and professional information
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
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#7c3aed", fontSize: "13px", padding: "8px 0" }}>
                  <Loader2 size={16} className="spin-icon" />
                  <span>Loading full interpreter credentials...</span>
                </div>
              )}

              {/* 1. Profile & Contact Information */}
              <div className="doctor-modal-section">
                <h4 className="doctor-modal-section-title">
                  <Mail size={14} style={{ color: "#7c3aed" }} />
                  <span>Profile & Contact Information</span>
                </h4>
                <div className="doctor-modal-grid-2">
                  <div className="doctor-modal-card">
                    <span className="doctor-modal-label">Name</span>
                    <strong className="doctor-modal-value">{selectedInterpreter.name || "Not provided"}</strong>
                  </div>
                  <div className="doctor-modal-card">
                    <span className="doctor-modal-label">Email</span>
                    <strong className="doctor-modal-value">{selectedInterpreter.email || "Not provided"}</strong>
                  </div>
                  <div className="doctor-modal-card">
                    <span className="doctor-modal-label">Phone</span>
                    <strong className={`doctor-modal-value ${!selectedInterpreter.phone ? "muted" : ""}`}>
                      {selectedInterpreter.phone || "Not provided"}
                    </strong>
                  </div>
                  <div className="doctor-modal-card">
                    <span className="doctor-modal-label">Registration Date</span>
                    <strong className="doctor-modal-value">{formatDate(selectedInterpreter.createdAt)}</strong>
                  </div>
                </div>
              </div>

              {/* 2. Professional Credentials & Skills */}
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

              {/* 3. Account Status */}
              <div className="doctor-modal-section">
                <h4 className="doctor-modal-section-title">
                  <ShieldCheck size={14} style={{ color: "#7c3aed" }} />
                  <span>Status</span>
                </h4>
                <div className={`doctor-modal-status-banner ${selectedInterpreter.status === "approved" ? "approved" : "suspended"}`}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {selectedInterpreter.status === "approved" ? (
                      <CheckCircle2 size={22} style={{ color: "#16a34a", flexShrink: 0 }} />
                    ) : (
                      <Ban size={22} style={{ color: "#dc2626", flexShrink: 0 }} />
                    )}
                    <div>
                      <strong style={{ display: "block", fontSize: "13px", color: selectedInterpreter.status === "approved" ? "#166534" : "#991b1b" }}>
                        {selectedInterpreter.status === "approved"
                          ? "Active Interpreter Account"
                          : "Deactivated / Suspended Interpreter Account"}
                      </strong>
                      <span style={{ fontSize: "12px", color: selectedInterpreter.status === "approved" ? "#15803d" : "#b91c1c" }}>
                        {selectedInterpreter.status === "approved"
                          ? "Interpreter is currently active and available for telehealth translation sessions."
                          : "Interpreter is temporarily suspended and cannot join translation sessions."}
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
      {confirmModal.isOpen && confirmModal.interpreter && (
        <div className="doctor-confirm-overlay" onClick={handleCloseConfirmModal}>
          <div className="doctor-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className={`doctor-confirm-icon-circle ${confirmModal.targetStatus === "suspended" ? "deactivate" : "activate"}`}>
              {confirmModal.targetStatus === "suspended" ? <Ban size={28} /> : <CheckCircle2 size={28} />}
            </div>
            <h3 className="doctor-confirm-title">
              {confirmModal.targetStatus === "suspended" ? "Deactivate Interpreter?" : "Activate Interpreter?"}
            </h3>
            <p className="doctor-confirm-message">
              {confirmModal.targetStatus === "suspended" ? (
                <>
                  Are you sure you want to deactivate <strong>{confirmModal.interpreter.name}</strong>?
                </>
              ) : (
                <>
                  Are you sure you want to activate <strong>{confirmModal.interpreter.name}</strong>?
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

export default InterpretersManagement;
