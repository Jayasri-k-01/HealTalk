import { useState, useEffect } from "react";
import { fetchPrescriptions } from "../../services/prescriptionService";
import { fetchMyAppointments } from "../../services/appointmentService";
import {
  FileText,
  Pill,
  Calendar,
  Download,
  CheckCircle2,
  Stethoscope,
  Clock,
  User,
  ShieldCheck,
  Languages,
  Search,
  X,
  AlertCircle,
  Eye,
  Printer,
  Info,
} from "lucide-react";

function MedicalHistory({ user }) {
  const [activeSubTab, setActiveSubTab] = useState("prescriptions");
  const [prescriptions, setPrescriptions] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    loadMedicalHistory();
  }, []);

  const loadMedicalHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const [rxRes, aptRes] = await Promise.allSettled([
        fetchPrescriptions(),
        fetchMyAppointments(),
      ]);

      if (rxRes.status === "fulfilled") {
        setPrescriptions(rxRes.value.prescriptions || []);
      }

      if (aptRes.status === "fulfilled") {
        const allApts = aptRes.value.appointments || [];
        // Extract completed / past consultations with notes or reason
        const completedApts = allApts.filter(
          (a) => a.status === "Completed" || a.notes || a.status === "Confirmed"
        );
        setConsultations(completedApts);
      }
    } catch (err) {
      console.error("Error loading medical history:", err);
      setError(err.message || "Failed to load medical history records");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPrescription = (rx) => {
    setSelectedPrescription(rx);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Search filtering
  const filteredPrescriptions = prescriptions.filter((rx) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const medNames = (rx.medicines || []).map((m) => (m.name || "").toLowerCase()).join(" ");
    const docName = (rx.doctorName || "").toLowerCase();
    const diag = (rx.diagnosis || "").toLowerCase();
    const rxId = (rx.prescriptionId || rx.id || "").toLowerCase();
    return medNames.includes(term) || docName.includes(term) || diag.includes(term) || rxId.includes(term);
  });

  const filteredConsultations = consultations.filter((rec) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const docName = (rec.doctorName || "").toLowerCase();
    const spec = (rec.specialty || "").toLowerCase();
    const reason = (rec.reason || "").toLowerCase();
    const notes = (rec.notes || "").toLowerCase();
    return docName.includes(term) || spec.includes(term) || reason.includes(term) || notes.includes(term);
  });

  return (
    <div className="medical-history-container">
      {/* Page Header */}
      <div className="history-header">
        <div>
          <h2>Medical History & Digital Prescriptions</h2>
          <p>Access your health records, consultation notes, and active medication list</p>
        </div>

        <div className="history-tabs">
          <button
            className={`hist-tab ${activeSubTab === "prescriptions" ? "active" : ""}`}
            onClick={() => setActiveSubTab("prescriptions")}
          >
            <Pill size={16} />
            <span>Prescriptions ({prescriptions.length})</span>
          </button>
          <button
            className={`hist-tab ${activeSubTab === "records" ? "active" : ""}`}
            onClick={() => setActiveSubTab("records")}
          >
            <FileText size={16} />
            <span>Consultation Notes ({consultations.length})</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ position: "relative", width: "100%", maxWidth: "450px" }}>
        <Search
          size={18}
          style={{
            position: "absolute",
            left: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#6b878c",
          }}
        />
        <input
          type="text"
          placeholder={
            activeSubTab === "prescriptions"
              ? "Search by medication, doctor, or diagnosis..."
              : "Search by doctor, specialty, or clinical notes..."
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px 10px 42px",
            borderRadius: "10px",
            border: "1.5px solid #d5eaec",
            background: "#ffffff",
            fontSize: "14px",
            color: "#173b42",
            outline: "none",
          }}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              color: "#8aa1a5",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {error && (
        <div className="auth-alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="empty-appointments-box" style={{ padding: "40px", textAlign: "center" }}>
          <div className="spinner"></div>
          <p style={{ marginTop: "14px", color: "#556c70" }}>Loading your medical records...</p>
        </div>
      ) : activeSubTab === "prescriptions" ? (
        /* Prescriptions Grid */
        filteredPrescriptions.length === 0 ? (
          <div className="empty-appointments-box">
            <Pill size={40} className="empty-icon" />
            <h3>No Prescriptions Found</h3>
            <p>
              {searchTerm
                ? "No prescriptions match your search query."
                : "You currently have no active or completed medical prescriptions on file."}
            </p>
          </div>
        ) : (
          <div className="prescriptions-grid">
            {filteredPrescriptions.map((rx) => {
              const primaryMed = rx.medicines?.[0] || {};
              const rxId = rx.prescriptionId || rx.id || `RX-${String(rx._id).slice(-4).toUpperCase()}`;

              return (
                <div key={rx._id || rx.id} className="prescription-card">
                  <div className="rx-card-header">
                    <div className="rx-icon-box">
                      <Pill size={22} />
                    </div>
                    <div className="rx-header-info">
                      <h3>{primaryMed.name || rx.diagnosis || "Medical Prescription"}</h3>
                      <span className="rx-id">Rx #{rxId}</span>
                    </div>
                    <span className={`status-tag status-${(rx.status || "Active").toLowerCase()}`}>
                      {rx.status || "Active"}
                    </span>
                  </div>

                  <div className="rx-body">
                    {/* Medications List */}
                    <div className="rx-row">
                      <strong>Prescribed Medication(s):</strong>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                        {(rx.medicines || []).map((m, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: "#f0f7f8",
                              padding: "8px 10px",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                          >
                            <span style={{ fontWeight: "700", color: "#173b42" }}>
                              {m.name} {m.dosage ? `(${m.dosage})` : ""}
                            </span>
                            <span style={{ display: "block", color: "#556c70", marginTop: "2px" }}>
                              {m.frequency ? `${m.frequency} • ` : ""}
                              {m.duration ? `${m.duration} • ` : ""}
                              {m.instructions || ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {rx.diagnosis && (
                      <div className="rx-row">
                        <strong>Primary Diagnosis:</strong>
                        <span>{rx.diagnosis}</span>
                      </div>
                    )}

                    <div className="rx-row">
                      <strong>Prescribing Physician:</strong>
                      <span>{rx.doctorName || "Doctor"}</span>
                    </div>

                    <div className="rx-row">
                      <strong>Date Issued:</strong>
                      <span>{rx.date || (rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : "Recent")}</span>
                    </div>

                    {rx.outputLanguage && (
                      <div className="rx-lang-note">
                        <Languages size={14} />
                        <span>Instructions provided in: {rx.outputLanguage}</span>
                      </div>
                    )}
                  </div>

                  <div className="rx-card-footer" style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => setSelectedPrescription(rx)}
                      className="download-pdf-btn"
                      style={{ flex: 1, background: "#f8fafb" }}
                    >
                      <Eye size={15} />
                      <span>View Details</span>
                    </button>
                    <button
                      onClick={() => handlePrintPrescription(rx)}
                      className="download-pdf-btn"
                      style={{ flex: 1 }}
                    >
                      <Printer size={15} />
                      <span>Print / PDF</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Consultation Records List */
        filteredConsultations.length === 0 ? (
          <div className="empty-appointments-box">
            <FileText size={40} className="empty-icon" />
            <h3>No Consultation Records Yet</h3>
            <p>
              {searchTerm
                ? "No consultation notes match your search."
                : "Your completed doctor consultations and clinical advice notes will appear here."}
            </p>
          </div>
        ) : (
          <div className="records-list">
            {filteredConsultations.map((rec) => (
              <div key={rec._id || rec.id} className="record-card">
                <div className="rec-header">
                  <div className="rec-doc-info">
                    <Stethoscope size={20} className="rec-icon" />
                    <div>
                      <h3>{rec.doctorName || "Physician"}</h3>
                      <span className="rec-spec">{rec.specialty || "General Medicine"}</span>
                    </div>
                  </div>
                  <span className="rec-date">
                    <Calendar size={14} /> {rec.date} &bull; {rec.time}
                  </span>
                </div>

                <div className="rec-content">
                  <div className="rec-field">
                    <strong>Reason for Consultation:</strong>
                    <p>{rec.reason || "Health checkup and consultation"}</p>
                  </div>

                  {rec.notes && (
                    <div className="rec-field">
                      <strong>Clinical Notes & Doctor Advice:</strong>
                      <p style={{ background: "#f8fafb", padding: "10px", borderRadius: "8px", border: "1px solid #e2ecee" }}>
                        {rec.notes}
                      </p>
                    </div>
                  )}

                  <div className="rec-field" style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginTop: "4px" }}>
                    <span className="lang-used-tag">
                      Mode: {rec.type || "Video Call"}
                    </span>
                    {rec.interpreterRequested && (
                      <span className="lang-used-tag" style={{ background: "#eaf6f7", color: "#087f8c" }}>
                        <Languages size={12} style={{ verticalAlign: "middle", marginRight: "3px" }} />
                        {rec.interpreterLanguage || "Interpreter"} Requested
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        padding: "3px 10px",
                        borderRadius: "12px",
                        background: rec.status === "Completed" ? "#dcfce7" : "#f1f5f9",
                        color: rec.status === "Completed" ? "#15803d" : "#475569",
                      }}
                    >
                      {rec.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Prescription Detail Modal */}
      {selectedPrescription && (
        <div className="modal-overlay">
          <div className="booking-modal-card" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="rx-icon-box">
                  <Pill size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px" }}>
                    Digital Prescription
                  </h3>
                  <span className="doc-sub" style={{ fontSize: "13px", color: "#087f8c", fontWeight: "600" }}>
                    Rx #{selectedPrescription.prescriptionId || selectedPrescription.id}
                  </span>
                </div>
              </div>
              <button
                className="close-modal-btn"
                onClick={() => setSelectedPrescription(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Doctor & Patient Info Header */}
              <div
                style={{
                  background: "#f0f7f8",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <div>
                  <span style={{ fontSize: "11px", color: "#6b878c", fontWeight: "700", textTransform: "uppercase" }}>PRESCRIBING DOCTOR</span>
                  <strong style={{ display: "block", fontSize: "14px", color: "#173b42" }}>{selectedPrescription.doctorName || "Doctor"}</strong>
                  {selectedPrescription.licenseNumber && (
                    <span style={{ fontSize: "12px", color: "#556c70" }}>License: {selectedPrescription.licenseNumber}</span>
                  )}
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#6b878c", fontWeight: "700", textTransform: "uppercase" }}>PATIENT</span>
                  <strong style={{ display: "block", fontSize: "14px", color: "#173b42" }}>{selectedPrescription.patientName || user?.name || "Patient"}</strong>
                  <span style={{ fontSize: "12px", color: "#556c70" }}>Date: {selectedPrescription.date || "Recent"}</span>
                </div>
              </div>

              {/* Diagnosis */}
              {selectedPrescription.diagnosis && (
                <div style={{ background: "#fafcfc", border: "1px solid #d5eaec", padding: "12px", borderRadius: "10px" }}>
                  <span style={{ fontSize: "11px", color: "#6b878c", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                    DIAGNOSIS / CLINICAL ASSESSMENT
                  </span>
                  <p style={{ margin: 0, fontSize: "14px", color: "#173b42", fontWeight: "600" }}>
                    {selectedPrescription.diagnosis}
                  </p>
                </div>
              )}

              {/* Medicines Table */}
              <div style={{ background: "#ffffff", border: "1px solid #d5eaec", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ background: "#f8fafb", padding: "10px 14px", borderBottom: "1px solid #d5eaec", fontSize: "12px", fontWeight: "700", color: "#24464d" }}>
                  PRESCRIBED MEDICATIONS & DOSAGE
                </div>
                <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {(selectedPrescription.medicines || []).map((m, idx) => (
                    <div key={idx} style={{ paddingBottom: "10px", borderBottom: idx < selectedPrescription.medicines.length - 1 ? "1px solid #eef4f5" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "14px", color: "#087f8c" }}>{m.name}</strong>
                        <span style={{ fontSize: "12px", background: "#eaf6f7", color: "#087f8c", padding: "2px 8px", borderRadius: "10px", fontWeight: "600" }}>
                          {m.dosage}
                        </span>
                      </div>
                      <div style={{ fontSize: "13px", color: "#334e54", marginTop: "4px" }}>
                        <span>Frequency: {m.frequency || "As directed"} &bull; Duration: {m.duration || "As prescribed"}</span>
                        {m.instructions && (
                          <p style={{ margin: "4px 0 0 0", color: "#556c70", fontStyle: "italic", fontSize: "12px" }}>
                            Instructions: {m.instructions}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedPrescription.notes && (
                <div style={{ background: "#fafcfc", border: "1px solid #d5eaec", padding: "12px", borderRadius: "10px" }}>
                  <span style={{ fontSize: "11px", color: "#6b878c", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                    DOCTOR CLINICAL NOTES & ADVICE
                  </span>
                  <p style={{ margin: 0, fontSize: "13px", color: "#334e54" }}>
                    {selectedPrescription.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="modal-actions" style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setSelectedPrescription(null)}
                  style={{ flex: 1 }}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="confirm-btn"
                  onClick={() => window.print()}
                  style={{ flex: 1 }}
                >
                  <Printer size={16} />
                  <span>Print Prescription</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MedicalHistory;
