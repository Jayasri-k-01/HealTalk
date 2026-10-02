import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Globe,
  Calendar,
  FileText,
  Eye,
  X,
  Loader2,
  Mail,
  Phone,
  MapPin,
  HeartPulse,
  Activity,
  AlertCircle,
  Clock,
  Plus,
  ArrowRight,
} from "lucide-react";
import { fetchDoctorPatients } from "../../../services/doctorService";

function DoctorPatientsTab({ onNavigateTab }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchDoctorPatients();
      if (data && data.patients) {
        setPatients(data.patients);
      } else {
        setPatients([]);
      }
    } catch (err) {
      console.error("Failed to load doctor patients from MongoDB:", err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const filteredPatients = patients.filter((pat) => {
    const matchesLang =
      languageFilter === "all" ||
      (pat.language || "").toLowerCase() === languageFilter.toLowerCase();

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesLang;

    const matchesName = (pat.name || "").toLowerCase().includes(q);
    const matchesCondition = (pat.primaryCondition || "").toLowerCase().includes(q);
    const matchesEmail = (pat.email || "").toLowerCase().includes(q);
    const matchesId = (pat.id || "").toLowerCase().includes(q);
    const matchesPhone = (pat.phone || "").toLowerCase().includes(q);
    const matchesMeds = Array.isArray(pat.currentMedications) &&
      pat.currentMedications.some((m) =>
        (typeof m === "string" ? m : m.name || "").toLowerCase().includes(q)
      );

    return matchesLang && (matchesName || matchesCondition || matchesEmail || matchesId || matchesPhone || matchesMeds);
  });

  if (loading) {
    return (
      <div className="doctor-tab-loading">
        <Loader2 size={32} className="doctor-spin-icon" />
        <p>Loading patient clinical directory from MongoDB...</p>
      </div>
    );
  }

  return (
    <div className="doctor-patients-tab">
      {/* Header */}
      <div className="doctor-tab-header">
        <div className="doctor-tab-title-group">
          <h2>Patient Directory</h2>
          <p>Review comprehensive health records, past consultations, and prescribed therapies</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="doctor-filter-bar">
        <div className="doctor-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by patient name, condition, or medical ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="doctor-select-filter">
          <Globe size={15} className="select-icon" />
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="settings-select"
          >
            <option value="all">All Languages</option>
            <option value="Spanish">Spanish</option>
            <option value="English">English</option>
            <option value="French">French</option>
            <option value="Mandarin">Mandarin</option>
            <option value="Hindi">Hindi</option>
            <option value="Arabic">Arabic</option>
            <option value="German">German</option>
            <option value="Portuguese">Portuguese</option>
            <option value="Russian">Russian</option>
          </select>
        </div>
      </div>

      {/* Patient Cards Grid */}
      {filteredPatients.length === 0 ? (
        <div className="doctor-card">
          <div className="doctor-empty-state">
            <Users size={40} className="empty-icon" />
            <h4>No patient records found</h4>
            <p>
              {searchQuery || languageFilter !== "all"
                ? "Try adjusting your search criteria or language filter."
                : "Patients who have scheduled appointments or consultations with you will appear in this directory."}
            </p>
          </div>
        </div>
      ) : (
        <div className="doctor-patients-grid">
          {filteredPatients.map((pat) => (
            <div key={pat.id} className="doctor-card patient-card-item">
              <div className="patient-card-header">
                <div className="patient-avatar-box">
                  {pat.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="patient-header-meta">
                  <h4 className="patient-title">{pat.name}</h4>
                  <span className="patient-sub-details">
                    {pat.age ? `${pat.age}y` : ""}
                    {pat.age && pat.gender ? " • " : ""}
                    {pat.gender || ""}
                    {pat.bloodGroup ? ` • Blood: ${pat.bloodGroup}` : ""}
                  </span>
                </div>
                <span className="patient-lang-tag">
                  <Globe size={11} /> {pat.language}
                </span>
              </div>

              <div className="patient-card-body">
                <div className="patient-condition-box">
                  <span className="box-label">Primary Diagnosis / Chief Complaint</span>
                  <p className="box-text">{pat.primaryCondition}</p>
                </div>

                <div className="patient-meta-grid">
                  <div className="meta-block">
                    <span className="label">Total Visits</span>
                    <span className="val">{pat.totalVisits} {pat.totalVisits === 1 ? "session" : "sessions"}</span>
                  </div>
                  <div className="meta-block">
                    <span className="label">Last Consultation</span>
                    <span className="val">{pat.lastVisited}</span>
                  </div>
                </div>
              </div>

              <div className="patient-card-footer">
                <button
                  type="button"
                  className="doctor-btn-secondary doctor-btn-sm w-100"
                  onClick={() => setSelectedPatient(pat)}
                >
                  <Eye size={14} />
                  <span>View Clinical Record</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comprehensive Patient Detail Modal */}
      {selectedPatient && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedPatient(null)}>
          <div className="admin-details-modal patient-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>Electronic Health Record (EHR)</h3>
                <p>Medical ID: {selectedPatient.id}</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedPatient(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Patient Banner */}
              <div className="modal-user-banner">
                <div className="modal-user-avatar doctor">
                  {selectedPatient.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="modal-user-banner-info">
                  <h4>{selectedPatient.name}</h4>
                  <div className="banner-sub-pills">
                    {selectedPatient.age && (
                      <>
                        <span>{selectedPatient.age} years old</span>
                        <span>•</span>
                      </>
                    )}
                    {selectedPatient.gender && (
                      <>
                        <span>{selectedPatient.gender}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>Blood: {selectedPatient.bloodGroup || "Not recorded"}</span>
                    <span>•</span>
                    <span className="highlight-pill">{selectedPatient.language}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="doctor-modal-info-grid">
                <div className="modal-info-item">
                  <label>Email Address</label>
                  <div className="val">
                    <Mail size={14} className="val-icon" />
                    <span>{selectedPatient.email || "Not provided"}</span>
                  </div>
                </div>

                <div className="modal-info-item">
                  <label>Phone Number</label>
                  <div className="val">
                    <Phone size={14} className="val-icon" />
                    <span>{selectedPatient.phone || "Not provided"}</span>
                  </div>
                </div>

                <div className="modal-info-item">
                  <label>Location / Facility</label>
                  <div className="val">
                    <MapPin size={14} className="val-icon" />
                    <span>{selectedPatient.address || "Residential Location"}</span>
                  </div>
                </div>

                <div className="modal-info-item">
                  <label>Allergies</label>
                  <div className="val text-danger">
                    <AlertCircle size={14} className="val-icon" />
                    <span>
                      {selectedPatient.allergies && selectedPatient.allergies.length > 0
                        ? selectedPatient.allergies.join(", ")
                        : "None documented (NKDA)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Past Consultations History */}
              <div className="doctor-modal-section">
                <label className="section-label">
                  Consultation History ({selectedPatient.pastAppointments?.length || 0})
                </label>
                <div className="patient-history-list">
                  {selectedPatient.pastAppointments && selectedPatient.pastAppointments.length > 0 ? (
                    selectedPatient.pastAppointments.map((apt) => (
                      <div key={apt.id} className="history-item-row">
                        <div className="history-date-col">
                          <Calendar size={13} />
                          <span>{apt.date}</span>
                          <span className="type-badge">{apt.type}</span>
                        </div>
                        <div className="history-detail-col">
                          <p className="diagnosis-text">{apt.diagnosis}</p>
                          <span className="provider-text">Provider: {apt.doctor}</span>
                          {apt.notes && (
                            <span style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                              Notes: {apt.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: "12.5px", color: "#64748b", margin: "4px 0", fontStyle: "italic" }}>
                      No previous consultations recorded.
                    </p>
                  )}
                </div>
              </div>

              {/* Past Prescriptions History */}
              <div className="doctor-modal-section">
                <label className="section-label">
                  Prescription Records ({selectedPatient.pastPrescriptions?.length || 0})
                </label>
                <div className="patient-history-list">
                  {selectedPatient.pastPrescriptions && selectedPatient.pastPrescriptions.length > 0 ? (
                    selectedPatient.pastPrescriptions.map((rx) => (
                      <div key={rx.id} className="history-item-row">
                        <div className="history-date-col">
                          <FileText size={13} />
                          <span>{rx.date}</span>
                          <span className="rx-id-pill">{rx.id}</span>
                        </div>
                        <div className="history-detail-col">
                          <p className="meds-text">{rx.medicines}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: "12.5px", color: "#64748b", margin: "4px 0", fontStyle: "italic" }}>
                      No prescription records documented for this patient yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer settings-modal-footer">
              <button
                type="button"
                className="doctor-btn-primary"
                onClick={() => {
                  const pat = selectedPatient;
                  setSelectedPatient(null);
                  onNavigateTab("prescriptions", {
                    patientName: pat.name,
                    patientId: pat.id,
                    patientAge: pat.age,
                    preferredLanguage: pat.language,
                  });
                }}
              >
                <FileText size={15} />
                <span>Write New Prescription for {selectedPatient.name.split(" ")[0]}</span>
              </button>
              <button
                type="button"
                className="doctor-btn-secondary"
                onClick={() => setSelectedPatient(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorPatientsTab;
