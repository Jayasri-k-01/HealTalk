import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchInterpreterProfile,
  updateInterpreterProfile,
  uploadProfilePhoto,
  uploadCertificationDocument,
  updateInterpreterAvailability,
} from "../../services/interpreterService";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Award,
  Globe,
  Languages,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Upload,
  Camera,
  Trash2,
  Plus,
  Save,
  RotateCcw,
  Loader2,
  FileText,
  Lock,
  Check,
  Sparkles,
  ArrowRightLeft,
  X,
  ExternalLink,
} from "lucide-react";

const COMMON_LANGUAGES = [
  "Spanish",
  "English",
  "French",
  "Mandarin Chinese",
  "Cantonese",
  "Arabic",
  "Hindi",
  "Bengali",
  "Portuguese",
  "Russian",
  "Japanese",
  "German",
  "Vietnamese",
  "Korean",
  "Italian",
  "Turkish",
  "Tagalog",
  "Urdu",
  "Polish",
  "Ukrainian",
  "Persian (Farsi)",
  "Swahili",
  "Tamil",
  "Telugu",
  "American Sign Language (ASL)",
];

const SPECIALIZATIONS = [
  "General Medical Interpretation",
  "Cardiology & Cardiovascular",
  "Pediatrics & Child Health",
  "Emergency Medicine & Trauma",
  "Oncology & Palliative Care",
  "Mental Health & Psychiatry",
  "Neurology & Neurosurgery",
  "Obstetrics & Gynecology (OB/GYN)",
  "Surgery & Pre/Post-Op",
  "Endocrinology & Diabetes",
];

const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada) - EST/EDT" },
  { value: "America/Chicago", label: "Central Time (US & Canada) - CST/CDT" },
  { value: "America/Denver", label: "Mountain Time (US & Canada) - MST/MDT" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada) - PST/PDT" },
  { value: "Europe/London", label: "London, Dublin (GMT/BST)" },
  { value: "Europe/Paris", label: "Central European Time (CET/CEST)" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (GST)" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
  { value: "Asia/Singapore", label: "Singapore Time (SGT)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AEST/AEDT)" },
];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const PRESET_TIME_SLOTS = [
  "08:00 AM - 12:00 PM",
  "09:00 AM - 01:00 PM",
  "01:00 PM - 05:00 PM",
  "02:00 PM - 06:00 PM",
  "06:00 PM - 10:00 PM",
];

