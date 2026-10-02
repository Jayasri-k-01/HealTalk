import { useState, useEffect } from "react";
import { fetchMyAppointments } from "../../services/appointmentService";
import { fetchDoctors } from "../../services/doctorService";
import { fetchPrescriptions } from "../../services/prescriptionService";
import {
  Calendar,
  Clock,
  Video,
  FileText,
  Globe,
  Bot,
  Stethoscope,
  ArrowRight,
  Star,
  Pill,
  ShieldCheck,
  Languages,
  User,
} from "lucide-react";

function PatientOverview({ user, setActiveTab, onBookDoctor, onJoinConsultation }) {
  const preferredLang = user?.language || "English";
  const [allAppointments, setAllAppointments] = useState([]);
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [activePrescriptionsCount, setActivePrescriptionsCount] = useState(0);
  const [recommendedDoctors, setRecommendedDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [aptRes, rxRes, docRes] = await Promise.allSettled([
        fetchMyAppointments(),
        fetchPrescriptions(),
        fetchDoctors({ language: preferredLang }),
      ]);

      // 1. Appointments & Upcoming Session from MongoDB
      let appointments = [];
      if (aptRes.status === "fulfilled" && aptRes.value?.appointments) {
        appointments = aptRes.value.appointments;
      }
      setAllAppointments(appointments);

      const confirmedOrPending = appointments.filter(
        (a) => a.status === "Confirmed" || a.status === "Pending"
      );

      // Select next upcoming appointment (Confirmed preferred, then Pending)
      const nextSession =
        confirmedOrPending.find((a) => a.status === "Confirmed") ||
        confirmedOrPending[0] ||
        null;
      setUpcomingAppointment(nextSession);

      // 2. Real Active Prescriptions Count from MongoDB
      let activeRxCount = 0;
      if (rxRes.status === "fulfilled" && rxRes.value?.prescriptions) {
        activeRxCount = rxRes.value.prescriptions.filter(
          (rx) => rx.status === "Active" || !rx.status
        ).length;
      } else if (user?.currentMedications && Array.isArray(user.currentMedications)) {
        activeRxCount = user.currentMedications.length;
      }
      setActivePrescriptionsCount(activeRxCount);

      // 3. Recommended Doctors from MongoDB
      let docs = [];
      if (docRes.status === "fulfilled" && docRes.value?.doctors?.length > 0) {
        docs = docRes.value.doctors;
      } else {
        try {
          const allDocsRes = await fetchDoctors();
          docs = allDocsRes.doctors || [];
        } catch (e) {
          docs = [];
        }
      }
      setRecommendedDoctors(docs.slice(0, 3));
    } catch (err) {
      console.error("Error loading overview data:", err);
    } finally {
      setLoading(false);
    }
  };

  const upcomingCount = allAppointments.filter(
    (a) => a.status === "Confirmed" || a.status === "Pending"
  ).length;

  const pastConsultationsCount = allAppointments.filter(
    (a) => a.status === "Completed"
  ).length;

  return (
    <div className="portal-overview">
      {/* Patient Stats Metric Bar */}
      <div className="metrics-grid">
        <div className="metric-card cyan">
          <div className="metric-icon">
            <Calendar size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{upcomingCount}</span>
            <span className="metric-label">Upcoming Appointments</span>
          </div>
        </div>

        <div className="metric-card purple">
          <div className="metric-icon">
            <Stethoscope size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{pastConsultationsCount}</span>
            <span className="metric-label">Past Consultations</span>
          </div>
        </div>

        <div className="metric-card green">
          <div className="metric-icon">
            <Pill size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{activePrescriptionsCount}</span>
            <span className="metric-label">Active Prescriptions</span>
          </div>
        </div>

        <div className="metric-card orange">
          <div className="metric-icon">
            <Globe size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{preferredLang}</span>
            <span className="metric-label">Preferred Language</span>
          </div>
        </div>
      </div>

      {/* Main Focus: Next Upcoming Consultation */}
      {upcomingAppointment ? (
        <div className="upcoming-highlight-card">
          <div className="highlight-header">
            <div className="live-status-pill">
              <span
                className="pulse-dot"
                style={
                  upcomingAppointment.status !== "Confirmed"
                    ? { background: "#f59e0b" }
                    : {}
                }
              ></span>
              <span>
                {upcomingAppointment.status === "Confirmed"
                  ? "NEXT UPCOMING SESSION"
                  : `APPOINTMENT ${upcomingAppointment.status.toUpperCase()}`}
              </span>
            </div>
            <span className="appointment-id">
              ID: #{String(upcomingAppointment._id || upcomingAppointment.id || "APT").substring(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="highlight-body">
            <div className="doc-avatar-large">
              <Stethoscope size={32} />
            </div>
            <div className="highlight-details">
              <h3>{upcomingAppointment.doctorName || upcomingAppointment.doctor?.name || "Doctor"}</h3>
              <p className="doc-specialty">{upcomingAppointment.specialty || upcomingAppointment.doctor?.specialty || "General Physician"}</p>

              <div className="appointment-tags">
                <span className="tag-item">
                  <Calendar size={14} /> {upcomingAppointment.date}
                </span>
                <span className="tag-item">
                  <Clock size={14} /> {upcomingAppointment.time}
                </span>
                <span className="tag-item">
                  <Video size={14} /> {upcomingAppointment.type || "Video Call"}
                </span>
                {upcomingAppointment.interpreterRequested && (
                  <span className="tag-item interpreter-tag">
                    <Languages size={14} />{" "}
                    {upcomingAppointment.interpreterLanguage || "Interpreter"} Ready
                  </span>
                )}
                <span
                  className={`status-badge status-${(upcomingAppointment.status || "confirmed").toLowerCase()}`}
                  style={{ marginLeft: "4px" }}
                >
                  {upcomingAppointment.status || "Confirmed"}
                </span>
              </div>
            </div>

            <div className="highlight-actions">
              {upcomingAppointment.status === "Confirmed" ? (
                <button
                  onClick={() => {
                    if (onJoinConsultation) {
                      onJoinConsultation(upcomingAppointment);
                    } else {
                      setActiveTab("consultations");
                    }
                  }}
                  className="join-session-btn"
                >
                  <Video size={18} />
                  <span>Enter Consultation Room</span>
                </button>
              ) : (
                <button
                  className="join-session-btn"
                  style={{ opacity: 0.65, cursor: "not-allowed", background: "#64748b" }}
                  disabled
                  title="Consultation room opens when appointment is confirmed by doctor"
                >
                  <Clock size={18} />
                  <span>Awaiting Confirmation</span>
                </button>
              )}
              <button
                onClick={() => setActiveTab("appointments")}
                className="view-details-btn"
              >
                View Appointment Info
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="upcoming-highlight-card">
          <div className="highlight-header">
            <div className="live-status-pill" style={{ background: "rgba(8, 127, 140, 0.1)", color: "#087f8c" }}>
              <span>NEXT UPCOMING SESSION</span>
            </div>
          </div>

          <div className="highlight-body">
            <div className="doc-avatar-large" style={{ background: "#f0fdfa", color: "#087f8c" }}>
              <Calendar size={32} />
            </div>
            <div className="highlight-details">
              <h3>No Scheduled Appointments</h3>
              <p className="doc-specialty">You have no upcoming consultations at this time.</p>
            </div>

            <div className="highlight-actions">
              <button
                onClick={() => setActiveTab("find-doctor")}
                className="join-session-btn"
              >
                <Stethoscope size={18} />
                <span>Book a Consultation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Shortcuts & AI Assistant Banner */}
      <div className="overview-two-col">
        {/* Left Column: Quick Action Grid */}
        <div className="quick-access-box">
          <div className="box-title">
            <h3>Patient Quick Actions</h3>
            <p>Direct access to your HealTalk healthcare services</p>
          </div>

          <div className="action-buttons-grid">
            <button
              onClick={() => setActiveTab("find-doctor")}
              className="quick-tile"
            >
              <div className="tile-icon blue">
                <Stethoscope size={24} />
              </div>
              <div className="tile-text">
                <h4>Book a Doctor</h4>
                <p>Find multilingual doctors</p>
              </div>
              <ArrowRight size={16} className="tile-arrow" />
            </button>

            <button
              onClick={() => setActiveTab("ai-assistant")}
              className="quick-tile"
            >
              <div className="tile-icon purple">
                <Bot size={24} />
              </div>
              <div className="tile-text">
                <h4>AI Symptom Checker</h4>
                <p>Ask health questions in {preferredLang}</p>
              </div>
              <ArrowRight size={16} className="tile-arrow" />
            </button>

            <button
              onClick={() => setActiveTab("consultations")}
              className="quick-tile"
            >
              <div className="tile-icon green">
                <Languages size={24} />
              </div>
              <div className="tile-text">
                <h4>Multilingual Consult</h4>
                <p>Live translated video room</p>
              </div>
              <ArrowRight size={16} className="tile-arrow" />
            </button>

            <button
              onClick={() => setActiveTab("medical-history")}
              className="quick-tile"
            >
              <div className="tile-icon orange">
                <FileText size={24} />
              </div>
              <div className="tile-text">
                <h4>Medical Records</h4>
                <p>Prescriptions & lab reports</p>
              </div>
              <ArrowRight size={16} className="tile-arrow" />
            </button>
          </div>
        </div>

        {/* Right Column: AI Health Assistant Quick Widget */}
        <div className="ai-widget-card">
          <div className="ai-widget-header">
            <div className="ai-avatar">
              <Bot size={24} />
            </div>
            <div>
              <h4>HealTalk AI Assistant</h4>
              <span className="lang-badge">Supports {preferredLang}</span>
            </div>
          </div>
          <p className="ai-widget-desc">
            Get instant guidance on medical symptoms or questions before your doctor appointment.
          </p>

          <div className="prompt-pills">
            <button
              onClick={() => setActiveTab("ai-assistant")}
              className="prompt-pill"
            >
              "What causes persistent headache & fatigue?"
            </button>
            <button
              onClick={() => setActiveTab("ai-assistant")}
              className="prompt-pill"
            >
              "Explain hypertension diet recommendations"
            </button>
          </div>

          <button
            onClick={() => setActiveTab("ai-assistant")}
            className="launch-ai-btn"
          >
            <Bot size={18} />
            <span>Launch AI Symptom Checker</span>
          </button>
        </div>
      </div>

      {/* Recommended Multilingual Doctors Section */}
      <div className="recommended-section">
        <div className="section-header-row">
          <div>
            <h3>Recommended Doctors Speaking {preferredLang}</h3>
            <p>Verified specialists available for online consultation</p>
          </div>
          <button
            onClick={() => setActiveTab("find-doctor")}
            className="see-all-btn"
          >
            View All Doctors <ArrowRight size={16} />
          </button>
        </div>

        <div className="doctors-cards-grid">
          {recommendedDoctors.map((doc) => (
            <div key={doc._id || doc.id} className="patient-doc-card">
              <div className="doc-card-top">
                <div className="doc-avatar-small">
                  <User size={22} />
                </div>
                <div className="doc-rating">
                  <Star size={14} className="star-filled" />
                  <span>{doc.rating}</span>
                  <span className="reviews-cnt">({doc.reviews})</span>
                </div>
              </div>

              <h4>{doc.name}</h4>
              <p className="doc-spec">{doc.specialty}</p>

              <div className="doc-meta-info">
                <div className="meta-row">
                  <ShieldCheck size={14} className="meta-icon" />
                  <span>{doc.experience}</span>
                </div>
                <div className="meta-row">
                  <Languages size={14} className="meta-icon" />
                  <span>
                    {Array.isArray(doc.languages)
                      ? doc.languages.join(", ")
                      : doc.languages || "English"}
                  </span>
                </div>
                <div className="meta-row">
                  <Clock size={14} className="meta-icon" />
                  <span className="avail-text">Next: {doc.availableSlots?.[0] || "Today"}</span>
                </div>
              </div>

              <button
                onClick={() => onBookDoctor && onBookDoctor(doc)}
                className="book-now-btn"
              >
                Book Appointment
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PatientOverview;
