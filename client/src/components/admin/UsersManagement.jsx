import { useState, useEffect, useCallback } from "react";
import {
  getAdminUsers,
  getUserDetails,
  updateUserStatus,
} from "../../services/adminService";
import {
  Search,
  Filter,
  Users,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Stethoscope,
  Globe,
  User as UserIcon,
  X,
  Mail,
  Calendar,
  Languages,
  Award,
  DollarSign,
  Star,
  Ban,
  UserCheck,
} from "lucide-react";

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters and Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const pageSize = 10;

  // Selected User Modal State
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch users from MongoDB
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminUsers({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch,
        role: selectedRole,
        status: selectedStatus,
      });

      setUsers(data?.users || []);
      setTotalPages(data?.totalPages || 1);
      setTotalUsers(data?.totalUsers || 0);
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Unable to load users.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedRole, selectedStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle View Details Modal
  const handleOpenDetails = async (user) => {
    setSelectedUserId(user._id);
    setUserDetails(user); // preliminary data
    setStatusMessage(null);
    try {
      setDetailsLoading(true);
      const fullDetails = await getUserDetails(user._id);
      setUserDetails(fullDetails);
    } catch (err) {
      console.error("Failed to fetch full user details:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedUserId(null);
    setUserDetails(null);
    setStatusMessage(null);
  };

  // Handle Status Toggle (Activate / Deactivate)
  const handleToggleStatus = async (user, targetStatus) => {
    try {
      setActionLoading(true);
      setStatusMessage(null);
      await updateUserStatus(user._id, targetStatus);
      setStatusMessage({
        type: "success",
        text: `Account status updated to "${targetStatus}".`,
      });

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, status: targetStatus } : u))
      );
      if (userDetails && userDetails._id === user._id) {
        setUserDetails((prev) => ({ ...prev, status: targetStatus }));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      setStatusMessage({
        type: "error",
        text: err?.response?.data?.message || "Failed to update account status.",
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

  // Role Badge Styling
  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case "patient":
        return <span className="user-role-badge patient">Patient</span>;
      case "doctor":
        return <span className="user-role-badge doctor">Doctor</span>;
      case "interpreter":
        return <span className="user-role-badge interpreter">Interpreter</span>;
      case "admin":
        return <span className="user-role-badge admin">Admin</span>;
      default:
        return <span className="user-role-badge">{role || "User"}</span>;
    }
  };

  // Status Badge Styling
  const getStatusBadge = (status) => {
    const s = (status || "approved").toLowerCase();
    switch (s) {
      case "approved":
      case "active":
        return (
          <span className="user-status-badge approved">
            <span className="status-dot green" />
            Approved
          </span>
        );
      case "pending":
        return (
          <span className="user-status-badge pending">
            <span className="status-dot amber" />
            Pending
          </span>
        );
      case "rejected":
        return (
          <span className="user-status-badge rejected">
            <span className="status-dot red" />
            Rejected
          </span>
        );
      case "suspended":
      case "inactive":
        return (
          <span className="user-status-badge suspended">
            <span className="status-dot gray" />
            Suspended
          </span>
        );
      default:
        return (
          <span className="user-status-badge">
            <span className="status-dot" />
            {status}
          </span>
        );
    }
  };

  // Avatar Initials Helper
  const getAvatarInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="users-management-view">
      {/* Top Banner Header */}
      <div className="users-header-card">
        <div>
          <h2>Users Directory</h2>
          <p>Manage patients, doctors, and interpreters on the HealTalk platform.</p>
        </div>
        <div className="users-count-pill">
          <Users size={16} />
          <span>{totalUsers} Registered Users</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="users-controls-card">
        <div className="users-search-box">
          <Search className="search-icon" size={17} />
          <input
            type="text"
            placeholder="Search by name or email..."
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
          {/* Role Filter */}
          <div className="filter-select-wrapper">
            <label htmlFor="role-filter">Role:</label>
            <select
              id="role-filter"
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Roles</option>
              <option value="patient">Patients</option>
              <option value="doctor">Doctors</option>
              <option value="interpreter">Interpreters</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="filter-select-wrapper">
            <label htmlFor="status-filter">Status:</label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            className="users-refresh-btn"
            onClick={fetchUsers}
            title="Refresh Users List"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "spin-icon" : ""} />
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="users-alert error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={fetchUsers} className="alert-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Users Table Card */}
      <div className="users-table-card">
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Registration Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                /* Loading Skeleton Rows */
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="skeleton-row">
                    <td>
                      <div className="skeleton-user-cell">
                        <div className="skeleton-avatar" />
                        <div className="skeleton-line w-120" />
                      </div>
                    </td>
                    <td><div className="skeleton-line w-160" /></td>
                    <td><div className="skeleton-line w-70" /></td>
                    <td><div className="skeleton-line w-80" /></td>
                    <td><div className="skeleton-line w-90" /></td>
                    <td style={{ textAlign: "right" }}><div className="skeleton-line w-100 ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                /* Empty State */
                <tr>
                  <td colSpan={6} className="users-empty-cell">
                    <div className="users-empty-state">
                      <div className="empty-icon-circle">
                        <Users size={32} />
                      </div>
                      <h3>No users found</h3>
                      <p>Try changing your search keywords or adjusting your role and status filters.</p>
                      {(searchTerm || selectedRole !== "all" || selectedStatus !== "all") && (
                        <button
                          className="clear-all-filters-btn"
                          onClick={() => {
                            setSearchTerm("");
                            setSelectedRole("all");
                            setSelectedStatus("all");
                            setCurrentPage(1);
                          }}
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                /* Data Rows */
                users.map((u) => {
                  const initials = getAvatarInitials(u.name);
                  const isApproved = (u.status || "approved") === "approved";
                  const isSuspended = u.status === "suspended";
                  const isPrimaryAdmin = u.email === "admin@healtalk.com";

                  return (
                    <tr key={u._id}>
                      <td>
                        <div className="user-profile-cell">
                          <div className={`user-table-avatar ${u.role || "patient"}`}>
                            {initials}
                          </div>
                          <div className="user-name-cell">
                            <span className="user-name-text">{u.name}</span>
                            <span className="user-language-sub">
                              <Languages size={11} />
                              {u.language || "English"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="user-email-cell">{u.email}</td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td>{getStatusBadge(u.status)}</td>
                      <td className="user-date-cell">
                        <div className="date-with-icon">
                          <Calendar size={13} />
                          <span>{formatDate(u.createdAt)}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="user-actions-row">
                          <button
                            className="btn-action-details"
                            onClick={() => handleOpenDetails(u)}
                            title="View Full Details"
                          >
                            <Eye size={14} />
                            <span>Details</span>
                          </button>

                          {!isPrimaryAdmin && (
                            isSuspended ? (
                              <button
                                className="btn-action-activate"
                                onClick={() => handleToggleStatus(u, "approved")}
                                title="Activate Account"
                              >
                                <CheckCircle2 size={14} />
                                <span>Activate</span>
                              </button>
                            ) : (
                              <button
                                className="btn-action-deactivate"
                                onClick={() => handleToggleStatus(u, "suspended")}
                                title="Deactivate / Suspend Account"
                              >
                                <Ban size={14} />
                                <span>Deactivate</span>
                              </button>
                            )
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

        {/* Pagination Bar */}
        {!loading && users.length > 0 && (
          <div className="users-pagination-bar">
            <div className="pagination-info">
              Showing{" "}
              <strong>
                {(currentPage - 1) * pageSize + 1} -{" "}
                {Math.min(currentPage * pageSize, totalUsers)}
              </strong>{" "}
              of <strong>{totalUsers}</strong> users
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

      {/* USER DETAILS MODAL */}
      {selectedUserId && userDetails && (
        <div className="admin-modal-backdrop" onClick={handleCloseDetails}>
          <div
            className="admin-details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>User Profile Details</h3>
                <p>Comprehensive account and professional records</p>
              </div>
              <button
                className="modal-close-btn"
                onClick={handleCloseDetails}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div className={`modal-status-alert ${statusMessage.type}`}>
                {statusMessage.type === "success" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Modal Body */}
            <div className="modal-body">
              {detailsLoading ? (
                <div className="modal-loading-box">
                  <Loader2 size={30} className="spin-icon" />
                  <span>Loading full profile details...</span>
                </div>
              ) : (
                <>
                  {/* User Profile Card */}
                  <div className="modal-user-banner">
                    <div className={`modal-user-avatar ${userDetails.role || "patient"}`}>
                      {getAvatarInitials(userDetails.name)}
                    </div>
                    <div className="modal-user-banner-info">
                      <h4>{userDetails.name}</h4>
                      <div className="modal-user-badges">
                        {getRoleBadge(userDetails.role)}
                        {getStatusBadge(userDetails.status)}
                      </div>
                    </div>
                  </div>

                  {/* General Info Grid */}
                  <div className="modal-section-title">Account Information</div>
                  <div className="modal-info-grid">
                    <div className="modal-info-item">
                      <span className="info-label">
                        <Mail size={13} />
                        Email Address
                      </span>
                      <span className="info-value">{userDetails.email}</span>
                    </div>

                    <div className="modal-info-item">
                      <span className="info-label">
                        <UserIcon size={13} />
                        Account Role
                      </span>
                      <span className="info-value text-capitalize">
                        {userDetails.role}
                      </span>
                    </div>

                    <div className="modal-info-item">
                      <span className="info-label">
                        <Languages size={13} />
                        Primary Language
                      </span>
                      <span className="info-value">
                        {userDetails.language || "English"}
                      </span>
                    </div>

                    <div className="modal-info-item">
                      <span className="info-label">
                        <Calendar size={13} />
                        Registration Date
                      </span>
                      <span className="info-value">
                        {formatDate(userDetails.createdAt)}
                      </span>
                    </div>

                    <div className="modal-info-item full-width">
                      <span className="info-label">MongoDB Account ID</span>
                      <code className="info-code">{userDetails._id}</code>
                    </div>
                  </div>

                  {/* Doctor Profile Specifics (If Role is Doctor) */}
                  {userDetails.role === "doctor" && userDetails.doctorProfile && (
                    <>
                      <div className="modal-section-title">
                        <Stethoscope size={15} />
                        Doctor Professional Profile
                      </div>
                      <div className="modal-info-grid">
                        <div className="modal-info-item">
                          <span className="info-label">Specialty</span>
                          <span className="info-value">
                            {userDetails.doctorProfile.specialty}
                          </span>
                        </div>
                        <div className="modal-info-item">
                          <span className="info-label">Experience</span>
                          <span className="info-value">
                            {userDetails.doctorProfile.experience || "N/A"}
                          </span>
                        </div>
                        <div className="modal-info-item">
                          <span className="info-label">Consultation Fee</span>
                          <span className="info-value">
                            {userDetails.doctorProfile.fee || "$45"}
                          </span>
                        </div>
                        <div className="modal-info-item">
                          <span className="info-label">Patient Rating</span>
                          <span className="info-value flex items-center gap-1">
                            <Star size={13} style={{ color: "#f59e0b", fill: "#f59e0b" }} />
                            {userDetails.doctorProfile.rating || "4.8"} (
                            {userDetails.doctorProfile.reviews || "0"} reviews)
                          </span>
                        </div>
                        {userDetails.doctorProfile.bio && (
                          <div className="modal-info-item full-width">
                            <span className="info-label">Professional Bio</span>
                            <p className="modal-bio-text">
                              {userDetails.doctorProfile.bio}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Actions Section */}
                  <div className="modal-section-title">Account Management Actions</div>
                  <div className="modal-action-buttons">
                    {userDetails.email !== "admin@healtalk.com" && (
                      userDetails.status === "suspended" ? (
                        <button
                          className="btn-modal-activate"
                          disabled={actionLoading}
                          onClick={() => handleToggleStatus(userDetails, "approved")}
                        >
                          <CheckCircle2 size={16} />
                          <span>Activate Account</span>
                        </button>
                      ) : (
                        <button
                          className="btn-modal-deactivate"
                          disabled={actionLoading}
                          onClick={() => handleToggleStatus(userDetails, "suspended")}
                        >
                          <Ban size={16} />
                          <span>Suspend / Deactivate Account</span>
                        </button>
                      )
                    )}

                    <button
                      className="btn-modal-close"
                      onClick={handleCloseDetails}
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersManagement;
