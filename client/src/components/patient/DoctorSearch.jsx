import { useState, useEffect } from "react";
import { fetchDoctors, fetchDoctorById } from "../../services/doctorService";
import { bookAppointment } from "../../services/appointmentService";
import {
  Search,
  Filter,
  Star,
  Globe,
  Clock,
  Video,
  User,
  Calendar,
  Languages,
  X,
  Stethoscope,
  ShieldCheck,
  DollarSign,
  AlertCircle,
  Eye,
  Info,
  CheckCircle2,
} from "lucide-react";

const SPECIALTIES = [
  "All Specialties",
  "General Physician",
  "Cardiology",
  "Pediatrics",
  "Dermatology",
  "Neurology",
  "Psychiatry",
  "Orthopedics",
];

const LANGUAGES = [
  "All Languages",
  "English",
  "Spanish",
  "Hindi",
  "French",
  "Mandarin",
  "Tamil",
  "German",
  "Arabic",
];

function DoctorSearch({ user, initialSelectedDoctor }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties");
  const [selectedLanguage, setSelectedLanguage] = useState("All Languages");

  // Profile View Modal State
  const [viewDoctorProfile, setViewDoctorProfile] = useState(null);

  // Booking Modal State
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [bookingTime, setBookingTime] = useState("10:00 AM");
  const [bookingType, setBookingType] = useState("Video Call");
  const [bookingReason, setBookingReason] = useState("");
  const [interpreterRequested, setInterpreterRequested] = useState(false);
  const [interpreterLanguage, setInterpreterLanguage] = useState("Spanish");

  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");

  // Load doctors from MongoDB API
  useEffect(() => {
    loadDoctors();
  }, [searchTerm, selectedSpecialty, selectedLanguage]);

  useEffect(() => {
    if (initialSelectedDoctor) {
      openBookingModal(initialSelectedDoctor);
    }
  }, [initialSelectedDoctor]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchDoctors({
        search: searchTerm,
        specialty: selectedSpecialty,
        language: selectedLanguage,
      });
      setDoctors(res.doctors || []);
    } catch (err) {
      console.error("Error loading doctors from API:", err);
      setError(err.message || "Failed to load doctor directory");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDoctorProfile = async (doc) => {
    setViewDoctorProfile(doc);
    const docId = doc._id || doc.id;
    if (docId) {
      try {
        const res = await fetchDoctorById(docId);
        if (res && res.doctor) {
          setViewDoctorProfile(res.doctor);
        }
      } catch (err) {
        console.warn("Could not fetch detailed doctor profile:", err);
      }
    }
  };

  const openBookingModal = (doc) => {
    setBookingDoctor(doc);
    setBookingDate(new Date(Date.now() + 86400000).toISOString().split("T")[0]);
    const defaultTime =
      doc.availableSlots && doc.availableSlots.length > 0
        ? doc.availableSlots[0]
        : "10:00 AM";
    setBookingTime(defaultTime);
    setBookingType("Video Call");
    setBookingReason("");
    const shouldAutoRequest = !!user?.autoRequestInterpreter;
    setInterpreterRequested(shouldAutoRequest);
    setInterpreterLanguage(user?.language || "Spanish");
    setBookingError("");
    setBookingSuccess("");
    setViewDoctorProfile(null);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!bookingDoctor) return;
    if (!bookingReason.trim()) {
      setBookingError("Please provide a reason for the consultation.");
      return;
    }

    try {
      setBookingSubmitting(true);
      setBookingError("");

      const res = await bookAppointment({
        doctorId: bookingDoctor._id || bookingDoctor.id,
        date: bookingDate,
        time: bookingTime,
        type: bookingType,
        interpreterRequested,
        interpreterLanguage: interpreterRequested ? interpreterLanguage : null,
        reason: bookingReason.trim(),
      });

      const appointment = res.appointment;
      const aptId = appointment?._id
        ? `#${String(appointment._id).substring(0, 8).toUpperCase()}`
        : "";
      const aptStatus = appointment?.status || "Pending";

      setBookingSuccess(
        `Appointment ${aptId} successfully submitted with ${bookingDoctor.name}! Status: ${aptStatus}. Awaiting doctor confirmation.`
      );
      setTimeout(() => {
        setBookingDoctor(null);
        setBookingSuccess("");
      }, 2500);
    } catch (err) {
      console.error("Booking error:", err);
      setBookingError(err.message || "Failed to book appointment");
    } finally {
      setBookingSubmitting(false);
    }
  };

  return (
    <div className="doctor-search-container">
      {/* Search Header & Filter Bar */}
      <div className="search-header-panel">
        <div className="search-title">
          <h2>Find & Discover Multilingual Doctors</h2>
          <p>
            Browse verified healthcare professionals speaking your preferred language, view their profile and available slots
          </p>
        </div>

        <div className="filters-row">
          <div className="search-input-box">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by doctor name, specialty, or bio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchTerm("")}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="filter-select-group">
            <div className="filter-item">
              <Filter size={16} className="filter-icon" />
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
              >
                {SPECIALTIES.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <Globe size={16} className="filter-icon" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count Banner */}
      <div className="results-count-bar">
        <span>
          Showing <strong>{doctors.length}</strong> available doctors
          {selectedLanguage !== "All Languages" && ` speaking ${selectedLanguage}`}
        </span>
      </div>

      {error && (
        <div className="auth-alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Doctors Grid */}
      <div className="doctors-grid">
        {loading ? (
          <div className="empty-appointments-box">
            <div className="spinner"></div>
            <p style={{ marginTop: "12px" }}>Loading verified doctor directory...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="no-results-box">
            <Stethoscope size={40} className="no-res-icon" />
            <h3>No Doctors Found</h3>
            <p>Try adjusting your search criteria or language filters.</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedSpecialty("All Specialties");
                setSelectedLanguage("All Languages");
              }}
              className="reset-filter-btn"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          doctors.map((doc) => (
            <div key={doc._id || doc.id} className="doc-portal-card">
              <div className="doc-card-header">
                <div className="doc-avatar-wrapper">
                  <User size={30} />
                </div>
                <div className="doc-header-info">
                  <h3>{doc.name}</h3>
                  <span className="specialty-badge">{doc.specialty}</span>
                </div>
                <div className="doc-rating-box">
                  <Star size={14} className="star-filled" />
                  <span>{doc.rating || 4.9}</span>
                </div>
              </div>

              <p className="doc-bio-text">{doc.bio}</p>

              <div className="doc-info-list">
                <div className="info-row">
                  <ShieldCheck size={16} className="info-icon" />
                  <span>{doc.experience || "10 years exp"}</span>
                </div>
                <div className="info-row">
                  <Languages size={16} className="info-icon" />
                  <div className="doc-lang-pills">
                    {(doc.languages || ["English"]).map((l) => (
                      <span key={l} className="lang-chip">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="info-row">
                  <DollarSign size={16} className="info-icon" />
                  <span>Consultation Fee: <strong>{doc.fee || "$45"}</strong></span>
                </div>
              </div>

              <div className="doc-card-footer">
                <div className="next-avail-badge">
                  <Clock size={14} />
                  <span>Next: {doc.availableSlots?.[0] || "Today"}</span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleOpenDoctorProfile(doc)}
                    className="book-appointment-btn"
                    style={{ background: "#eaf6f7", color: "#087f8c", border: "1px solid #087f8c" }}
                  >
                    <Eye size={16} />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => openBookingModal(doc)}
                    className="book-appointment-btn"
                  >
                    <Calendar size={16} />
                    <span>Book Visit</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Doctor Profile & Slots Detail Modal */}
      {viewDoctorProfile && (
        <div className="modal-overlay">
          <div className="booking-modal-card" style={{ maxWidth: "580px" }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div className="doc-avatar-wrapper" style={{ width: "54px", height: "54px" }}>
                  <User size={32} />
                </div>
                <div>
                  <h3>{viewDoctorProfile.name}</h3>
                  <span className="specialty-badge">{viewDoctorProfile.specialty}</span>
                </div>
              </div>
              <button
                className="close-modal-btn"
                onClick={() => setViewDoctorProfile(null)}
              >
                <X size={22} />
              </button>
            </div>

            <div className="doc-profile-modal-body" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Doctor Stats Pill Row */}
              <div className="profile-stats-row" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", background: "#f0f7f8", padding: "14px", borderRadius: "12px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "#8aa1a5", display: "block", fontWeight: "600" }}>EXPERIENCE</span>
                  <strong style={{ fontSize: "14px", color: "#173b42" }}>{viewDoctorProfile.experience || "10 years exp"}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#8aa1a5", display: "block", fontWeight: "600" }}>FEE</span>
                  <strong style={{ fontSize: "14px", color: "#087f8c" }}>{viewDoctorProfile.fee || "$45"}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#8aa1a5", display: "block", fontWeight: "600" }}>RATING</span>
                  <strong style={{ fontSize: "14px", color: "#f59e0b" }}>★ {viewDoctorProfile.rating || 4.9} ({viewDoctorProfile.reviews || 50} reviews)</strong>
                </div>
              </div>

              {/* Bio Section */}
              <div className="profile-sec">
                <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "6px", color: "#173b42", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Info size={16} style={{ color: "#087f8c" }} /> Professional Bio
                </h4>
                <p style={{ fontSize: "14px", color: "#556c70", lineHeight: "1.6" }}>
                  {viewDoctorProfile.bio || "Board-certified healthcare specialist dedicated to providing compassionate telemedicine care across multiple languages."}
                </p>
              </div>

              {/* Languages Spoken */}
              <div className="profile-sec">
                <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px", color: "#173b42", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Languages size={16} style={{ color: "#087f8c" }} /> Languages Spoken
                </h4>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {(Array.isArray(viewDoctorProfile.languages) ? viewDoctorProfile.languages : [viewDoctorProfile.languages || "English"]).map((l) => (
                    <span key={l} style={{ background: "#eaf6f7", color: "#087f8c", padding: "4px 12px", borderRadius: "16px", fontSize: "13px", fontWeight: "600" }}>
                      {l}
                    </span>
                  ))}
                </div>
              </div>

              {/* Available Consultation Slots */}
              <div className="profile-sec">
                <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "10px", color: "#173b42", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={16} style={{ color: "#087f8c" }} /> Available Consultation Slots
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {(viewDoctorProfile.availableSlots && viewDoctorProfile.availableSlots.length > 0 ? viewDoctorProfile.availableSlots : ["Today 4:00 PM", "Tomorrow 10:00 AM", "Tomorrow 3:00 PM"]).map((slot) => (
                    <div key={slot} style={{ background: "#fafcfc", border: "1px solid #d5eaec", padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", color: "#173b42", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Clock size={14} style={{ color: "#16a34a" }} />
                      <span>{slot}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setViewDoctorProfile(null)}
                style={{ flex: "1" }}
              >
                Close
              </button>
              <button
                type="button"
                className="confirm-btn"
                onClick={() => openBookingModal(viewDoctorProfile)}
                style={{ flex: "2" }}
              >
                <Calendar size={16} />
                <span>Book Appointment with {viewDoctorProfile.name.split(" ")[1] || viewDoctorProfile.name}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Booking Modal */}
      {bookingDoctor && (
        <div className="modal-overlay">
          <div className="booking-modal-card" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="doc-avatar-wrapper" style={{ width: "48px", height: "48px" }}>
                  <User size={28} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px" }}>Book Visit with {bookingDoctor.name}</h3>
                  <span className="specialty-badge">{bookingDoctor.specialty} • Fee: {bookingDoctor.fee || "$45"}</span>
                </div>
              </div>
              <button
                className="close-modal-btn"
                onClick={() => setBookingDoctor(null)}
              >
                <X size={22} />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="booking-success-box" style={{ padding: "30px", textAlign: "center" }}>
                <CheckCircle2 size={56} style={{ color: "#10b981", marginBottom: "16px" }} />
                <h3 style={{ color: "#173b42", marginBottom: "8px" }}>Appointment Request Submitted!</h3>
                <p style={{ color: "#556c70", fontSize: "14px" }}>{bookingSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="booking-form" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {bookingError && (
                  <div className="auth-alert alert-error" style={{ margin: 0 }}>
                    <AlertCircle size={18} />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Date Selection */}
                <div className="form-group">
                  <label>Select Consultation Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setBookingDate(e.target.value)}
                    required
                  />
                </div>

                {/* Time Slot Selection */}
                <div className="form-group">
                  <label>Select Time Slot</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                    {(bookingDoctor.availableSlots && bookingDoctor.availableSlots.length > 0
                      ? bookingDoctor.availableSlots
                      : ["09:00 AM", "10:00 AM", "11:30 AM", "02:00 PM", "04:00 PM", "06:00 PM"]
                    ).map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`slot-pill ${bookingTime === slot ? "selected" : ""}`}
                        onClick={() => setBookingTime(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Consultation Type */}
                <div className="form-group">
                  <label>Telemedicine Mode</label>
                  <select
                    value={bookingType}
                    onChange={(e) => setBookingType(e.target.value)}
                  >
                    <option value="Video Call">📹 Video Call (Recommended)</option>
                    <option value="Voice Call">📞 Voice Call</option>
                    <option value="Chat">💬 Chat Consultation</option>
                  </select>
                </div>

                {/* Reason for Visit */}
                <div className="form-group">
                  <label>Reason for Visit / Symptoms</label>
                  <textarea
                    rows={3}
                    placeholder="Describe your health symptoms, medical concern, or routine checkup requirement..."
                    value={bookingReason}
                    onChange={(e) => setBookingReason(e.target.value)}
                    required
                    style={{ resize: "none" }}
                  />
                </div>

                {/* Optional Interpreter Request */}
                <div className="interpreter-option-card" style={{ background: "#f4fbfb", padding: "14px 16px", borderRadius: "12px", border: "1.5px solid #cde8ea" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: "600", color: "#173b42", fontSize: "14px" }}>
                    <input
                      type="checkbox"
                      checked={interpreterRequested}
                      onChange={(e) => setInterpreterRequested(e.target.checked)}
                      style={{ width: "18px", height: "18px", accentColor: "#087f8c" }}
                    />
                    <span>Request Live Medical Interpreter</span>
                  </label>

                  {interpreterRequested && (
                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #d5eaec" }}>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: "#556c70", display: "block", marginBottom: "4px" }}>
                        Preferred Interpreter Language
                      </label>
                      <select
                        value={interpreterLanguage}
                        onChange={(e) => setInterpreterLanguage(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #bce1e4", fontSize: "13px" }}
                      >
                        {LANGUAGES.filter((l) => l !== "All Languages").map((lang) => (
                          <option key={lang} value={lang}>
                            {lang}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="modal-actions" style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setBookingDoctor(null)}
                    disabled={bookingSubmitting}
                    style={{ flex: "1" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="confirm-btn"
                    disabled={bookingSubmitting}
                    style={{ flex: "2" }}
                  >
                    {bookingSubmitting ? "Confirming..." : "Confirm & Book Visit"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorSearch;

