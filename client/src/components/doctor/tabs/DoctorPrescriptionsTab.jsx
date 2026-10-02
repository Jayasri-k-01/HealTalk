import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Globe,
  Trash2,
  CheckCircle2,
  Eye,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  Printer,
} from "lucide-react";
import {
  fetchDoctorPrescriptions,
  createPrescription,
} from "../../../services/prescriptionService";
import { fetchDoctorPatients } from "../../../services/doctorService";

const PRESCRIPTION_LANGUAGES = [
  { code: "es", name: "Spanish (Español)" },
  { code: "en", name: "English (Original)" },
  { code: "zh", name: "Mandarin (中文)" },
  { code: "hi", name: "Hindi (हिन्दी)" },
  { code: "fr", name: "French (Français)" },
  { code: "ar", name: "Arabic (العربية)" },
  { code: "pt", name: "Portuguese (Português)" },
  { code: "de", name: "German (Deutsch)" },
];

function DoctorPrescriptionsTab({ onNavigateTab, initialData }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewRxModalOpen, setIsNewRxModalOpen] = useState(false);
  const [selectedRx, setSelectedRx] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // New Prescription Form State
  const [rxForm, setRxForm] = useState({
    patientId: "",
    patientName: "",
    appointmentId: "",
    diagnosis: "",
    outputLanguage: "es",
    notes: "Take all medications with water. Avoid skipping doses.",
    medicines: [
      {
        name: "",
        dosage: "",
        frequency: "Once daily (Morning)",
        duration: "30 days",
        instructions: "Take with food",
      },
    ],
  });

  const [formErrors, setFormErrors] = useState({});

  // Fetch real prescriptions and patients from backend/MongoDB
  const loadData = async () => {
    try {
      setLoading(true);
      const [rxRes, patRes] = await Promise.all([
        fetchDoctorPrescriptions().catch((err) => {
          console.error("Prescriptions fetch error:", err);
          return { prescriptions: [] };
        }),
        fetchDoctorPatients().catch((err) => {
          console.error("Patients fetch error:", err);
          return { patients: [] };
        }),
      ]);

      const fetchedPrescriptions = rxRes.prescriptions || [];
      const fetchedPatients = patRes.patients || [];

      setPrescriptions(fetchedPrescriptions);
      setPatients(fetchedPatients);

      if (fetchedPatients.length > 0 && !rxForm.patientId && !initialData?.patientId) {
        const firstPat = fetchedPatients[0];
        const pLang = firstPat.language?.toLowerCase() || "";
        let langCode = "es";
        if (pLang.includes("french")) langCode = "fr";
        else if (pLang.includes("mandarin") || pLang.includes("chinese")) langCode = "zh";
        else if (pLang.includes("hindi")) langCode = "hi";
        else if (pLang.includes("english")) langCode = "en";
        else if (pLang.includes("arabic")) langCode = "ar";
        else if (pLang.includes("portuguese")) langCode = "pt";
        else if (pLang.includes("german")) langCode = "de";

        setRxForm((prev) => ({
          ...prev,
          patientId: firstPat.id || String(firstPat._id || ""),
          patientName: firstPat.name || "",
          outputLanguage: langCode,
        }));
      }
    } catch (err) {
      console.error("Error loading doctor prescriptions:", err);
      showToast("Failed to load real prescription data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle incoming prefill from Consultation or Patient view
  useEffect(() => {
    if (initialData?.patientId || initialData?.patientName || initialData?.createNew) {
      const matchedPatient = patients.find(
        (p) =>
          p.id === initialData.patientId ||
          p._id === initialData.patientId ||
          p.name?.toLowerCase() === initialData.patientName?.toLowerCase()
      );

      const targetPatientId =
        initialData.patientId || matchedPatient?.id || (matchedPatient ? String(matchedPatient._id) : "");
      const targetPatientName =
        initialData.patientName || matchedPatient?.name || "Patient";

      const prefLang = initialData.preferredLanguage || matchedPatient?.language || "Spanish";
      let langCode = "es";
      const pLangLower = prefLang.toLowerCase();
      if (pLangLower.includes("french")) langCode = "fr";
      else if (pLangLower.includes("mandarin") || pLangLower.includes("chinese")) langCode = "zh";
      else if (pLangLower.includes("hindi")) langCode = "hi";
      else if (pLangLower.includes("english")) langCode = "en";
      else if (pLangLower.includes("arabic")) langCode = "ar";
      else if (pLangLower.includes("portuguese")) langCode = "pt";
      else if (pLangLower.includes("german")) langCode = "de";

      setRxForm((prev) => ({
        ...prev,
        patientId: targetPatientId,
        patientName: targetPatientName,
        appointmentId: initialData.appointmentId || prev.appointmentId || "",
        diagnosis: initialData.diagnosis || prev.diagnosis || "",
        outputLanguage: langCode,
      }));
      setIsNewRxModalOpen(true);
    }
  }, [initialData, patients]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePatientSelectChange = (e) => {
    const pId = e.target.value;
    const pat = patients.find((p) => String(p.id || p._id) === String(pId));
    if (pat) {
      const pLang = pat.language?.toLowerCase() || "";
      let langCode = "es";
      if (pLang.includes("french")) langCode = "fr";
      else if (pLang.includes("mandarin") || pLang.includes("chinese")) langCode = "zh";
      else if (pLang.includes("hindi")) langCode = "hi";
      else if (pLang.includes("english")) langCode = "en";
      else if (pLang.includes("arabic")) langCode = "ar";
      else if (pLang.includes("portuguese")) langCode = "pt";
      else if (pLang.includes("german")) langCode = "de";

      setRxForm((prev) => ({
        ...prev,
        patientId: pat.id || String(pat._id),
        patientName: pat.name,
        outputLanguage: langCode,
      }));
    }
  };

  const handleAddMedicineRow = () => {
    setRxForm((prev) => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        {
          name: "",
          dosage: "",
          frequency: "Once daily (Morning)",
          duration: "30 days",
          instructions: "Take after meals",
        },
      ],
    }));
  };

  const handleRemoveMedicineRow = (index) => {
    if (rxForm.medicines.length <= 1) return;
    setRxForm((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, idx) => idx !== index),
    }));
  };

  const handleMedicineChange = (index, field, value) => {
    setRxForm((prev) => {
      const updated = [...prev.medicines];
      updated[index][field] = value;
      return { ...prev, medicines: updated };
    });
  };

  const handleSavePrescription = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!rxForm.diagnosis.trim()) {
      errors.diagnosis = "Clinical diagnosis is required";
    }

    const hasInvalidMeds = rxForm.medicines.some(
      (m) => !m.name.trim() || !m.dosage.trim()
    );
    if (hasInvalidMeds) {
      errors.medicines = "All prescribed medicines must have a name and dosage";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      const selectedLangObj = PRESCRIPTION_LANGUAGES.find((l) => l.code === rxForm.outputLanguage);
      const langName = selectedLangObj ? selectedLangObj.name.split(" ")[0] : "Spanish";

      const payload = {
        patientId: rxForm.patientId,
        patientName: rxForm.patientName || "Patient",
        appointmentId: rxForm.appointmentId || undefined,
        date: new Date().toISOString().split("T")[0],
        diagnosis: rxForm.diagnosis.trim(),
        outputLanguage: langName,
        status: "Active",
        medicines: rxForm.medicines.map((m) => ({
          name: m.name.trim(),
          dosage: m.dosage.trim(),
          frequency: m.frequency ? m.frequency.trim() : "Once daily",
          duration: m.duration ? m.duration.trim() : "30 days",
          instructions: m.instructions ? m.instructions.trim() : "Take with water",
        })),
        notes: rxForm.notes.trim(),
      };

      const res = await createPrescription(payload);

      if (res.success && res.prescription) {
        setPrescriptions((prev) => [res.prescription, ...prev]);
        setIsNewRxModalOpen(false);
        setFormErrors({});
        showToast(`Prescription ${res.prescription.id || res.prescription.prescriptionId} issued and saved to MongoDB`);

        // Reset form
        const defaultPat = patients.length > 0 ? patients[0] : null;
        setRxForm({
          patientId: defaultPat ? (defaultPat.id || String(defaultPat._id)) : "",
          patientName: defaultPat ? defaultPat.name : "",
          appointmentId: "",
          diagnosis: "",
          outputLanguage: "es",
          notes: "Take all medications with water. Avoid skipping doses.",
          medicines: [
            {
              name: "",
              dosage: "",
              frequency: "Once daily (Morning)",
              duration: "30 days",
              instructions: "Take with food",
            },
          ],
        });
      }
    } catch (err) {
      console.error("Error creating prescription:", err);
      showToast(err.message || "Failed to issue prescription to MongoDB");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const rxId = (rx.id || rx.prescriptionId || "").toLowerCase();
    const patName = (rx.patientName || "").toLowerCase();
    const diag = (rx.diagnosis || "").toLowerCase();
    const lang = (rx.outputLanguage || "").toLowerCase();
    const medNames = (rx.medicines || []).map((m) => m.name.toLowerCase()).join(" ");

    return (
      rxId.includes(q) ||
      patName.includes(q) ||
      diag.includes(q) ||
      lang.includes(q) ||
      medNames.includes(q)
    );
  });

  if (loading) {
    return (
      <div className="doctor-tab-loading">
        <Loader2 size={32} className="doctor-spin-icon" />
        <p>Loading prescription ledger from MongoDB...</p>
      </div>
    );
  }

  return (
    <div className="doctor-prescriptions-tab">
      {toastMessage && (
        <div className="doctor-toast">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="doctor-tab-header">
        <div className="doctor-tab-title-group">
          <h2>Prescriptions & Electronic Orders</h2>
          <p>Issue multilingual verified prescriptions with dosage instructions and AI translation</p>
        </div>
        <button
          type="button"
          className="doctor-btn-primary"
          onClick={() => {
            setFormErrors({});
            setIsNewRxModalOpen(true);
          }}
        >
          <Plus size={16} />
          <span>New Prescription</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="doctor-filter-bar">
        <div className="doctor-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by prescription ID, patient, or diagnosis..."
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
      </div>

      {/* Table of Prescriptions */}
      <div className="doctor-card table-card">
        {filteredPrescriptions.length === 0 ? (
          <div className="doctor-empty-state">
            <FileText size={40} className="empty-icon" />
            <h4>No prescription orders found</h4>
            <p>You can create a new prescription using the button above.</p>
          </div>
        ) : (
          <div className="doctor-table-responsive">
            <table className="doctor-data-table">
              <thead>
                <tr>
                  <th>Prescription ID</th>
                  <th>Patient Name</th>
                  <th>Date Issued</th>
                  <th>Diagnosis</th>
                  <th>Prescribed Medications</th>
                  <th>Translation Language</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrescriptions.map((rx) => (
                  <tr key={rx.id || rx._id} className="table-row-hover">
                    <td>
                      <span className="rx-code-pill">{rx.id || rx.prescriptionId}</span>
                    </td>
                    <td>
                      <div className="table-patient-cell">
                        <div className="patient-avatar-badge sm">
                          {(rx.patientName || "PT").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="name font-bold">{rx.patientName}</span>
                      </div>
                    </td>
                    <td>
                      <div className="table-time-cell">
                        <span className="date">{rx.date}</span>
                      </div>
                    </td>
                    <td>
                      <span className="diagnosis-cell-text">{rx.diagnosis}</span>
                    </td>
                    <td>
                      <div className="meds-summary-cell">
                        {(rx.medicines || []).map((m, i) => (
                          <span key={i} className="med-pill-tag">
                            {m.name} ({m.dosage})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="lang-tag">
                        <Globe size={11} /> {rx.outputLanguage || "English"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`doctor-status-badge ${(rx.status || "Active")
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {rx.status || "Active"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions-cell">
                        <button
                          type="button"
                          className="doctor-btn-secondary doctor-btn-sm"
                          onClick={() => setSelectedRx(rx)}
                          title="View complete prescription slip"
                        >
                          <Eye size={13} />
                          <span>View Rx</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* NEW PRESCRIPTION MODAL */}
      {isNewRxModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => !submitting && setIsNewRxModalOpen(false)}>
          <div
            className="admin-details-modal new-prescription-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>Write & Issue New Prescription</h3>
                <p>Digital Rx slip with automated multilingual patient translation</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                disabled={submitting}
                onClick={() => setIsNewRxModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePrescription}>
              <div className="modal-body">
                {/* Patient & Translation Selection */}
                <div className="rx-form-top-grid">
                  <div className="settings-input-group">
                    <label htmlFor="rx-patient">Select Patient <span className="req">*</span></label>
                    <select
                      id="rx-patient"
                      value={rxForm.patientId}
                      onChange={handlePatientSelectChange}
                      className="settings-select"
                    >
                      {patients.length === 0 ? (
                        <option value={rxForm.patientId || "PAT-001"}>
                          {rxForm.patientName || "Default Patient"}
                        </option>
                      ) : (
                        patients.map((p) => (
                          <option key={p.id || p._id} value={p.id || p._id}>
                            {p.name} ({p.age ? `${p.age}y, ` : ""}{p.language || "English"})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="settings-input-group">
                    <label htmlFor="rx-language">Patient Translation Language</label>
                    <select
                      id="rx-language"
                      value={rxForm.outputLanguage}
                      onChange={(e) =>
                        setRxForm((prev) => ({ ...prev, outputLanguage: e.target.value }))
                      }
                      className="settings-select"
                    >
                      {PRESCRIPTION_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Diagnosis */}
                <div className="settings-input-group">
                  <label htmlFor="rx-diagnosis">
                    Clinical Diagnosis / Condition <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="rx-diagnosis"
                    placeholder="e.g. Stage 1 Essential Hypertension, Bronchitis, Migraine..."
                    value={rxForm.diagnosis}
                    onChange={(e) => {
                      setRxForm((p) => ({ ...p, diagnosis: e.target.value }));
                      if (formErrors.diagnosis) setFormErrors((p) => ({ ...p, diagnosis: "" }));
                    }}
                    className={`settings-input ${formErrors.diagnosis ? "has-error" : ""}`}
                  />
                  {formErrors.diagnosis && (
                    <span className="settings-error-text">
                      <AlertCircle size={13} /> {formErrors.diagnosis}
                    </span>
                  )}
                </div>

                {/* Dynamic Medication List */}
                <div className="rx-medications-section">
                  <div className="meds-header-row">
                    <h4>Prescribed Medications & Dosages</h4>
                    <button
                      type="button"
                      className="doctor-btn-secondary doctor-btn-xs"
                      onClick={handleAddMedicineRow}
                    >
                      <Plus size={13} />
                      <span>Add Medication</span>
                    </button>
                  </div>

                  {formErrors.medicines && (
                    <span className="settings-error-text mb-2">
                      <AlertCircle size={13} /> {formErrors.medicines}
                    </span>
                  )}

                  <div className="meds-input-rows-container">
                    {rxForm.medicines.map((med, idx) => (
                      <div key={idx} className="med-input-row-card">
                        <div className="med-row-top">
                          <span className="med-index-badge">#{idx + 1}</span>
                          {rxForm.medicines.length > 1 && (
                            <button
                              type="button"
                              className="remove-med-btn"
                              onClick={() => handleRemoveMedicineRow(idx)}
                              title="Remove medication"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        <div className="med-row-inputs-grid">
                          <div className="settings-input-group">
                            <label>Medicine Name <span className="req">*</span></label>
                            <input
                              type="text"
                              placeholder="e.g. Lisinopril, Amoxicillin..."
                              value={med.name}
                              onChange={(e) =>
                                handleMedicineChange(idx, "name", e.target.value)
                              }
                              className="settings-input"
                            />
                          </div>

                          <div className="settings-input-group">
                            <label>Dosage <span className="req">*</span></label>
                            <input
                              type="text"
                              placeholder="e.g. 20 mg, 500 mg..."
                              value={med.dosage}
                              onChange={(e) =>
                                handleMedicineChange(idx, "dosage", e.target.value)
                              }
                              className="settings-input"
                            />
                          </div>

                          <div className="settings-input-group">
                            <label>Frequency</label>
                            <input
                              type="text"
                              placeholder="e.g. Once daily, Twice daily..."
                              value={med.frequency}
                              onChange={(e) =>
                                handleMedicineChange(idx, "frequency", e.target.value)
                              }
                              className="settings-input"
                            />
                          </div>

                          <div className="settings-input-group">
                            <label>Duration</label>
                            <input
                              type="text"
                              placeholder="e.g. 30 days, 10 days..."
                              value={med.duration}
                              onChange={(e) =>
                                handleMedicineChange(idx, "duration", e.target.value)
                              }
                              className="settings-input"
                            />
                          </div>
                        </div>

                        <div className="settings-input-group mt-2">
                          <label>Special Instructions for Patient</label>
                          <input
                            type="text"
                            placeholder="e.g. Take with a glass of water after breakfast. Avoid grapefruit."
                            value={med.instructions}
                            onChange={(e) =>
                              handleMedicineChange(idx, "instructions", e.target.value)
                            }
                            className="settings-input"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* General Advice & Clinical Notes */}
                <div className="settings-input-group mt-3">
                  <label htmlFor="rx-notes">Clinical Notes & Follow-up Instructions</label>
                  <textarea
                    id="rx-notes"
                    rows={2}
                    placeholder="General advice, dietary guidelines, and return precautions..."
                    value={rxForm.notes}
                    onChange={(e) => setRxForm((p) => ({ ...p, notes: e.target.value }))}
                    className="settings-input"
                  ></textarea>
                </div>

                {/* Translation Info Callout */}
                <div className="rx-translation-callout">
                  <Sparkles size={16} className="sparkle-icon" />
                  <p>
                    Instructions will be automatically translated into the patient's preferred language on their patient portal and PDF download.
                  </p>
                </div>
              </div>

              <div className="modal-footer settings-modal-footer">
                <button
                  type="button"
                  className="doctor-btn-secondary"
                  disabled={submitting}
                  onClick={() => setIsNewRxModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="doctor-btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 size={15} className="doctor-spin-icon" />
                      <span>Saving to MongoDB...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Issue & Save Prescription</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PRESCRIPTION SLIP MODAL */}
      {selectedRx && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedRx(null)}>
          <div className="admin-details-modal rx-view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>Prescription Order Slip</h3>
                <p>Rx ID: {selectedRx.id || selectedRx.prescriptionId}</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedRx(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body rx-slip-body">
              {/* Rx Header Banner */}
              <div className="rx-slip-header">
                <div className="clinic-brand">
                  <h4>HealTalk Multilingual Telehealth</h4>
                  <span>Provider: {selectedRx.doctorName || "Dr. Elena Rostova"} (Lic: {selectedRx.licenseNumber || "MED-782910"})</span>
                </div>
                <div className="rx-date-badge">
                  <span>Issued Date: {selectedRx.date}</span>
                </div>
              </div>

              {/* Patient Banner */}
              <div className="rx-patient-box">
                <div className="patient-left">
                  <strong>Patient: {selectedRx.patientName}</strong>
                  <span>Diagnosis: {selectedRx.diagnosis}</span>
                </div>
                <span className="lang-pill">Output: {selectedRx.outputLanguage || "English"}</span>
              </div>

              {/* Medication Table */}
              <div className="rx-meds-table-container">
                <table className="rx-slip-table">
                  <thead>
                    <tr>
                      <th>Medication</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedRx.medicines || []).map((m, i) => (
                      <tr key={i}>
                        <td className="font-bold">{m.name}</td>
                        <td>{m.dosage}</td>
                        <td>{m.frequency}</td>
                        <td>{m.duration}</td>
                        <td className="text-muted">{m.instructions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              {selectedRx.notes && (
                <div className="rx-notes-box">
                  <strong>Physician Advice:</strong>
                  <p>{selectedRx.notes}</p>
                </div>
              )}

              {/* Digital Signature */}
              <div className="rx-signature-box">
                <div className="sig-line">
                  <span className="sig-text">{selectedRx.doctorName || "Dr. Elena Rostova"}</span>
                </div>
                <span className="sig-sub">Electronically Signed & Verified via HealTalk EHR</span>
              </div>
            </div>

            <div className="modal-footer settings-modal-footer">
              <button
                type="button"
                className="doctor-btn-secondary"
                onClick={() => showToast("Prescription PDF downloaded (Verified eRx)")}
              >
                <Printer size={15} />
                <span>Print / Download PDF</span>
              </button>
              <button
                type="button"
                className="doctor-btn-primary"
                onClick={() => setSelectedRx(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorPrescriptionsTab;
