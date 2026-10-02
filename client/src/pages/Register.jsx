import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import {
  User,
  Mail,
  Lock,
  UserPlus,
  Globe,
  Stethoscope,
  Languages,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Phone,
  GraduationCap,
  Award,
  Building,
  FileCheck,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Headphones,
  Check,
  ShieldCheck,
  Sparkles,
  Plus,
} from "lucide-react";

const LANGUAGE_OPTIONS = [
  "English",
  "Spanish",
  "French",
  "German",
  "Hindi",
  "Tamil",
  "Telugu",
  "Bengali",
  "Mandarin",
  "Arabic",
  "Portuguese",
  "Russian",
];

const SPECIALIZATION_OPTIONS = [
  "General Physician",
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "Psychiatry",
  "Gynecology",
  "Ophthalmology",
  "ENT Specialist",
  "Endocrinology",
  "Pulmonology",
];

function Register() {
  const [searchParams, setSearchParams] = useSearchParams();
  const roleFromUrl = searchParams.get("role");

  // Determine initial step: if role is specified in URL, jump directly to form; otherwise show role selection
  const [selectedRole, setSelectedRole] = useState(
    roleFromUrl && ["patient", "doctor", "interpreter"].includes(roleFromUrl)
      ? roleFromUrl
      : null
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: roleFromUrl || "patient",
    language: "English",
    phone: "",
    specialization: "General Physician",
    qualification: "",
    experience: "",
    licenseNumber: "",
    hospital: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interpreterLanguages, setInterpreterLanguages] = useState(["English", "Tamil"]);

  const { register } = useAuth();
  const navigate = useNavigate();

  const toggleInterpreterLanguage = (lang) => {
    setInterpreterLanguages((prev) => {
      if (prev.includes(lang)) {
        return prev.filter((l) => l !== lang);
      } else {
        return [...prev, lang];
      }
    });
    if (error) setError("");
  };

  // Sync role if URL param changes
  useEffect(() => {
    if (roleFromUrl && ["patient", "doctor", "interpreter"].includes(roleFromUrl)) {
      setSelectedRole(roleFromUrl);
      setFormData((prev) => ({ ...prev, role: roleFromUrl }));
    }
  }, [roleFromUrl]);

  const handleSelectRoleCard = (role) => {
    setSelectedRole(role);
    setFormData((prev) => ({ ...prev, role }));
    setSearchParams({ role });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToRoleSelection = () => {
    setSelectedRole(null);
    setSearchParams({});
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError("Please fill in all basic required fields.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    // Additional validations for doctor registration
    if (formData.role === "doctor") {
      if (!formData.qualification.trim() || !formData.licenseNumber.trim()) {
        setError("Please provide your medical qualification and registration license number.");
        return;
      }
    }

    // Additional validations for interpreter registration
    if (formData.role === "interpreter") {
      if (interpreterLanguages.length < 2) {
        setError("Please select at least 2 languages known for interpreter registration.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        language:
          formData.role === "interpreter"
            ? interpreterLanguages.join(", ")
            : formData.language,
      };
      const response = await register(payload);
      setSuccess(
        formData.role === "doctor"
          ? "Doctor registration submitted! Your application is pending admin verification. Redirecting to login..."
          : response.message || "Registration successful! Redirecting to login..."
      );

      setTimeout(() => {
        navigate(`/login?role=${formData.role}`);
      }, 1600);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      <Navbar />

      <main className="auth-main">
        {/* ====================================================================
            STEP 1: ROLE SELECTION VIEW (How will you use HealTalk?)
            ==================================================================== */}
        {!selectedRole ? (
          <div className="role-selection-wrapper">
            <div className="role-selection-header">
              <div className="role-selection-badge">
                <span className="badge-pulse-dot"></span>
                <span>Get Started with HealTalk</span>
              </div>
              <h1 className="role-selection-title">How will you use HealTalk?</h1>
              <p className="role-selection-subtitle">
                Select your account type to personalize your multilingual healthcare and telemedicine experience.
              </p>
            </div>

            <div className="role-cards-grid">
              {/* CARD 1: PATIENT */}
              <div
                className="role-card card-patient"
                onClick={() => handleSelectRoleCard("patient")}
                id="role-card-patient"
              >
                <div className="role-card-top">
                  <div className="role-avatar-circle icon-bg-patient">
                    <User size={32} />
                  </div>
                  <span className="role-tag-pill tag-patient">For Patients</span>
                </div>

                <div className="role-card-content">
                  <h3 className="role-card-title">👤 Patient</h3>
                  <p className="role-card-desc">
                    Find doctors, book appointments and get healthcare support.
                  </p>

                  <ul className="role-benefits-list">
                    <li>
                      <Check size={16} className="text-teal" />
                      <span>3-Way multilingual teleconsultations</span>
                    </li>
                    <li>
                      <Check size={16} className="text-teal" />
                      <span>Find licensed doctors & specialists</span>
                    </li>
                    <li>
                      <Check size={16} className="text-teal" />
                      <span>Prescriptions & digital health records</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  className="role-action-btn btn-patient"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectRoleCard("patient");
                  }}
                >
                  <span>Continue as Patient</span>
                  <ArrowRight size={18} />
                </button>
              </div>

              {/* CARD 2: DOCTOR */}
              <div
                className="role-card card-doctor featured-role"
                onClick={() => handleSelectRoleCard("doctor")}
                id="role-card-doctor"
              >
                <div className="role-badge-popular">Medical Provider</div>
                <div className="role-card-top">
                  <div className="role-avatar-circle icon-bg-doctor">
                    <Stethoscope size={32} />
                  </div>
                  <span className="role-tag-pill tag-doctor">For Physicians</span>
                </div>

                <div className="role-card-content">
                  <h3 className="role-card-title">🩺 Doctor</h3>
                  <p className="role-card-desc">
                    Connect with patients and manage your consultations.
                  </p>

                  <ul className="role-benefits-list">
                    <li>
                      <Check size={16} className="text-teal" />
                      <span>Dedicated clinical queue & appointments</span>
                    </li>
                    <li>
                      <Check size={16} className="text-teal" />
                      <span>1-Click live interpreter collaboration</span>
                    </li>
                    <li>
                      <Check size={16} className="text-teal" />
                      <span>Issue e-prescriptions & clinical orders</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  className="role-action-btn btn-doctor"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectRoleCard("doctor");
                  }}
                >
                  <span>Continue as Doctor</span>
                  <ArrowRight size={18} />
                </button>
              </div>

              {/* CARD 3: INTERPRETER */}
              <div
                className="role-card card-interpreter"
                onClick={() => handleSelectRoleCard("interpreter")}
                id="role-card-interpreter"
              >
                <div className="role-card-top">
                  <div className="role-avatar-circle icon-bg-interpreter">
                    <Languages size={32} />
                  </div>
                  <span className="role-tag-pill tag-interpreter">For Interpreters</span>
                </div>

                <div className="role-card-content">
                  <h3 className="role-card-title">🌐 Interpreter</h3>
                  <p className="role-card-desc">
                    Help patients and doctors communicate across languages.
                  </p>

                  <ul className="role-benefits-list">
                    <li>
                      <Check size={16} className="text-teal" />
                      <span>Live session request queue & alerts</span>
                    </li>
                    <li>
                      <Check size={16} className="text-teal" />
                      <span>Support 50+ language translations</span>
                    </li>
                    <li>
                      <Check size={16} className="text-teal" />
                      <span>Specialized medical vocabulary tools</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  className="role-action-btn btn-interpreter"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectRoleCard("interpreter");
                  }}
                >
                  <span>Continue as Interpreter</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            {/* Bottom Login Link */}
            <div className="role-selection-footer">
              <p>
                Already have an account?{" "}
                <Link to="/login" className="auth-redirect-link">
                  Log in here
                </Link>
              </p>
            </div>
          </div>
        ) : (
          /* ====================================================================
              STEP 2: REGISTRATION FORM WITH PRE-SELECTED ROLE
              ==================================================================== */
          <div className="auth-card register-card animate-fade-in">
            {/* Top Navigation Back to Role Selection */}
            <div className="form-top-nav">
              <button
                type="button"
                className="btn-back-role"
                onClick={handleBackToRoleSelection}
                title="Change selected role"
              >
                <ArrowLeft size={16} />
                <span>Change Role</span>
              </button>

              <div className={`selected-role-pill pill-${formData.role}`}>
                {formData.role === "patient" && <User size={14} />}
                {formData.role === "doctor" && <Stethoscope size={14} />}
                {formData.role === "interpreter" && <Languages size={14} />}
                <span>
                  {formData.role === "patient" && "Patient Account"}
                  {formData.role === "doctor" && "Doctor Application"}
                  {formData.role === "interpreter" && "Interpreter Account"}
                </span>
              </div>
            </div>

            <div className="auth-header">
              <div className={`auth-icon-wrapper icon-bg-${formData.role}`}>
                {formData.role === "patient" && <UserPlus size={28} />}
                {formData.role === "doctor" && <Stethoscope size={28} />}
                {formData.role === "interpreter" && <Globe size={28} />}
              </div>
              <h2>
                {formData.role === "patient" && "Create Patient Account"}
                {formData.role === "doctor" && "Doctor Registration"}
                {formData.role === "interpreter" && "Interpreter Registration"}
              </h2>
              <p>
                {formData.role === "patient" &&
                  "Access secure multilingual care and consult with verified doctors"}
                {formData.role === "doctor" &&
                  "Join our telemedicine network to consult with patients globally"}
                {formData.role === "interpreter" &&
                  "Connect patients and physicians with real-time medical interpretation"}
              </p>
            </div>

            {error && (
              <div className="auth-alert alert-error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="auth-alert alert-success">
                <CheckCircle2 size={18} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {/* Basic Info */}
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <div className="input-with-icon">
                  <User className="input-icon" size={18} />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder={
                      formData.role === "doctor"
                        ? "Dr. Sarah Jenkins"
                        : formData.role === "interpreter"
                        ? "Priya Sharma"
                        : "Jane Doe"
                    }
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-with-icon">
                  <Mail className="input-icon" size={18} />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-with-icon">
                  <Lock className="input-icon" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="Create a strong password (min 6 chars)"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <div className="input-with-icon">
                  <Phone className="input-icon" size={18} />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="+1 (555) 234-5678"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* LANGUAGE SELECTION: MULTI-SELECT FOR INTERPRETER (MIN 2), SINGLE SELECT FOR OTHERS */}
              {formData.role === "interpreter" ? (
                <div className="form-group">
                  <div className="label-with-badge">
                    <label>Languages Known (Minimum 2 required)</label>
                    <span
                      className={`count-indicator-pill ${
                        interpreterLanguages.length >= 2 ? "valid" : "warning"
                      }`}
                    >
                      {interpreterLanguages.length}{" "}
                      {interpreterLanguages.length === 1 ? "language" : "languages"} selected
                    </span>
                  </div>

                  <div className="languages-chip-grid">
                    {LANGUAGE_OPTIONS.map((lang) => {
                      const isSelected = interpreterLanguages.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          className={`lang-chip ${isSelected ? "selected" : ""}`}
                          onClick={() => toggleInterpreterLanguage(lang)}
                          disabled={isSubmitting}
                        >
                          {isSelected ? <Check size={14} /> : <Plus size={14} />}
                          <span>{lang}</span>
                        </button>
                      );
                    })}
                  </div>

                  {interpreterLanguages.length < 2 && (
                    <span className="field-hint-warning">
                      * Please select at least 2 languages you are proficient in for interpretation.
                    </span>
                  )}
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="language">Preferred Language</label>
                  <div className="input-with-icon">
                    <Globe className="input-icon" size={18} />
                    <select
                      id="language"
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="select-input"
                    >
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* DOCTOR SPECIFIC FIELDS */}
              {formData.role === "doctor" && (
                <>
                  <div className="form-group">
                    <label htmlFor="specialization">Medical Specialization</label>
                    <div className="input-with-icon">
                      <Briefcase className="input-icon" size={18} />
                      <select
                        id="specialization"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="select-input"
                        required
                      >
                        {SPECIALIZATION_OPTIONS.map((spec) => (
                          <option key={spec} value={spec}>
                            {spec}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="qualification">Medical Qualification / Degree</label>
                    <div className="input-with-icon">
                      <GraduationCap className="input-icon" size={18} />
                      <input
                        type="text"
                        id="qualification"
                        name="qualification"
                        placeholder="e.g. MBBS, MD, MS, Board Certified"
                        value={formData.qualification}
                        onChange={handleChange}
                        required={formData.role === "doctor"}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="experience">Years of Clinical Experience</label>
                    <div className="input-with-icon">
                      <Award className="input-icon" size={18} />
                      <input
                        type="text"
                        id="experience"
                        name="experience"
                        placeholder="e.g. 8 years"
                        value={formData.experience}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="licenseNumber">Medical License / Registration Number</label>
                    <div className="input-with-icon">
                      <FileCheck className="input-icon" size={18} />
                      <input
                        type="text"
                        id="licenseNumber"
                        name="licenseNumber"
                        placeholder="e.g. MED-8947201"
                        value={formData.licenseNumber}
                        onChange={handleChange}
                        required={formData.role === "doctor"}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="hospital">Hospital / Clinic Affiliation</label>
                    <div className="input-with-icon">
                      <Building className="input-icon" size={18} />
                      <input
                        type="text"
                        id="hospital"
                        name="hospital"
                        placeholder="e.g. City General Hospital"
                        value={formData.hospital}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <p className="doctor-verification-note">
                    * Doctor registrations require administrative review and verification before consultation access is activated.
                  </p>
                </>
              )}

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="btn-spinner-content">
                    <span className="mini-spinner"></span> Submitting Application...
                  </span>
                ) : formData.role === "doctor" ? (
                  "Submit Doctor Application"
                ) : formData.role === "interpreter" ? (
                  "Create Interpreter Account"
                ) : (
                  "Create Patient Account"
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Already have an account?{" "}
                <Link
                  to={`/login?role=${formData.role}`}
                  className="auth-redirect-link"
                >
                  Log in here
                </Link>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Register;
