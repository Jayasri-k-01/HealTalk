import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Stethoscope,
  Globe,
  Award,
  GraduationCap,
  Building,
  ShieldCheck,
  Edit3,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  DollarSign,
  Star,
  MapPin,
  Check,
} from "lucide-react";
import {
  mockAvailableSpecializations,
  mockSupportedLanguages,
} from "./profileMockData";
import {
  fetchDoctorProfile,
  updateDoctorProfile,
} from "../../../services/doctorService";

function DoctorProfileTab({ user }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [errors, setErrors] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDoctorProfile();
      if (data && data.doctor) {
        const doc = data.doctor;
        setProfile({
          ...doc,
          name: doc.name || user?.name || "Doctor",
          email: doc.email || user?.email || "",
          phone: doc.phone || user?.phone || "",
          specialty: doc.specialty || doc.specialization || user?.specialization || "General Physician",
          specialization: doc.specialization || doc.specialty || user?.specialization || "General Physician",
          hospital: doc.hospital || doc.hospitalAffiliation || user?.hospital || "HealTalk Medical Network",
          hospitalAffiliation: doc.hospitalAffiliation || doc.hospital || user?.hospital || "HealTalk Medical Network",
          qualification: doc.qualification || user?.qualification || "Doctor of Medicine (MD)",
          experience: doc.experience || doc.experienceYears || user?.experience || "10 years exp",
          experienceYears: doc.experienceYears || doc.experience || user?.experience || "10 years exp",
          licenseNumber: doc.licenseNumber || user?.licenseNumber || "MED-VERIFIED",
          npiNumber: doc.npiNumber || (doc.licenseNumber ? `NPI-${doc.licenseNumber}` : "NPI-VERIFIED"),
          fee: doc.fee || doc.consultationFee || "$45",
          consultationFee: doc.consultationFee || doc.fee || "$45",
          languages: doc.languages || doc.languagesSpoken || [user?.language || "English"],
          languagesSpoken: doc.languagesSpoken || doc.languages || [user?.language || "English"],
          bio: doc.bio || "",
          verificationStatus: doc.verificationStatus || (user?.status === "approved" || user?.isVerified ? "Verified Doctor" : "Pending Verification"),
        });
      } else {
        throw new Error("Invalid profile response from server");
      }
    } catch (err) {
      console.error("Failed to fetch doctor profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const showToast = (msg, type = "success") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenEdit = () => {
    if (!profile) return;
    setEditForm({
      name: profile.name || user?.name || "",
      email: profile.email || user?.email || "",
      phone: profile.phone || user?.phone || "",
      specialization: profile.specialization || profile.specialty || user?.specialization || "General Physician",
      hospitalAffiliation: profile.hospitalAffiliation || profile.hospital || user?.hospital || "",
      consultationFee: profile.consultationFee || profile.fee || "$45",
      languagesSpoken: Array.isArray(profile.languagesSpoken)
        ? profile.languagesSpoken.join(", ")
        : Array.isArray(profile.languages)
        ? profile.languages.join(", ")
        : (profile.languagesSpoken || profile.languages || user?.language || "English"),
      bio: profile.bio || "",
    });
    setErrors({});
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const errs = {};

    if (!editForm.name.trim()) errs.name = "Full name is required";
    if (!editForm.email.trim()) {
      errs.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      errs.email = "Please enter a valid email address";
    }
    if (!editForm.specialization.trim()) {
      errs.specialization = "Specialization is required";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const languagesArray = editForm.languagesSpoken
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const updatePayload = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        specialty: editForm.specialization.trim(),
        specialization: editForm.specialization.trim(),
        hospitalAffiliation: editForm.hospitalAffiliation.trim(),
        hospital: editForm.hospitalAffiliation.trim(),
        consultationFee: editForm.consultationFee.trim(),
        fee: editForm.consultationFee.trim(),
        languagesSpoken: languagesArray.length > 0 ? languagesArray : ["English"],
        languages: languagesArray.length > 0 ? languagesArray : ["English"],
        bio: editForm.bio.trim(),
      };

      const res = await updateDoctorProfile(updatePayload);
      const returnedDoc = res?.doctor || {};

      const mergedUpdatedProfile = {
        ...(profile || {}),
        ...updatePayload,
        ...returnedDoc,
        email: updatePayload.email || returnedDoc.email || profile?.email || "",
        phone: updatePayload.phone || returnedDoc.phone || profile?.phone || "",
        hospitalAffiliation:
          updatePayload.hospitalAffiliation ||
          returnedDoc.hospitalAffiliation ||
          returnedDoc.hospital ||
          profile?.hospitalAffiliation ||
          "",
        hospital:
          updatePayload.hospital ||
          returnedDoc.hospital ||
          returnedDoc.hospitalAffiliation ||
          profile?.hospital ||
          "",
        consultationFee:
          updatePayload.consultationFee ||
          returnedDoc.consultationFee ||
          returnedDoc.fee ||
          profile?.consultationFee ||
          "$45",
        fee:
          updatePayload.fee ||
          returnedDoc.fee ||
          returnedDoc.consultationFee ||
          profile?.fee ||
          "$45",
        specialization:
          updatePayload.specialization ||
          returnedDoc.specialization ||
          returnedDoc.specialty ||
          profile?.specialization ||
          "General Physician",
        specialty:
          updatePayload.specialty ||
          returnedDoc.specialty ||
          returnedDoc.specialization ||
          profile?.specialty ||
          "General Physician",
        languagesSpoken:
          updatePayload.languagesSpoken ||
          returnedDoc.languagesSpoken ||
          returnedDoc.languages ||
          profile?.languagesSpoken ||
          ["English"],
        languages:
          updatePayload.languages ||
          returnedDoc.languages ||
          returnedDoc.languagesSpoken ||
          profile?.languages ||
          ["English"],
        bio:
          updatePayload.bio !== undefined
            ? updatePayload.bio
            : returnedDoc.bio,
      };

      setProfile(mergedUpdatedProfile);
      setIsEditModalOpen(false);
      showToast("Doctor profile updated successfully");
    } catch (err) {
      console.error("Error saving doctor profile:", err);
      showToast(err.message || "Failed to update doctor profile", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="doctor-tab-loading">
        <Loader2 size={32} className="doctor-spin-icon" />
        <p>Loading doctor profile and credentials...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="doctor-tab-loading">
        <AlertCircle size={32} style={{ color: "#ef4444" }} />
        <p style={{ color: "#ef4444" }}>{error}</p>
        <button
          type="button"
          className="doctor-btn-primary"
          style={{ marginTop: "12px" }}
          onClick={loadProfile}
        >
          <RotateCcw size={15} />
          <span>Retry Loading Profile</span>
        </button>
      </div>
    );
  }

  return (
    <div className="doctor-profile-tab">
      {toastMessage && (
        <div className={`doctor-toast ${toastMessage.type === "info" ? "info" : ""}`}>
          <CheckCircle2 size={16} />
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="doctor-tab-header">
        <div className="doctor-tab-title-group">
          <h2>Doctor Profile & Credentials</h2>
          <p>Manage your verified medical profile, multilingual qualifications, and public biography</p>
        </div>
        <button
          type="button"
          className="doctor-btn-primary"
          onClick={handleOpenEdit}
        >
          <Edit3 size={15} />
          <span>Edit Profile</span>
        </button>
      </div>

      <div className="doctor-profile-grid">
        {/* Profile Hero Card */}
        <div className="doctor-card profile-hero-card">
          <div className="hero-banner-inner">
            <div className="hero-avatar-box">
              {profile?.name
                ? profile.name.replace(/^Dr\.\s*/i, "").slice(0, 2).toUpperCase()
                : "DR"}
            </div>
            <div className="hero-text-details">
              <div className="hero-title-row">
                <h3>{profile?.name}</h3>
                <span className="admin-status-tag active">
                  <ShieldCheck size={13} />
                  {profile?.verificationStatus || "Verified Doctor"}
                </span>
              </div>
              <p className="hero-specialty">{profile?.title || profile?.specialization || profile?.specialty}</p>
              <div className="hero-meta-badges">
                <span className="hero-badge">
                  <Stethoscope size={13} /> {profile?.specialization || profile?.specialty}
                </span>
                <span className="hero-badge">
                  <Building size={13} /> {profile?.hospitalAffiliation || profile?.hospital || "HealTalk Network"}
                </span>
                <span className="hero-badge">
                  <Award size={13} /> {profile?.experienceYears || profile?.experience || "10 years exp"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Credentials & Details Cards Split */}
        <div className="doctor-profile-sections-grid">
          {/* Contact & Professional Info Card */}
          <div className="doctor-card">
            <div className="doctor-card-header">
              <div className="doctor-card-title-group">
                <h3>Contact & Practice Details</h3>
                <p>Verified practitioner identifiers</p>
              </div>
            </div>

            <div className="profile-fields-list">
              <div className="profile-field-row">
                <span className="field-label">Email Address</span>
                <div className="field-val">
                  <Mail size={14} className="icon" />
                  <span>{profile?.email}</span>
                </div>
              </div>

              <div className="profile-field-row">
                <span className="field-label">Phone Number</span>
                <div className="field-val">
                  <Phone size={14} className="icon" />
                  <span>{profile?.phone || "Not specified"}</span>
                </div>
              </div>

              <div className="profile-field-row">
                <span className="field-label">Medical License Number</span>
                <div className="field-val">
                  <Award size={14} className="icon" />
                  <span className="code-font">{profile?.licenseNumber || "N/A"}</span>
                </div>
              </div>

              <div className="profile-field-row">
                <span className="field-label">National Provider Identifier (NPI)</span>
                <div className="field-val">
                  <ShieldCheck size={14} className="icon" />
                  <span className="code-font">{profile?.npiNumber || profile?.licenseNumber || "N/A"}</span>
                </div>
              </div>

              <div className="profile-field-row">
                <span className="field-label">Consultation Standard Fee</span>
                <div className="field-val">
                  <DollarSign size={14} className="icon" />
                  <span className="fee-tag">{profile?.consultationFee || profile?.fee || "$45"}</span>
                </div>
              </div>

              <div className="profile-field-row">
                <span className="field-label">Languages Spoken</span>
                <div className="field-val">
                  <Globe size={14} className="icon" />
                  <div className="lang-chips">
                    {(profile?.languagesSpoken || profile?.languages || ["English"]).map((lang) => (
                      <span key={lang} className="lang-chip">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Education & Degrees Card */}
          <div className="doctor-card">
            <div className="doctor-card-header">
              <div className="doctor-card-title-group">
                <h3>Education & Board Certifications</h3>
                <p>Medical credentials verified by HealTalk admin</p>
              </div>
            </div>

            <div className="degrees-list">
              {(profile?.degrees && profile.degrees.length > 0
                ? profile.degrees
                : [
                    {
                      degree: profile?.qualification || "Doctor of Medicine (MD)",
                      institution: profile?.hospitalAffiliation || profile?.hospital || "HealTalk Clinical Network",
                      year: "Verified Practitioner",
                    },
                  ]
              ).map((deg, i) => (
                <div key={i} className="degree-item-row">
                  <div className="degree-icon">
                    <GraduationCap size={18} />
                  </div>
                  <div className="degree-meta">
                    <strong>{deg.degree}</strong>
                    <span>{deg.institution} • {deg.year || "Certified"}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="doctor-card-header mt-4">
              <div className="doctor-card-title-group">
                <h3>About / Professional Biography</h3>
              </div>
            </div>

            <div className="bio-content-box">
              <p>{profile?.bio || "No professional biography provided."}</p>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => !saving && setIsEditModalOpen(false)}>
          <div className="admin-details-modal profile-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>Edit Doctor Profile</h3>
                <p>Update your public contact info, bio, and clinic details</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !saving && setIsEditModalOpen(false)}
                disabled={saving}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="modal-body">
                <div className="settings-form-grid">
                  <div className="settings-input-group">
                    <label htmlFor="doc-name">Full Name <span className="req">*</span></label>
                    <input
                      type="text"
                      id="doc-name"
                      value={editForm.name}
                      onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                      className={`settings-input ${errors.name ? "has-error" : ""}`}
                    />
                    {errors.name && (
                      <span className="settings-error-text">
                        <AlertCircle size={13} /> {errors.name}
                      </span>
                    )}
                  </div>

                  <div className="settings-input-group">
                    <label htmlFor="doc-email">Email Address <span className="req">*</span></label>
                    <input
                      type="email"
                      id="doc-email"
                      value={editForm.email}
                      onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                      className={`settings-input ${errors.email ? "has-error" : ""}`}
                    />
                    {errors.email && (
                      <span className="settings-error-text">
                        <AlertCircle size={13} /> {errors.email}
                      </span>
                    )}
                  </div>

                  <div className="settings-input-group">
                    <label htmlFor="doc-phone">Phone Number</label>
                    <input
                      type="text"
                      id="doc-phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                      className="settings-input"
                    />
                  </div>

                  <div className="settings-input-group">
                    <label htmlFor="doc-spec">Specialization <span className="req">*</span></label>
                    <select
                      id="doc-spec"
                      value={editForm.specialization}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, specialization: e.target.value }))
                      }
                      className="settings-select"
                    >
                      {editForm.specialization &&
                        !mockAvailableSpecializations.includes(editForm.specialization) && (
                          <option value={editForm.specialization}>
                            {editForm.specialization}
                          </option>
                        )}
                      {mockAvailableSpecializations.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="settings-input-group">
                    <label htmlFor="doc-hospital">Hospital Affiliation</label>
                    <input
                      type="text"
                      id="doc-hospital"
                      value={editForm.hospitalAffiliation}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, hospitalAffiliation: e.target.value }))
                      }
                      className="settings-input"
                    />
                  </div>

                  <div className="settings-input-group">
                    <label htmlFor="doc-fee">Consultation Fee</label>
                    <input
                      type="text"
                      id="doc-fee"
                      value={editForm.consultationFee}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, consultationFee: e.target.value }))
                      }
                      className="settings-input"
                    />
                  </div>
                </div>

                <div className="settings-input-group mt-2">
                  <label htmlFor="doc-langs">Languages Spoken (Comma-separated)</label>
                  <input
                    type="text"
                    id="doc-langs"
                    placeholder="e.g. English, Spanish, French..."
                    value={editForm.languagesSpoken}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, languagesSpoken: e.target.value }))
                    }
                    className="settings-input"
                  />
                </div>

                <div className="settings-input-group mt-2">
                  <label htmlFor="doc-bio">Professional Biography</label>
                  <textarea
                    id="doc-bio"
                    rows={4}
                    value={editForm.bio}
                    onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
                    className="settings-input"
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer settings-modal-footer">
                <button
                  type="button"
                  className="doctor-btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="doctor-btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={15} className="doctor-spin-icon" /> : <Save size={15} />}
                  <span>{saving ? "Saving..." : "Save Profile"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorProfileTab;