function InterpreterProfile({ onProfileUpdated, onBackToDashboard }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Base profile state
  const [originalProfile, setOriginalProfile] = useState(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [interpreterId, setInterpreterId] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [qualification, setQualification] = useState("");
  const [certificationNumber, setCertificationNumber] = useState("");
  const [experience, setExperience] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [bio, setBio] = useState("");
  const [certificationDocument, setCertificationDocument] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("approved");

  // Language preferences
  const [primaryLanguage, setPrimaryLanguage] = useState("Spanish");
  const [languageProficiencies, setLanguageProficiencies] = useState([]);

  // New language addition input state
  const [newLangName, setNewLangName] = useState("");
  const [newLangProficiency, setNewLangProficiency] = useState("Advanced");
  const [newLangSource, setNewLangSource] = useState("English");
  const [newLangBidirectional, setNewLangBidirectional] = useState(true);
  const [langError, setLangError] = useState("");

  // Availability states
  const [availabilityStatus, setAvailabilityStatus] = useState("Available");
  const [workingDays, setWorkingDays] = useState(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState(["09:00 AM - 01:00 PM", "02:00 PM - 06:00 PM"]);
  const [customSlotInput, setCustomSlotInput] = useState("");
  const [timeZone, setTimeZone] = useState("UTC");

  const photoInputRef = useRef(null);
  const docInputRef = useRef(null);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 4500);
  };

  // Load Profile from backend
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchInterpreterProfile();
      const p = res.profile || {};

      setOriginalProfile(p);

      setName(p.name || "");
      setEmail(p.email || "");
      setPhone(p.phone || "");
      setGender(p.gender || "");
      setDateOfBirth(p.dateOfBirth || "");
      setInterpreterId(p.interpreterId || "");
      setProfilePhoto(p.profilePhoto || p.avatar || "");
      setQualification(p.qualification || "Certified Medical Interpreter (CMI)");
      setCertificationNumber(p.certificationNumber || "");
      setExperience(p.experience || "");
      setSpecialization(p.specialization || "General Medical Interpretation");
      setBio(p.bio || "");
      setCertificationDocument(p.certificationDocument || null);
      setIsVerified(!!p.isVerified);
      setVerificationStatus(p.status || "approved");

      setPrimaryLanguage(p.primaryLanguage || p.language || "Spanish");

      // Language proficiencies
      if (Array.isArray(p.languageProficiencies) && p.languageProficiencies.length > 0) {
        setLanguageProficiencies(p.languageProficiencies);
      } else if (Array.isArray(p.languages) && p.languages.length > 0) {
        setLanguageProficiencies(
          p.languages.map((l, idx) => ({
            language: l,
            proficiency: idx === 0 ? "Native" : "Advanced",
            sourceLanguage: "English",
            targetLanguage: l,
            bidirectional: true,
          }))
        );
      } else {
        setLanguageProficiencies([
          { language: "Spanish", proficiency: "Native", sourceLanguage: "English", targetLanguage: "Spanish", bidirectional: true },
          { language: "English", proficiency: "Advanced", sourceLanguage: "Spanish", targetLanguage: "English", bidirectional: true },
        ]);
      }

      setAvailabilityStatus(p.availabilityStatus || "Available");
      setWorkingDays(p.workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
      setAvailableTimeSlots(p.availableTimeSlots || ["09:00 AM - 01:00 PM", "02:00 PM - 06:00 PM"]);
      setTimeZone(p.timeZone || "UTC");
    } catch (err) {
      console.error("Error loading interpreter profile:", err);
      setError(err.message || "Failed to load profile details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Handle Photo File Upload
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, or WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile photo must be under 5MB.");
      return;
    }

    try {
      setUploadingPhoto(true);
      setError("");

      // Instant local preview
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setProfilePhoto(uploadEvent.target.result);
      };
      reader.readAsDataURL(file);

      const res = await uploadProfilePhoto(file);
      if (res.photoUrl) {
        setProfilePhoto(res.photoUrl);
        showSuccess("Profile photo updated successfully!");
        if (onProfileUpdated) onProfileUpdated({ profilePhoto: res.photoUrl, avatar: res.photoUrl });
      }
    } catch (err) {
      console.error("Photo upload error:", err);
      setError(err.message || "Failed to upload photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  // Handle Certification Document Upload
  const handleDocSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) {
      setError("Certification document must be a PDF, JPG, or PNG file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Document must be under 10MB.");
      return;
    }

    try {
      setUploadingDoc(true);
      setError("");
      const res = await uploadCertificationDocument(file);
      if (res.certificationDocument) {
        setCertificationDocument(res.certificationDocument);
        showSuccess("Certification document uploaded successfully! Admin verification preserved.");
      }
    } catch (err) {
      console.error("Document upload error:", err);
      setError(err.message || "Failed to upload document.");
    } finally {
      setUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = "";
    }
  };

  // Add Language
  const handleAddLanguage = () => {
    setLangError("");
    const trimmed = newLangName.trim();
    if (!trimmed) {
      setLangError("Please specify or select a language.");
      return;
    }

    const exists = languageProficiencies.some(
      (item) => item.language.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setLangError(`"${trimmed}" is already in your supported languages list.`);
      return;
    }

    const newItem = {
      language: trimmed,
      proficiency: newLangProficiency,
      sourceLanguage: newLangSource.trim() || "English",
      targetLanguage: trimmed,
      bidirectional: newLangBidirectional,
    };

    setLanguageProficiencies((prev) => [...prev, newItem]);
    setNewLangName("");
    setNewLangProficiency("Advanced");
  };

  // Remove Language
  const handleRemoveLanguage = (langNameToRemove) => {
    if (languageProficiencies.length <= 1) {
      setError("At least one supported language is required.");
      return;
    }
    setLanguageProficiencies((prev) =>
      prev.filter((item) => item.language.toLowerCase() !== langNameToRemove.toLowerCase())
    );
  };

  // Update proficiency of an existing language
  const handleProficiencyChange = (langName, newProf) => {
    setLanguageProficiencies((prev) =>
      prev.map((item) =>
        item.language === langName ? { ...item, proficiency: newProf } : item
      )
    );
  };

  // Toggle Day
  const handleToggleDay = (day) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Toggle Time Slot
  const handleToggleTimeSlot = (slot) => {
    setAvailableTimeSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  // Add Custom Time Slot
  const handleAddCustomSlot = () => {
    const val = customSlotInput.trim();
    if (!val) return;
    if (!availableTimeSlots.includes(val)) {
      setAvailableTimeSlots((prev) => [...prev, val]);
    }
    setCustomSlotInput("");
  };

  // Quick Availability Status Toggle
  const handleQuickAvailabilityChange = async (newStatus) => {
    setAvailabilityStatus(newStatus);
    try {
      await updateInterpreterAvailability({ availabilityStatus: newStatus });
      showSuccess(`Status updated to ${newStatus}`);
      if (onProfileUpdated) onProfileUpdated({ availabilityStatus: newStatus });
    } catch (err) {
      console.warn("Could not quick update availability:", err);
    }
  };

  // Reset / Cancel Changes
  const handleCancel = () => {
    if (originalProfile) {
      setName(originalProfile.name || "");
      setPhone(originalProfile.phone || "");
      setGender(originalProfile.gender || "");
      setDateOfBirth(originalProfile.dateOfBirth || "");
      setQualification(originalProfile.qualification || "");
      setCertificationNumber(originalProfile.certificationNumber || "");
      setExperience(originalProfile.experience || "");
      setSpecialization(originalProfile.specialization || "");
      setBio(originalProfile.bio || "");
      setPrimaryLanguage(originalProfile.primaryLanguage || originalProfile.language || "Spanish");
      setLanguageProficiencies(originalProfile.languageProficiencies || []);
      setAvailabilityStatus(originalProfile.availabilityStatus || "Available");
      setWorkingDays(originalProfile.workingDays || []);
      setAvailableTimeSlots(originalProfile.availableTimeSlots || []);
      setTimeZone(originalProfile.timeZone || "UTC");
      setError("");
      setLangError("");
    }
  };

  // Save All Changes
  const handleSaveChanges = async (e) => {
    if (e) e.preventDefault();

    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }

    if (languageProficiencies.length === 0) {
      setError("At least one supported language is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        gender: gender.trim(),
        dateOfBirth: dateOfBirth.trim(),
        qualification: qualification.trim(),
        certificationNumber: certificationNumber.trim(),
        experience: experience.trim(),
        specialization: specialization.trim(),
        bio: bio.trim(),
        primaryLanguage: primaryLanguage.trim(),
        languages: languageProficiencies.map((item) => item.language),
        languageProficiencies,
        availabilityStatus,
        workingDays,
        availableTimeSlots,
        timeZone,
      };

      const res = await updateInterpreterProfile(payload);
      setOriginalProfile(res.profile);
      showSuccess("Interpreter profile saved successfully!");

      if (onProfileUpdated) {
        onProfileUpdated(res.profile);
      }
    } catch (err) {
      console.error("Error saving interpreter profile:", err);
      setError(err.message || "Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "360px", gap: "16px" }}>
        <Loader2 size={36} className="spinner" style={{ color: "#6366f1" }} />
        <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>
          Loading your verified interpreter credentials...
        </span>
      </div>
    );
  }

  return (
    <div className="interpreter-profile-page" style={{ maxWidth: "1060px", margin: "0 auto", paddingBottom: "80px" }}>
      {/* Toast Alert */}
      {successMessage && (
        <div
          className="toast-notification"
          style={{
            position: "fixed",
            top: "84px",
            right: "24px",
            zIndex: 9999,
            background: "#ffffff",
            border: "1.5px solid #10b981",
            boxShadow: "0 10px 25px rgba(16, 185, 129, 0.2)",
            borderRadius: "12px",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <CheckCircle2 size={20} style={{ color: "#10b981" }} />
          <span style={{ fontWeight: "600", color: "#065f46", fontSize: "14px" }}>
            {successMessage}
          </span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          className="auth-alert alert-error"
          style={{
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderRadius: "10px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: "14px", fontWeight: "500" }}>{error}</span>
          </div>
          <button
            onClick={() => setError("")}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "#991b1b" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div
        className="profile-hero-card"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
          borderRadius: "18px",
          padding: "28px",
          color: "#ffffff",
          boxShadow: "0 10px 30px rgba(49, 46, 129, 0.25)",
          marginBottom: "24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-30px",
            right: "-30px",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.05)",
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          {/* Avatar with Upload Trigger */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: "96px",
                height: "96px",
                borderRadius: "50%",
                background: "#4f46e5",
                border: "4px solid rgba(255, 255, 255, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
              }}
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Languages size={42} style={{ color: "#ffffff" }} />
              )}
            </div>

            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              title="Upload new profile photo"
              style={{
                position: "absolute",
                bottom: "0",
                right: "0",
                background: "#6366f1",
                border: "2px solid #ffffff",
                color: "#ffffff",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
                transition: "transform 0.2s ease",
              }}
            >
              {uploadingPhoto ? <Loader2 size={15} className="spinner" /> : <Camera size={15} />}
            </button>
            <input
              type="file"
              ref={photoInputRef}
              onChange={handlePhotoSelect}
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: "none" }}
            />
          </div>

          {/* Identity Meta */}
          <div style={{ flex: 1, minWidth: "260px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#ffffff" }}>
                {name || "Interpreter Profile"}
              </h2>

              <span
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(6px)",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600",
                  letterSpacing: "0.5px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Lock size={12} />
                <span>{interpreterId || `INT-${String(email).slice(0, 4).toUpperCase()}`}</span>
              </span>
            </div>

            <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#c7d2fe" }}>
              {qualification || "Certified Medical Interpreter"} &bull; {specialization || "Clinical Relay Specialist"}
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              {isVerified || verificationStatus === "approved" ? (
                <span
                  style={{
                    background: "rgba(16, 185, 129, 0.25)",
                    color: "#6ee7b7",
                    border: "1px solid rgba(16, 185, 129, 0.5)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <ShieldCheck size={14} />
                  <span>Certified Medical Interpreter</span>
                </span>
              ) : (
                <span
                  style={{
                    background: "rgba(245, 158, 11, 0.25)",
                    color: "#fde68a",
                    border: "1px solid rgba(245, 158, 11, 0.5)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Clock size={14} />
                  <span>Admin Review Pending</span>
                </span>
              )}

              <span style={{ fontSize: "13px", color: "#e0e7ff" }}>
                Primary: <strong>{primaryLanguage}</strong> &bull; ({languageProficiencies.length} Active Languages)
              </span>
            </div>
          </div>

          {/* Quick Availability Status Selector in Banner */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(8px)",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#94a3b8", fontWeight: "700" }}>
              Current Availability
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              {["Available", "Busy", "Offline"].map((statusOption) => (
                <button
                  key={statusOption}
                  type="button"
                  onClick={() => handleQuickAvailabilityChange(statusOption)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "600",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    background:
                      availabilityStatus === statusOption
                        ? statusOption === "Available"
                          ? "#10b981"
                          : statusOption === "Busy"
                          ? "#f59e0b"
                          : "#64748b"
                        : "rgba(255, 255, 255, 0.1)",
                    color: "#ffffff",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background:
                        statusOption === "Available"
                          ? "#4ade80"
                          : statusOption === "Busy"
                          ? "#fbbf24"
                          : "#cbd5e1",
                    }}
                  />
                  <span>{statusOption}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveChanges}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* SECTION 1: Personal Information */}
          <div
            className="profile-card-section"
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px", paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#eef2ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>
                  Personal Information
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Your personal identity and contact info displayed to clinical coordinators
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
              {/* Full Name */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Full Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <User size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "#94a3b8" }} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Carlos Mendez"
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 38px",
                      borderRadius: "8px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Email Address (Read-Only) */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Email Address <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "400" }}>(Login identifier &bull; Read-only)</span>
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "#94a3b8" }} />
                  <input
                    type="email"
                    readOnly
                    disabled
                    value={email}
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 38px",
                      borderRadius: "8px",
                      border: "1.5px solid #e2e8f0",
                      background: "#f8fafc",
                      color: "#64748b",
                      fontSize: "14px",
                      boxSizing: "border-box",
                      cursor: "not-allowed",
                    }}
                  />
                  <Lock size={14} style={{ position: "absolute", right: "12px", top: "13px", color: "#94a3b8" }} />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Phone Number
                </label>
                <div style={{ position: "relative" }}>
                  <Phone size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "#94a3b8" }} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 019-2834"
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 38px",
                      borderRadius: "8px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Gender <span style={{ fontSize: "11px", color: "#94a3b8" }}>(Optional)</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                    background: "#ffffff",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Date of Birth <span style={{ fontSize: "11px", color: "#94a3b8" }}>(Optional)</span>
                </label>
                <div style={{ position: "relative" }}>
                  <Calendar size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "#94a3b8" }} />
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 38px",
                      borderRadius: "8px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Professional Information */}
          <div
            className="profile-card-section"
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px", paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#f0fdf4", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Award size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>
                  Professional Credentials & Background
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Accredited qualifications, specialty fields, and verification documents
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
              {/* System Interpreter ID */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Interpreter ID <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "400" }}>(System-Generated &bull; Read-only)</span>
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={interpreterId}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1.5px solid #e2e8f0",
                    background: "#f8fafc",
                    color: "#475569",
                    fontWeight: "600",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    cursor: "not-allowed",
                  }}
                />
              </div>

              {/* Qualification / Certification */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Professional Qualification / Certification
                </label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g. Certified Medical Interpreter (CMI), CoreCHI"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Certification Number */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Certification / License Number <span style={{ fontSize: "11px", color: "#94a3b8" }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  value={certificationNumber}
                  onChange={(e) => setCertificationNumber(e.target.value)}
                  placeholder="e.g. CMI-849102-SP"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Years of Experience */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Years of Interpreting Experience
                </label>
                <input
                  type="text"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g. 8 years clinical interpreting"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Specialization */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Primary Clinical Specialization
                </label>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <select
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: "260px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "14px",
                      background: "#ffffff",
                      outline: "none",
                    }}
                  >
                    {SPECIALIZATIONS.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                    <option value="Other">Other Specialty (Type in Bio)</option>
                  </select>
                </div>
              </div>

              {/* Professional Bio */}
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>
                    Short Professional Bio
                  </label>
                  <span style={{ fontSize: "11px", color: bio.length > 450 ? "#ef4444" : "#94a3b8" }}>
                    {bio.length} / 500 characters
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Summarize your healthcare interpreting expertise, clinical settings served, and patient communication philosophy..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                    fontFamily: "inherit",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Certification Document Upload Dropzone */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Accreditation / Certification Document <span style={{ fontSize: "11px", color: "#64748b" }}>(PDF, JPG, or PNG &bull; Max 10MB)</span>
                </label>

                {certificationDocument && certificationDocument.fileUrl ? (
                  <div
                    style={{
                      padding: "14px 18px",
                      borderRadius: "10px",
                      border: "1.5px solid #bbf7d0",
                      background: "#f0fdf4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      marginBottom: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <FileText size={24} style={{ color: "#16a34a" }} />
                      <div>
                        <strong style={{ display: "block", fontSize: "13.5px", color: "#14532d" }}>
                          {certificationDocument.originalName || certificationDocument.fileName || "Verified Certification"}
                        </strong>
                        <span style={{ fontSize: "11.5px", color: "#15803d" }}>
                          Uploaded {certificationDocument.uploadedAt ? new Date(certificationDocument.uploadedAt).toLocaleDateString() : "Active"} &bull; Verified by HealTalk Clinical Admin
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <a
                        href={certificationDocument.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          background: "#ffffff",
                          border: "1px solid #86efac",
                          color: "#15803d",
                          fontSize: "12px",
                          fontWeight: "600",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <ExternalLink size={13} />
                        <span>View Document</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => docInputRef.current?.click()}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          background: "#16a34a",
                          border: "none",
                          color: "#ffffff",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        Replace
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => docInputRef.current?.click()}
                    style={{
                      border: "2px dashed #cbd5e1",
                      borderRadius: "10px",
                      padding: "24px 16px",
                      textAlign: "center",
                      background: "#f8fafc",
                      cursor: "pointer",
                      transition: "border-color 0.2s ease",
                    }}
                  >
                    {uploadingDoc ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                        <Loader2 size={24} className="spinner" style={{ color: "#4f46e5" }} />
                        <span style={{ fontSize: "13px", color: "#4f46e5", fontWeight: "600" }}>
                          Uploading and hashing document...
                        </span>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} style={{ color: "#64748b", margin: "0 auto 8px auto" }} />
                        <p style={{ margin: "0 0 4px 0", fontSize: "13.5px", fontWeight: "600", color: "#1e293b" }}>
                          Click to upload your medical interpreter certification document
                        </p>
                        <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                          PDF, JPEG, or PNG up to 10MB. Transmitted over encrypted channel for administrator verification.
                        </span>
                      </>
                    )}
                  </div>
                )}

                <input
                  type="file"
                  ref={docInputRef}
                  onChange={handleDocSelect}
                  accept="application/pdf,image/jpeg,image/png"
                  style={{ display: "none" }}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Language Preferences & Dynamic Proficiencies */}
          <div
            className="profile-card-section"
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px", paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#fdf4ff", color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Languages size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>
                  Language Preferences & Fluency
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Manage languages you translate between. Requires at least one supported language.
                </span>
              </div>
            </div>

            {/* Primary Language */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                Primary Native / Working Language <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                value={primaryLanguage}
                onChange={(e) => setPrimaryLanguage(e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "14px",
                  background: "#ffffff",
                  outline: "none",
                }}
              >
                {COMMON_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Supported Language Chips */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "8px" }}>
                Active Supported Languages ({languageProficiencies.length})
              </label>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {languageProficiencies.map((item) => (
                  <div
                    key={item.language}
                    style={{
                      background: "#f8fafc",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "13.5px", color: "#0f172a", display: "block" }}>
                        {item.language}
                      </strong>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                        <select
                          value={item.proficiency}
                          onChange={(e) => handleProficiencyChange(item.language, e.target.value)}
                          style={{
                            fontSize: "11px",
                            fontWeight: "600",
                            border: "1px solid #cbd5e1",
                            borderRadius: "4px",
                            padding: "2px 4px",
                            background:
                              item.proficiency === "Native"
                                ? "#dcfce7"
                                : item.proficiency === "Advanced"
                                ? "#e0e7ff"
                                : item.proficiency === "Intermediate"
                                ? "#fef3c7"
                                : "#f1f5f9",
                            color:
                              item.proficiency === "Native"
                                ? "#15803d"
                                : item.proficiency === "Advanced"
                                ? "#4338ca"
                                : item.proficiency === "Intermediate"
                                ? "#b45309"
                                : "#475569",
                            cursor: "pointer",
                          }}
                        >
                          <option value="Basic">Basic</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                          <option value="Native">Native</option>
                        </select>

                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                          {item.bidirectional ? "English ↔ " + item.language : "English → " + item.language}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(item.language)}
                      disabled={languageProficiencies.length <= 1}
                      title={languageProficiencies.length <= 1 ? "At least one language is required" : "Remove language"}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: languageProficiencies.length <= 1 ? "#cbd5e1" : "#ef4444",
                        cursor: languageProficiencies.length <= 1 ? "not-allowed" : "pointer",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Language Form Drawer */}
            <div
              style={{
                background: "#faf5ff",
                border: "1.5px dashed #d8b4fe",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#6b21a8", display: "block", marginBottom: "10px" }}>
                Add New Language & Relay Proficiency
              </span>

              {langError && (
                <div style={{ color: "#dc2626", fontSize: "12px", marginBottom: "8px", fontWeight: "600" }}>
                  {langError}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", alignItems: "flex-end" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Language Name
                  </label>
                  <input
                    type="text"
                    list="languages-list"
                    value={newLangName}
                    onChange={(e) => setNewLangName(e.target.value)}
                    placeholder="Type or pick language..."
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      background: "#ffffff",
                      boxSizing: "border-box",
                    }}
                  />
                  <datalist id="languages-list">
                    {COMMON_LANGUAGES.map((l) => (
                      <option key={l} value={l} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Proficiency Level
                  </label>
                  <select
                    value={newLangProficiency}
                    onChange={(e) => setNewLangProficiency(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      background: "#ffffff",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="Basic">Basic</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Native">Native</option>
                  </select>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingBottom: "8px" }}>
                  <input
                    type="checkbox"
                    id="bidirectional-chk"
                    checked={newLangBidirectional}
                    onChange={(e) => setNewLangBidirectional(e.target.checked)}
                  />
                  <label htmlFor="bidirectional-chk" style={{ fontSize: "12px", color: "#475569", cursor: "pointer" }}>
                    Bidirectional relay (↔)
                  </label>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleAddLanguage}
                    style={{
                      width: "100%",
                      padding: "9px 14px",
                      borderRadius: "6px",
                      border: "none",
                      background: "#7c3aed",
                      color: "#ffffff",
                      fontWeight: "600",
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <Plus size={15} />
                    <span>Add Language</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Availability & Working Hours */}
          <div
            className="profile-card-section"
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px", paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#ecfeff", color: "#0891b2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>
                  Availability & Shift Schedule
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Controls whether you receive incoming telehealth translation requests
                </span>
              </div>
            </div>

            {/* 3 Availability Cards */}
            <div style={{ marginBottom: "22px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "10px" }}>
                Availability Status
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                {[
                  {
                    key: "Available",
                    label: "Available",
                    desc: "Eligible for live requests and matching",
                    color: "#10b981",
                    bg: "#f0fdf4",
                    border: "#86efac",
                  },
                  {
                    key: "Busy",
                    label: "Busy",
                    desc: "In session or on a break. Requests paused.",
                    color: "#f59e0b",
                    bg: "#fffbeb",
                    border: "#fde68a",
                  },
                  {
                    key: "Offline",
                    label: "Offline",
                    desc: "Off shift. Ineligible for new requests.",
                    color: "#64748b",
                    bg: "#f8fafc",
                    border: "#cbd5e1",
                  },
                ].map((item) => {
                  const isSelected = availabilityStatus === item.key;
                  return (
                    <div
                      key={item.key}
                      onClick={() => setAvailabilityStatus(item.key)}
                      style={{
                        padding: "14px",
                        borderRadius: "10px",
                        border: isSelected ? `2px solid ${item.color}` : "1.5px solid #e2e8f0",
                        background: isSelected ? item.bg : "#ffffff",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                      }}
                    >
                      <input
                        type="radio"
                        name="availability-radio"
                        checked={isSelected}
                        onChange={() => setAvailabilityStatus(item.key)}
                        style={{ marginTop: "3px" }}
                      />
                      <div>
                        <strong style={{ fontSize: "14px", color: "#0f172a", display: "block" }}>
                          {item.label}
                        </strong>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          {item.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Preferred Working Days */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "8px" }}>
                Preferred Working Days
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {DAYS_OF_WEEK.map((day) => {
                  const isChecked = workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleDay(day)}
                      style={{
                        padding: "7px 14px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "600",
                        border: isChecked ? "1.5px solid #4f46e5" : "1.5px solid #cbd5e1",
                        background: isChecked ? "#eef2ff" : "#ffffff",
                        color: isChecked ? "#4f46e5" : "#475569",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Available Time Slots */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "8px" }}>
                Available Shift Time Slots
              </label>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                {PRESET_TIME_SLOTS.map((slot) => {
                  const isSelected = availableTimeSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleToggleTimeSlot(slot)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        fontWeight: "500",
                        border: isSelected ? "1.5px solid #0891b2" : "1.5px solid #e2e8f0",
                        background: isSelected ? "#ecfeff" : "#f8fafc",
                        color: isSelected ? "#0e7490" : "#475569",
                        cursor: "pointer",
                      }}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {slot}
                    </button>
                  );
                })}
              </div>

              {/* Custom Slot Addition */}
              <div style={{ display: "flex", gap: "8px", maxWidth: "380px" }}>
                <input
                  type="text"
                  value={customSlotInput}
                  onChange={(e) => setCustomSlotInput(e.target.value)}
                  placeholder="Custom e.g. 10:00 AM - 02:00 PM"
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomSlot}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    background: "#0891b2",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "12.5px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Add Slot
                </button>
              </div>
            </div>

            {/* Time Zone */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                Time Zone
              </label>
              <select
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: "450px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "14px",
                  background: "#ffffff",
                  outline: "none",
                }}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sticky Bottom Action Bar */}
          <div
            style={{
              position: "sticky",
              bottom: "16px",
              zIndex: 10,
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              padding: "16px 24px",
              borderRadius: "14px",
              border: "1px solid #cbd5e1",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Status: <strong style={{ color: availabilityStatus === "Available" ? "#10b981" : "#f59e0b" }}>{availabilityStatus}</strong>
              </span>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "1.5px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <RotateCcw size={15} />
                <span>Cancel</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "10px 24px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#4f46e5",
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: saving ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default InterpreterProfile;
