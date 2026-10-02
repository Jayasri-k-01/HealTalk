import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  Mail,
  Shield,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Bell,
  Sliders,
  Globe,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Edit3,
  X,
  Save,
  RotateCcw,
  Laptop,
  Check,
  Info,
  Sparkles,
} from "lucide-react";

// Placeholder options for System Settings
const LANGUAGE_OPTIONS = [
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "es-ES", label: "Español (Spanish)" },
  { value: "fr-FR", label: "Français (French)" },
  { value: "de-DE", label: "Deutsch (German)" },
  { value: "hi-IN", label: "हिन्दी (Hindi)" },
  { value: "zh-CN", label: "Mandarin Chinese (简体中文)" },
  { value: "ar-SA", label: "العربية (Arabic)" },
  { value: "pt-BR", label: "Português (Brazil)" },
];

const TIMEZONE_OPTIONS = [
  { value: "UTC+05:30", label: "UTC+05:30 — India Standard Time (IST)" },
  { value: "UTC+00:00", label: "UTC+00:00 — Greenwich Mean Time / London (GMT)" },
  { value: "UTC-05:00", label: "UTC-05:00 — Eastern Time (US & Canada)" },
  { value: "UTC-06:00", label: "UTC-06:00 — Central Time (US & Canada)" },
  { value: "UTC-08:00", label: "UTC-08:00 — Pacific Time (US & Canada)" },
  { value: "UTC+01:00", label: "UTC+01:00 — Central European Time (CET)" },
  { value: "UTC+04:00", label: "UTC+04:00 — Gulf Standard Time (GST)" },
  { value: "UTC+08:00", label: "UTC+08:00 — Singapore / Beijing Time (CST)" },
  { value: "UTC+09:00", label: "UTC+09:00 — Tokyo / Seoul (JST)" },
];

const DATE_FORMAT_OPTIONS = [
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (e.g. 2026-09-24 — ISO 8601)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (e.g. 09/24/2026 — US)" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (e.g. 24/09/2026 — UK / International)" },
  { value: "DD MMM YYYY", label: "DD MMM YYYY (e.g. 24 Sep 2026 — Expanded)" },
  { value: "MMMM DD, YYYY", label: "MMMM DD, YYYY (e.g. September 24, 2026 — Full)" },
];

