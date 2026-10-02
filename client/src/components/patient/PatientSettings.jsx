import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchMyProfile, updatePatientSettings } from "../../services/authService";
import {
  Globe,
  Languages,
  Shield,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Save,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Loader2,
  Lock,
} from "lucide-react";

const ALL_LANGUAGES = [
  "English",
  "Spanish",
  "Hindi",
  "French",
  "Mandarin",
  "Tamil",
  "Telugu",
  "German",
  "Arabic",
  "Portuguese",
  "Russian",
  "Japanese",
  "Korean",
  "Italian",
];

function PatientSettings({ user: propUser }) {
  const { user: authUser, updateUser } = useAuth();
  const currentUser = authUser || propUser;

  const [preferredLang, setPreferredLang] = useState(currentUser?.language || "English");
  const [autoInterpreter, setAutoInterpreter] = useState(!!currentUser?.autoRequestInterpreter);
  const [emergencyPhone, setEmergencyPhone] = useState(
    currentUser?.emergencyContactPhone || currentUser?.phone || ""
  );

  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState(null); // 'all' | 'language' | 'interpreter' | 'profile' | null
  const [toastMessage, setToastMessage] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const showToast = (msg, type = "success") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchMyProfile();
      if (res && res.user) {
        setPreferredLang(res.user.language || "English");
        setAutoInterpreter(!!res.user.autoRequestInterpreter);
        setEmergencyPhone(res.user.emergencyContactPhone || res.user.phone || "");
        if (updateUser) {
          updateUser(res.user);
        }
      }
    } catch (err) {
      console.warn("Using active auth context fallback:", err.message);
      if (currentUser) {
        setPreferredLang(currentUser.language || "English");
        setAutoInterpreter(!!currentUser.autoRequestInterpreter);
        setEmergencyPhone(currentUser.emergencyContactPhone || currentUser.phone || "");
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to persist partial or complete settings to MongoDB
  const persistSettings = async (payload, sectionKey, successMsg) => {
    try {
      setSavingSection(sectionKey);
      setError("");

      const res = await updatePatientSettings(payload);

      if (res && res.user) {
        if (updateUser) {
          updateUser(res.user);
        }
        if (res.user.language) setPreferredLang(res.user.language);
        if (res.user.autoRequestInterpreter !== undefined) {
          setAutoInterpreter(!!res.user.autoRequestInterpreter);
        }
        if (res.user.emergencyContactPhone !== undefined) {
          setEmergencyPhone(res.user.emergencyContactPhone);
        }
      }

      showToast(successMsg || "Settings updated successfully!");
    } catch (err) {
      console.error("Error updating patient settings:", err);
      const errMsg = err.message || "Failed to update preferences. Please try again.";
      setError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveAll = (e) => {
    if (e) e.preventDefault();
    persistSettings(
      {
        language: preferredLang,
        autoRequestInterpreter: autoInterpreter,
        emergencyContactPhone: emergencyPhone.trim(),
      },
      "all",
      "All language, interpreter, and profile preferences saved successfully!"
    );
  };

  const handleSaveLanguage = () => {
    persistSettings(
      { language: preferredLang },
      "language",
      `Primary consultation language updated to ${preferredLang}!`
    );
  };

  const handleSaveInterpreter = () => {
    persistSettings(
      { autoRequestInterpreter: autoInterpreter },
      "interpreter",
      autoInterpreter
        ? "Automated human interpreter request enabled for your account!"
        : "Automated human interpreter request disabled."
    );
  };

  const handleSaveProfile = () => {
    persistSettings(
      { emergencyContactPhone: emergencyPhone.trim() },
      "profile",
      "Emergency contact phone number updated successfully!"
    );
  };

  const getInitials = (name) => {
    if (!name) return "PT";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (loading && !currentUser) {
    return (
      <div className="patient-settings-loading">
        <Loader2 size={32} className="spin-icon" style={{ color: "#087f8c" }} />
        <p>Loading your preferences and profile details...</p>
      </div>
    );
  }

  const isSaving = savingSection !== null;

  return (
    <div className="patient-settings-wrapper">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`doctor-toast ${toastMessage.type === "error" ? "error" : ""}`}>
          {toastMessage.type === "error" ? (
            <AlertCircle size={16} />
          ) : (
            <CheckCircle2 size={16} />
          )}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Header Banner matching Doctor Settings */}
      <div className="patient-settings-top-header">
        <div className="patient-settings-title-group">
          <h2>Language & Account Settings</h2>
          <p>
            Configure your consultation language, live interpreter preferences, and emergency contact details
          </p>
        </div>
        <div className="patient-settings-header-actions">
          <button
            type="button"
            className="doctor-btn-primary"
            onClick={handleSaveAll}
            disabled={isSaving || loading}
          >
            {savingSection === "all" ? (
              <>
                <Loader2 size={15} className="spin-icon" />
                <span>Saving All...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="settings-error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            type="button"
            className="settings-retry-btn"
            onClick={loadSettings}
            title="Reload from server"
          >
            <RotateCcw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Patient Hero / Identity Summary Card */}
      <div className="doctor-card profile-hero-card patient-hero-card">
        <div className="hero-banner-inner">
          <div className="hero-avatar-box">
            {getInitials(currentUser?.name)}
          </div>
          <div className="hero-text-details">
            <div className="hero-title-row">
              <h3>{currentUser?.name || "Patient Member"}</h3>
              <span className="admin-status-tag active">
                <ShieldCheck size={13} />
                Verified Patient
              </span>
            </div>
            <p className="hero-specialty">
              HealTalk Telehealth Member • Preferred: <strong>{preferredLang}</strong>
            </p>
            <div className="hero-meta-badges">
              <span className="hero-badge">
                <Globe size={13} /> {preferredLang}
              </span>
              <span className="hero-badge">
                <Languages size={13} /> {autoInterpreter ? "Auto-Interpreter ON" : "Interpreter Manual"}
              </span>
              <span className="hero-badge">
                <Phone size={13} /> {emergencyPhone || "No Emergency Contact"}
              </span>
              <span className="hero-badge">
                <Mail size={13} /> {currentUser?.email || "patient@healtalk.com"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Cards Grid */}
      <div className="patient-settings-sections-grid">
        {/* Card 1: Consultation Language */}
        <div className="doctor-card patient-section-card">
          <div className="doctor-card-header">
            <div className="doctor-card-title-group">
              <div className="card-header-with-icon">
                <div className="settings-card-icon-badge">
                  <Globe size={18} />
                </div>
                <div>
                  <h3>Primary Consultation Language</h3>
                  <p>Doctors & AI real-time translation adapt to this language</p>
                </div>
              </div>
            </div>
          </div>

          <div className="patient-card-body">
            <div className="settings-input-group">
              <label htmlFor="patient-preferred-language">
                Preferred Spoken Language <span className="req">*</span>
              </label>
              <div className="select-wrapper">
                <select
                  id="patient-preferred-language"
                  value={preferredLang}
                  onChange={(e) => setPreferredLang(e.target.value)}
                  className="settings-select"
                  disabled={isSaving || loading}
                >
                  {ALL_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
              <p className="settings-field-hint">
                Real-time video consultation captions, doctor speech translation, and AI clinical summaries will default to this language.
              </p>
            </div>

            <div className="patient-info-callout">
              <Globe size={16} className="callout-icon" />
              <div className="callout-text">
                <strong>Multilingual Consultations Active:</strong> Whenever you book a doctor who does not speak <strong>{preferredLang}</strong>, HealTalk provides AI speech translation and auto-suggests certified live medical interpreters.
              </div>
            </div>
          </div>

          <div className="patient-card-footer">
            <button
              type="button"
              className="doctor-btn-primary doctor-btn-sm"
              onClick={handleSaveLanguage}
              disabled={isSaving || loading}
            >
              {savingSection === "language" ? (
                <>
                  <Loader2 size={14} className="spin-icon" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Language</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Card 2: Interpreter Preference */}
        <div className="doctor-card patient-section-card">
          <div className="doctor-card-header">
            <div className="doctor-card-title-group">
              <div className="card-header-with-icon">
                <div className="settings-card-icon-badge">
                  <Languages size={18} />
                </div>
                <div>
                  <h3>Human Interpreter Auto-Request</h3>
                  <p>Accessibility options for cross-language medical consultations</p>
                </div>
              </div>
            </div>
          </div>

          <div className="patient-card-body">
            <div className="interpreter-toggle-panel">
              <div className="interpreter-toggle-row">
                <div className="toggle-info-col">
                  <div className="toggle-title-row">
                    <span className="toggle-main-label">
                      Auto-Request Certified Live Interpreter
                    </span>
                    <span
                      className={`doctor-status-badge ${
                        autoInterpreter ? "completed" : "cancelled"
                      }`}
                    >
                      {autoInterpreter ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <p className="toggle-description">
                    {autoInterpreter
                      ? "HealTalk will automatically request and schedule an accredited live interpreter whenever you book with doctors who speak other languages."
                      : "Interpreter requests remain manual. You will need to explicitly check 'Request Live Interpreter' during individual doctor bookings."}
                  </p>
                </div>

                {/* Professional iOS Switch Toggle matching Doctor portal */}
                <label className="admin-switch" title="Toggle Auto-Request Interpreter">
                  <input
                    type="checkbox"
                    checked={autoInterpreter}
                    onChange={(e) => setAutoInterpreter(e.target.checked)}
                    disabled={isSaving || loading}
                  />
                  <span className="admin-slider"></span>
                </label>
              </div>
            </div>

            <div className="patient-info-callout">
              <ShieldCheck size={16} className="callout-icon" />
              <div className="callout-text">
                <strong>HIPAA-Compliant Interpretation:</strong> All HealTalk interpreters are certified medical translators bound by strict confidentiality and clinical protocols.
              </div>
            </div>
          </div>

          <div className="patient-card-footer">
            <button
              type="button"
              className="doctor-btn-primary doctor-btn-sm"
              onClick={handleSaveInterpreter}
              disabled={isSaving || loading}
            >
              {savingSection === "interpreter" ? (
                <>
                  <Loader2 size={14} className="spin-icon" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Preferences</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Card 3: Patient Profile Details & Emergency Contact */}
        <div className="doctor-card patient-section-card full-width-card">
          <div className="doctor-card-header">
            <div className="doctor-card-title-group">
              <div className="card-header-with-icon">
                <div className="settings-card-icon-badge">
                  <User size={18} />
                </div>
                <div>
                  <h3>Patient Profile & Emergency Contact</h3>
                  <p>Verified patient account details and emergency telephone contact</p>
                </div>
              </div>
            </div>
          </div>

          <div className="patient-card-body">
            <div className="profile-form-grid">
              {/* Full Name - Read Only */}
              <div className="settings-input-group">
                <div className="label-row">
                  <label htmlFor="patient-name">Full Name</label>
                  <span className="readonly-tag">
                    <Lock size={11} /> Read-Only
                  </span>
                </div>
                <div className="input-with-icon disabled">
                  <User size={15} className="input-field-icon" />
                  <input
                    type="text"
                    id="patient-name"
                    value={currentUser?.name || ""}
                    disabled
                    readOnly
                    className="settings-input input-readonly"
                  />
                </div>
                <span className="settings-field-hint">
                  Your official patient identity verified during registration.
                </span>
              </div>

              {/* Email Address - Read Only */}
              <div className="settings-input-group">
                <div className="label-row">
                  <label htmlFor="patient-email">Email Address</label>
                  <span className="readonly-tag">
                    <Lock size={11} /> Read-Only
                  </span>
                </div>
                <div className="input-with-icon disabled">
                  <Mail size={15} className="input-field-icon" />
                  <input
                    type="email"
                    id="patient-email"
                    value={currentUser?.email || ""}
                    disabled
                    readOnly
                    className="settings-input input-readonly"
                  />
                </div>
                <span className="settings-field-hint">
                  Primary email used for consultation alerts, OTPs, and login.
                </span>
              </div>

              {/* Platform Role - Read Only */}
              <div className="settings-input-group">
                <div className="label-row">
                  <label htmlFor="patient-role">Account Role</label>
                  <span className="readonly-tag">
                    <Lock size={11} /> Read-Only
                  </span>
                </div>
                <div className="input-with-icon disabled">
                  <Shield size={15} className="input-field-icon" />
                  <input
                    type="text"
                    id="patient-role"
                    value={(currentUser?.role || "patient").toUpperCase()}
                    disabled
                    readOnly
                    className="settings-input input-readonly code-font"
                  />
                </div>
                <span className="settings-field-hint">
                  Standard patient account permissions with telehealth access.
                </span>
              </div>

              {/* Emergency Contact Phone - Editable */}
              <div className="settings-input-group">
                <div className="label-row">
                  <label htmlFor="patient-emergency-phone">
                    Emergency Contact Phone <span className="req">*</span>
                  </label>
                  <span className="editable-tag">Editable</span>
                </div>
                <div className="input-with-icon">
                  <Phone size={15} className="input-field-icon text-teal" />
                  <input
                    type="tel"
                    id="patient-emergency-phone"
                    placeholder="e.g. +1 (555) 234-5678"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    disabled={isSaving || loading}
                    className="settings-input input-editable"
                  />
                </div>
                <span className="settings-field-hint">
                  Direct phone number contacted by medical staff during critical alerts.
                </span>
              </div>
            </div>
          </div>

          <div className="patient-card-footer">
            <button
              type="button"
              className="doctor-btn-primary doctor-btn-sm"
              onClick={handleSaveProfile}
              disabled={isSaving || loading}
            >
              {savingSection === "profile" ? (
                <>
                  <Loader2 size={14} className="spin-icon" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientSettings;