function SettingsManagement({ user: propUser }) {
  const { user: authUser, logout } = useAuth();
  const currentUser = propUser || authUser;

  // --------------------------------------------------------------------------
  // Global Toast Notification (confirms local-state operations)
  // --------------------------------------------------------------------------
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3500);
  };

  // --------------------------------------------------------------------------
  // 1. ADMIN PROFILE STATE & HANDLERS (Local Component State)
  // --------------------------------------------------------------------------
  const [profile, setProfile] = useState({
    name: currentUser?.name || "System Administrator",
    email: currentUser?.email || "admin@healtalk.com",
    role: (currentUser?.role || "admin").toUpperCase(),
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    name: profile.name,
    email: profile.email,
  });
  const [profileErrors, setProfileErrors] = useState({});

  const handleOpenEditProfile = () => {
    setEditProfileForm({
      name: profile.name,
      email: profile.email,
    });
    setProfileErrors({});
    setIsEditModalOpen(true);
  };

  const handleCloseEditProfile = () => {
    setIsEditModalOpen(false);
    setProfileErrors({});
  };

  // Local-state save for Admin Profile (ready for backend API swap)
  const handleSaveProfile = (e) => {
    e.preventDefault();
    const errors = {};
    if (!editProfileForm.name.trim()) {
      errors.name = "Full name is required";
    }
    if (!editProfileForm.email.trim()) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editProfileForm.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    // Update local component state
    setProfile((prev) => ({
      ...prev,
      name: editProfileForm.name.trim(),
      email: editProfileForm.email.trim(),
    }));

    setIsEditModalOpen(false);
    showToast("Admin profile updated successfully (local state saved)");
  };

  // --------------------------------------------------------------------------
  // 2. ACCOUNT SETTINGS — CHANGE PASSWORD STATE & HANDLERS
  // --------------------------------------------------------------------------
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [passwordErrors, setPasswordErrors] = useState({});

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Local-state save for Password Change (ready for backend API swap)
  const handleSavePassword = (e) => {
    e.preventDefault();
    const errors = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters long";
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = "Confirm password is required";
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "New password and confirmation password do not match";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    // Reset password form inputs
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({});
    showToast("Password updated successfully (local validation passed)");
  };

  const handleCancelPassword = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({});
    showToast("Password fields cleared", "info");
  };

  // --------------------------------------------------------------------------
  // 3. NOTIFICATION SETTINGS STATE & HANDLERS (Local Component State)
  // --------------------------------------------------------------------------
  const defaultNotifications = {
    newDoctorRegistration: true,
    newInterpreterRegistration: true,
    appointmentUpdates: true,
    verificationAlerts: true,
  };

  const [notifications, setNotifications] = useState(defaultNotifications);
  const [savedNotifications, setSavedNotifications] = useState(defaultNotifications);

  const handleToggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Local-state save for Notification Settings (ready for backend API swap)
  const handleSaveNotifications = (e) => {
    e.preventDefault();
    setSavedNotifications(notifications);
    showToast("Notification preferences saved successfully (local state)");
  };

  const handleCancelNotifications = () => {
    setNotifications(savedNotifications);
    showToast("Notification preferences reverted to saved values", "info");
  };

  // --------------------------------------------------------------------------
  // 4. SYSTEM SETTINGS STATE & HANDLERS (Local Component State)
  // --------------------------------------------------------------------------
  const defaultSystemSettings = {
    language: "en-US",
    timezone: "UTC+05:30",
    dateFormat: "YYYY-MM-DD",
  };

  const [systemSettings, setSystemSettings] = useState(defaultSystemSettings);
  const [savedSystemSettings, setSavedSystemSettings] = useState(defaultSystemSettings);

  const handleSystemSettingChange = (field, value) => {
    setSystemSettings((prev) => ({ ...prev, [field]: value }));
  };

  // Local-state save for System Settings (ready for backend API swap)
  const handleSaveSystemSettings = (e) => {
    e.preventDefault();
    setSavedSystemSettings(systemSettings);
    showToast("System & localization settings saved (local state)");
  };

  const handleCancelSystemSettings = () => {
    setSystemSettings(savedSystemSettings);
    showToast("System settings reverted to saved values", "info");
  };

  // --------------------------------------------------------------------------
  // 5. SECURITY & SESSION MANAGEMENT (Uses real auth logout)
  // --------------------------------------------------------------------------
  // Labeled placeholder session data structured for future backend endpoint
  const sessionInfo = {
    device: "Chrome 128 (Windows 11)",
    ipAddress: "192.168.1.104 (Current Host)",
    loginTime: "Today at 08:30 AM (Active Session)",
    location: "Secured Local Client",
    status: "Active",
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Wire Security section logout directly to the existing AuthContext logout
  const handleSecurityLogout = () => {
    setIsLoggingOut(true);
    logout();
  };

  // Get admin initials for avatar
  const getInitials = (name) => {
    if (!name) return "AD";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="admin-settings-page">
      {/* Toast Notification Banner */}
      {toast.show && (
        <div className={`admin-settings-toast ${toast.type}`}>
          {toast.type === "success" ? (
            <CheckCircle2 size={18} className="toast-icon success" />
          ) : toast.type === "error" ? (
            <AlertCircle size={18} className="toast-icon error" />
          ) : (
            <Info size={18} className="toast-icon info" />
          )}
          <span className="toast-message">{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="admin-settings-header">
        <div className="admin-settings-title-group">
          <h2>Admin Settings & System Preferences</h2>
          <p>
            Configure administrator profile, credentials, platform notification triggers,
            localization, and session security.
          </p>
        </div>
      </div>

      <div className="admin-settings-grid">
        {/* ====================================================================
            SECTION 1: ADMIN PROFILE
            ==================================================================== */}
        <section className="admin-card settings-card profile-card" id="admin-profile-section">
          <div className="admin-card-header">
            <div className="admin-card-title-group">
              <div className="settings-section-title-with-icon">
                <div className="settings-header-icon profile">
                  <User size={18} />
                </div>
                <div>
                  <h3>Admin Profile</h3>
                  <p>Your administrator identity and credential details on HealTalk</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={handleOpenEditProfile}
              id="edit-profile-btn"
            >
              <Edit3 size={15} />
              <span>Edit Profile</span>
            </button>
          </div>

          <div className="settings-profile-body">
            <div className="settings-profile-banner">
              <div className="settings-profile-avatar">
                {getInitials(profile.name)}
              </div>
              <div className="settings-profile-meta">
                <div className="profile-name-row">
                  <h4>{profile.name}</h4>
                  <span className="admin-status-tag active">
                    <ShieldCheck size={12} />
                    Verified Admin
                  </span>
                </div>
                <div className="profile-detail-row">
                  <Mail size={14} className="profile-meta-icon" />
                  <span>{profile.email}</span>
                </div>
              </div>
            </div>

            <div className="settings-profile-fields-grid">
              <div className="settings-field-box">
                <label className="settings-field-label">Administrator Full Name</label>
                <div className="settings-display-value">
                  <User size={16} className="field-icon" />
                  <span>{profile.name}</span>
                </div>
              </div>

              <div className="settings-field-box">
                <label className="settings-field-label">Primary Email Address</label>
                <div className="settings-display-value">
                  <Mail size={16} className="field-icon" />
                  <span>{profile.email}</span>
                </div>
              </div>

              <div className="settings-field-box">
                <label className="settings-field-label">Portal Access Role</label>
                <div className="settings-display-value">
                  <Shield size={16} className="field-icon" />
                  <span className="role-tag">{profile.role}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            SECTION 2: ACCOUNT SETTINGS — CHANGE PASSWORD
            ==================================================================== */}
        <section className="admin-card settings-card" id="account-password-section">
          <div className="admin-card-header">
            <div className="admin-card-title-group">
              <div className="settings-section-title-with-icon">
                <div className="settings-header-icon password">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3>Account Settings — Change Password</h3>
                  <p>Update administrator login credentials with client-side verification</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSavePassword} className="settings-password-form">
            <div className="settings-form-grid">
              {/* Current Password */}
              <div className="settings-input-group">
                <label htmlFor="currentPassword">
                  Current Password <span className="req">*</span>
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword.current ? "text" : "password"}
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current administrator password"
                    className={`settings-input ${passwordErrors.currentPassword ? "has-error" : ""}`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() =>
                      setShowPassword((p) => ({ ...p, current: !p.current }))
                    }
                    aria-label={showPassword.current ? "Hide password" : "Show password"}
                  >
                    {showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <span className="settings-error-text">
                    <AlertCircle size={13} /> {passwordErrors.currentPassword}
                  </span>
                )}
              </div>

              {/* New Password */}
              <div className="settings-input-group">
                <label htmlFor="newPassword">
                  New Password <span className="req">*</span>
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Create a strong password (min 8 characters)"
                    className={`settings-input ${passwordErrors.newPassword ? "has-error" : ""}`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() =>
                      setShowPassword((p) => ({ ...p, new: !p.new }))
                    }
                    aria-label={showPassword.new ? "Hide password" : "Show password"}
                  >
                    {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <span className="settings-error-text">
                    <AlertCircle size={13} /> {passwordErrors.newPassword}
                  </span>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="settings-input-group">
                <label htmlFor="confirmPassword">
                  Confirm New Password <span className="req">*</span>
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Re-enter new password to verify"
                    className={`settings-input ${passwordErrors.confirmPassword ? "has-error" : ""}`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() =>
                      setShowPassword((p) => ({ ...p, confirm: !p.confirm }))
                    }
                    aria-label={showPassword.confirm ? "Hide password" : "Show password"}
                  >
                    {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <span className="settings-error-text">
                    <AlertCircle size={13} /> {passwordErrors.confirmPassword}
                  </span>
                )}
              </div>
            </div>

            <div className="settings-password-hint">
              <Sparkles size={14} className="hint-icon" />
              <span>
                Ensure your password is at least 8 characters long and contains letters, numbers,
                and special symbols for optimal account security.
              </span>
            </div>

            <div className="settings-card-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={handleCancelPassword}
                id="cancel-password-btn"
              >
                <RotateCcw size={15} />
                <span>Reset</span>
              </button>
              <button
                type="submit"
                className="admin-btn-primary"
                id="save-password-btn"
              >
                <Save size={15} />
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </section>

        {/* ====================================================================
            SECTION 3: NOTIFICATION SETTINGS
            ==================================================================== */}
        <section className="admin-card settings-card" id="notifications-section">
          <div className="admin-card-header">
            <div className="admin-card-title-group">
              <div className="settings-section-title-with-icon">
                <div className="settings-header-icon notifications">
                  <Bell size={18} />
                </div>
                <div>
                  <h3>Notification Settings</h3>
                  <p>Configure automated platform event triggers and alerts</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveNotifications} className="settings-toggles-container">
            <div className="settings-toggles-list">
              {/* Toggle 1: New Doctor Registration */}
              <div className="settings-toggle-row">
                <div className="toggle-info">
                  <div className="toggle-title-line">
                    <span className="toggle-label">New Doctor Registration</span>
                    <span className="settings-mini-tag doc">Healthcare Providers</span>
                  </div>
                  <p className="toggle-desc">
                    Receive instant alerts whenever a new doctor registers and submits credentials for verification.
                  </p>
                </div>
                <label className="admin-switch" htmlFor="toggle-new-doctor">
                  <input
                    type="checkbox"
                    id="toggle-new-doctor"
                    checked={notifications.newDoctorRegistration}
                    onChange={() => handleToggleNotification("newDoctorRegistration")}
                  />
                  <span className="admin-slider"></span>
                </label>
              </div>

              {/* Toggle 2: New Interpreter Registration */}
              <div className="settings-toggle-row">
                <div className="toggle-info">
                  <div className="toggle-title-line">
                    <span className="toggle-label">New Interpreter Registration</span>
                    <span className="settings-mini-tag int">Language Services</span>
                  </div>
                  <p className="toggle-desc">
                    Receive notifications when a certified medical translator or language interpreter registers on HealTalk.
                  </p>
                </div>
                <label className="admin-switch" htmlFor="toggle-new-interpreter">
                  <input
                    type="checkbox"
                    id="toggle-new-interpreter"
                    checked={notifications.newInterpreterRegistration}
                    onChange={() => handleToggleNotification("newInterpreterRegistration")}
                  />
                  <span className="admin-slider"></span>
                </label>
              </div>

              {/* Toggle 3: Appointment Updates */}
              <div className="settings-toggle-row">
                <div className="toggle-info">
                  <div className="toggle-title-line">
                    <span className="toggle-label">Appointment Updates</span>
                    <span className="settings-mini-tag apt">Consultations</span>
                  </div>
                  <p className="toggle-desc">
                    Get real-time updates regarding new bookings, patient reschedules, cancellations, and completed sessions.
                  </p>
                </div>
                <label className="admin-switch" htmlFor="toggle-appointment-updates">
                  <input
                    type="checkbox"
                    id="toggle-appointment-updates"
                    checked={notifications.appointmentUpdates}
                    onChange={() => handleToggleNotification("appointmentUpdates")}
                  />
                  <span className="admin-slider"></span>
                </label>
              </div>

              {/* Toggle 4: Verification Notifications */}
              <div className="settings-toggle-row">
                <div className="toggle-info">
                  <div className="toggle-title-line">
                    <span className="toggle-label">Verification Notifications</span>
                    <span className="settings-mini-tag alert">Compliance & Audits</span>
                  </div>
                  <p className="toggle-desc">
                    Receive priority alerts for pending document verifications, license reviews, and compliance status changes.
                  </p>
                </div>
                <label className="admin-switch" htmlFor="toggle-verification-alerts">
                  <input
                    type="checkbox"
                    id="toggle-verification-alerts"
                    checked={notifications.verificationAlerts}
                    onChange={() => handleToggleNotification("verificationAlerts")}
                  />
                  <span className="admin-slider"></span>
                </label>
              </div>
            </div>

            <div className="settings-card-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={handleCancelNotifications}
                id="cancel-notifications-btn"
              >
                <RotateCcw size={15} />
                <span>Revert Changes</span>
              </button>
              <button
                type="submit"
                className="admin-btn-primary"
                id="save-notifications-btn"
              >
                <Save size={15} />
                <span>Save Notification Settings</span>
              </button>
            </div>
          </form>
        </section>

        {/* ====================================================================
            SECTION 4: SYSTEM SETTINGS
            ==================================================================== */}
        <section className="admin-card settings-card" id="system-settings-section">
          <div className="admin-card-header">
            <div className="admin-card-title-group">
              <div className="settings-section-title-with-icon">
                <div className="settings-header-icon system">
                  <Sliders size={18} />
                </div>
                <div>
                  <h3>System & Localization Settings</h3>
                  <p>Configure platform language preferences, timezone reference, and date presentation</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveSystemSettings} className="settings-system-form">
            <div className="settings-dropdown-grid">
              {/* Language Dropdown */}
              <div className="settings-input-group">
                <label htmlFor="systemLanguage" className="dropdown-label">
                  <Globe size={15} className="dropdown-icon" />
                  <span>Platform Display Language</span>
                </label>
                <div className="settings-select-wrapper">
                  <select
                    id="systemLanguage"
                    value={systemSettings.language}
                    onChange={(e) => handleSystemSettingChange("language", e.target.value)}
                    className="settings-select"
                  >
                    {LANGUAGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="settings-field-hint">
                  Preferred language for administrator dashboard controls and system notices.
                </span>
              </div>

              {/* Timezone Dropdown */}
              <div className="settings-input-group">
                <label htmlFor="systemTimezone" className="dropdown-label">
                  <Clock size={15} className="dropdown-icon" />
                  <span>System Timezone</span>
                </label>
                <div className="settings-select-wrapper">
                  <select
                    id="systemTimezone"
                    value={systemSettings.timezone}
                    onChange={(e) => handleSystemSettingChange("timezone", e.target.value)}
                    className="settings-select"
                  >
                    {TIMEZONE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="settings-field-hint">
                  All appointment timestamps and event logs will be formatted using this timezone.
                </span>
              </div>

              {/* Date Format Dropdown */}
              <div className="settings-input-group">
                <label htmlFor="systemDateFormat" className="dropdown-label">
                  <Calendar size={15} className="dropdown-icon" />
                  <span>Date Presentation Format</span>
                </label>
                <div className="settings-select-wrapper">
                  <select
                    id="systemDateFormat"
                    value={systemSettings.dateFormat}
                    onChange={(e) => handleSystemSettingChange("dateFormat", e.target.value)}
                    className="settings-select"
                  >
                    {DATE_FORMAT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="settings-field-hint">
                  Standard format applied across reports, user tables, and timestamp displays.
                </span>
              </div>
            </div>

            <div className="settings-card-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={handleCancelSystemSettings}
                id="cancel-system-settings-btn"
              >
                <RotateCcw size={15} />
                <span>Revert Changes</span>
              </button>
              <button
                type="submit"
                className="admin-btn-primary"
                id="save-system-settings-btn"
              >
                <Save size={15} />
                <span>Save System Settings</span>
              </button>
            </div>
          </form>
        </section>

        {/* ====================================================================
            SECTION 5: SECURITY & SESSION MANAGEMENT
            ==================================================================== */}
        <section className="admin-card settings-card security-card" id="security-session-section">
          <div className="admin-card-header">
            <div className="admin-card-title-group">
              <div className="settings-section-title-with-icon">
                <div className="settings-header-icon security">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3>Security & Active Session</h3>
                  <p>Review active portal sessions and manage administrator access</p>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-security-body">
            <div className="security-session-card">
              <div className="session-card-header">
                <div className="session-device-icon">
                  <Laptop size={22} />
                </div>
                <div className="session-device-meta">
                  <div className="session-title-line">
                    <h4>{sessionInfo.device}</h4>
                    <span className="session-active-badge">
                      <span className="active-dot"></span>
                      Current Session
                    </span>
                  </div>
                  <p className="session-subtext">
                    Logged in via secure HTTPS session authentication
                  </p>
                </div>
              </div>

              <div className="session-details-grid">
                <div className="session-detail-item">
                  <span className="detail-label">IP Address</span>
                  <span className="detail-value">{sessionInfo.ipAddress}</span>
                </div>
                <div className="session-detail-item">
                  <span className="detail-label">Login Timestamp</span>
                  <span className="detail-value">{sessionInfo.loginTime}</span>
                </div>
                <div className="session-detail-item">
                  <span className="detail-label">Location / Host</span>
                  <span className="detail-value">{sessionInfo.location}</span>
                </div>
                <div className="session-detail-item">
                  <span className="detail-label">Session Status</span>
                  <span className="detail-value status-active">
                    <Check size={14} /> Verified & Active
                  </span>
                </div>
              </div>
            </div>

            <div className="security-action-box">
              <div className="security-action-text">
                <h4>Administrator Sign Out</h4>
                <p>
                  End your active session securely. You will be redirected to the login portal and
                  will need to re-authenticate to access the Admin Portal.
                </p>
              </div>
              <button
                type="button"
                className="admin-btn-danger logout-btn"
                onClick={handleSecurityLogout}
                disabled={isLoggingOut}
                id="security-logout-btn"
              >
                <LogOut size={16} />
                <span>{isLoggingOut ? "Signing Out..." : "Sign Out of Admin Portal"}</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ======================================================================
          EDIT ADMIN PROFILE MODAL
          ====================================================================== */}
      {isEditModalOpen && (
        <div className="admin-modal-backdrop" onClick={handleCloseEditProfile}>
          <div
            className="admin-details-modal settings-edit-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>Edit Admin Profile</h3>
                <p>Update your administrator contact details</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseEditProfile}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="modal-body">
                <div className="settings-input-group">
                  <label htmlFor="edit-profile-name">
                    Full Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="edit-profile-name"
                    value={editProfileForm.name}
                    onChange={(e) =>
                      setEditProfileForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="Enter full name"
                    className={`settings-input ${profileErrors.name ? "has-error" : ""}`}
                  />
                  {profileErrors.name && (
                    <span className="settings-error-text">
                      <AlertCircle size={13} /> {profileErrors.name}
                    </span>
                  )}
                </div>

                <div className="settings-input-group">
                  <label htmlFor="edit-profile-email">
                    Email Address <span className="req">*</span>
                  </label>
                  <input
                    type="email"
                    id="edit-profile-email"
                    value={editProfileForm.email}
                    onChange={(e) =>
                      setEditProfileForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="Enter email address"
                    className={`settings-input ${profileErrors.email ? "has-error" : ""}`}
                  />
                  {profileErrors.email && (
                    <span className="settings-error-text">
                      <AlertCircle size={13} /> {profileErrors.email}
                    </span>
                  )}
                </div>

                <div className="settings-input-group">
                  <label>Portal Role</label>
                  <input
                    type="text"
                    value={profile.role}
                    disabled
                    className="settings-input disabled"
                  />
                  <span className="settings-field-hint">
                    Role is managed at the system level and cannot be changed here.
                  </span>
                </div>
              </div>

              <div className="modal-footer settings-modal-footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={handleCloseEditProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary"
                  id="modal-save-profile-btn"
                >
                  <Save size={15} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsManagement;
