import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  Video,
  MessageSquare,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Globe,
  UserCheck,
  Activity,
  ShieldCheck,
  Star,
  RefreshCw,
  Loader2,
  FileText,
} from "lucide-react";
import { fetchDoctorDashboardStats } from "../../../services/doctorService";

function DoctorDashboardTab({ onNavigateTab, user }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    completedToday: 0,
    remainingToday: 0,
    upcomingConsultations: 0,
    totalPatientsSeen: 0,
    rating: 4.8,
    reviews: 0,
  });
  const [schedule, setSchedule] = useState([]);
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDoctorDashboardStats();
      if (data && data.success) {
        setStats(data.stats || {
          todayAppointments: 0,
          completedToday: 0,
          remainingToday: 0,
          upcomingConsultations: 0,
          totalPatientsSeen: 0,
          rating: 4.8,
          reviews: 0,
        });
        setSchedule(data.todaySchedule || []);
        setActiveConsultation(data.activeConsultation || null);
        setDoctorInfo(data.doctor || null);
      }
    } catch (err) {
      console.error("Failed to load doctor dashboard stats from MongoDB:", err);
      setError(err.message || "Failed to load dashboard statistics from backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="doctor-tab-loading">
        <Loader2 size={32} className="doctor-spin-icon" />
        <p>Loading your live clinical overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="doctor-card">
        <div className="doctor-empty-state">
          <AlertCircle size={40} className="text-danger mb-2" />
          <h4>Unable to Load Clinical Data</h4>
          <p>{error}</p>
          <button
            type="button"
            className="doctor-btn-primary doctor-btn-sm"
            onClick={loadDashboardData}
          >
            <RefreshCw size={14} />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  const nextJoinableAppointment = activeConsultation || schedule.find(
    (apt) => apt.status === "In Progress" || apt.isJoinable
  );


  return (
    <div className="doctor-dashboard-tab">
      {/* Welcome Banner */}
      <div className="doctor-welcome-card">
        <div className="welcome-text-side">
          <div className="welcome-badge">
            <span className="live-pulse-dot"></span>
            Telehealth Clinic Active
          </div>
          <h2>
            Welcome back, {user?.name || "Dr. Elena Rostova"} 👋
          </h2>
          <p>
            You have <strong>{stats.todayAppointments ?? 0} appointments</strong> scheduled for today, with {stats.upcomingConsultations ?? 0} upcoming consultations in your queue.
          </p>
        </div>
        {nextJoinableAppointment && (
          <div className="welcome-action-box">
            <div className="join-alert-header">
              <span className="live-pill">Active Now</span>
              <span className="join-time">{nextJoinableAppointment.time}</span>
            </div>
            <div className="join-patient-info">
              <h4>{nextJoinableAppointment.patientName}</h4>
              <p>{nextJoinableAppointment.reason}</p>
            </div>
            <button
              type="button"
              className="doctor-btn-primary join-urgent-btn"
              onClick={() => onNavigateTab("consultations", nextJoinableAppointment)}
            >
              <Video size={16} />
              <span>Join Active Consultation</span>
            </button>
          </div>
        )}
      </div>

      {/* 1. Summary Cards */}
      <div className="doctor-stats-grid">
        <div className="doctor-stat-card primary">
          <div className="stat-top">
            <div className="stat-icon-box teal">
              <Calendar size={22} />
            </div>
            <span className="stat-pill">Today</span>
          </div>
          <div className="stat-value">{stats.todayAppointments ?? 0}</div>
          <div className="stat-label">Today's Appointments</div>
          <div className="stat-subtext">
            <span>{stats.completedToday ?? 0} completed</span> • <span>{stats.remainingToday ?? 0} remaining</span>
          </div>
        </div>

        <div className="doctor-stat-card">
          <div className="stat-top">
            <div className="stat-icon-box blue">
              <Clock size={22} />
            </div>
            <span className="stat-pill blue">Queue</span>
          </div>
          <div className="stat-value">{stats.upcomingConsultations ?? 0}</div>
          <div className="stat-label">Upcoming Consultations</div>
          <div className="stat-subtext">Confirmed upcoming visits</div>
        </div>

        <div className="doctor-stat-card">
          <div className="stat-top">
            <div className="stat-icon-box purple">
              <Users size={22} />
            </div>
            <span className="stat-pill purple">Total</span>
          </div>
          <div className="stat-value">{stats.totalPatientsSeen ?? 0}</div>
          <div className="stat-label">Total Patients Seen</div>
          <div className="stat-subtext">Unique patient consultations</div>
        </div>

        <div className="doctor-stat-card">
          <div className="stat-top">
            <div className="stat-icon-box amber">
              <Star size={22} />
            </div>
            <span className="stat-pill amber">Quality</span>
          </div>
          <div className="stat-value">
            {stats.rating !== undefined ? Number(stats.rating).toFixed(1) : "4.8"}{" "}
            <span className="stat-unit">/ 5.0</span>
          </div>
          <div className="stat-label">Patient Satisfaction</div>
          <div className="stat-subtext">
            {stats.reviews ? `${stats.reviews} verified patient reviews` : "Verified clinical practice"}
          </div>
        </div>
      </div>

      {/* 2. Today's Schedule & Recent Activity Split Grid */}
      <div className="doctor-dashboard-main-grid">
        {/* Today's Schedule */}
        <div className="doctor-card schedule-card">
          <div className="doctor-card-header">
            <div className="doctor-card-title-group">
              <h3>Today's Schedule</h3>
              <p>Appointments queued for consultation today</p>
            </div>
            <button
              type="button"
              className="doctor-btn-link"
              onClick={() => onNavigateTab("appointments")}
            >
              <span>View Full Schedule</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {schedule.length === 0 ? (
            <div className="doctor-empty-state">
              <Calendar size={36} className="empty-icon" />
              <h4>No appointments scheduled for today</h4>
              <p>Your calendar is clear. You can adjust your hours in the Availability tab.</p>
            </div>
          ) : (
            <div className="doctor-schedule-list">
              {schedule.map((item) => {
                const isVideo = item.type === "video";
                return (
                  <div
                    key={item.id}
                    className={`doctor-schedule-item ${item.status === "In Progress" ? "in-progress" : ""}`}
                  >
                    <div className="schedule-time-block">
                      <Clock size={14} className="time-icon" />
                      <span className="time-text">{item.time}</span>
                      <span className={`consult-type-pill ${isVideo ? "video" : "chat"}`}>
                        {isVideo ? <Video size={11} /> : <MessageSquare size={11} />}
                        {isVideo ? "Video" : "Chat"}
                      </span>
                    </div>

                    <div className="schedule-patient-block">
                      <div className="patient-avatar-badge">
                        {item.patientName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="patient-meta">
                        <div className="patient-name-row">
                          <span className="patient-name">{item.patientName}</span>
                          {item.patientAge && (
                            <span className="patient-age">
                              ({item.patientAge}y, {item.patientGender})
                            </span>
                          )}
                        </div>
                        <span className="patient-reason">{item.reason}</span>
                      </div>
                    </div>

                    <div className="schedule-language-block">
                      <div className="lang-tag">
                        <Globe size={12} />
                        <span>{item.language}</span>
                      </div>
                      {item.requiresInterpreter && (
                        <span
                          className="interpreter-needed-badge"
                          title={`Interpreter: ${item.interpreterName || "Assigned"}`}
                        >
                          <UserCheck size={11} />
                          Interpreter
                        </span>
                      )}
                    </div>

                    <div className="schedule-status-block">
                      <span className={`doctor-status-badge ${item.status.toLowerCase().replace(" ", "-")}`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="schedule-actions-block">
                      {item.status === "In Progress" || item.isJoinable ? (
                        <button
                          type="button"
                          className="doctor-btn-primary doctor-btn-sm"
                          onClick={() => onNavigateTab("consultations", item)}
                        >
                          <Video size={13} />
                          <span>Join Now</span>
                        </button>
                      ) : item.status === "Completed" ? (
                        <button
                          type="button"
                          className="doctor-btn-secondary doctor-btn-sm"
                          onClick={() => onNavigateTab("prescriptions", item)}
                        >
                          <FileText size={13} />
                          <span>Rx Notes</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="doctor-btn-secondary doctor-btn-sm"
                          onClick={() => onNavigateTab("appointments", item)}
                        >
                          <span>Details</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Quick Links & Recent Activity */}
        <div className="doctor-dashboard-side-col">
          {/* Quick Actions Card */}
          <div className="doctor-card quick-actions-card">
            <div className="doctor-card-header">
              <div className="doctor-card-title-group">
                <h3>Quick Navigation</h3>
                <p>Common clinical workflows</p>
              </div>
            </div>
            <div className="doctor-quick-actions-grid">
              <button
                type="button"
                className="quick-action-btn"
                onClick={() => onNavigateTab("prescriptions", { createNew: true })}
              >
                <div className="quick-action-icon teal">
                  <FileText size={18} />
                </div>
                <div className="quick-action-text">
                  <span className="title">New Prescription</span>
                  <span className="desc">Issue & translate Rx</span>
                </div>
              </button>

              <button
                type="button"
                className="quick-action-btn"
                onClick={() => onNavigateTab("availability")}
              >
                <div className="quick-action-icon blue">
                  <Clock size={18} />
                </div>
                <div className="quick-action-text">
                  <span className="title">Adjust Hours</span>
                  <span className="desc">Weekly availability</span>
                </div>
              </button>

              <button
                type="button"
                className="quick-action-btn"
                onClick={() => onNavigateTab("patients")}
              >
                <div className="quick-action-icon purple">
                  <Users size={18} />
                </div>
                <div className="quick-action-text">
                  <span className="title">Patient Records</span>
                  <span className="desc">History & past visits</span>
                </div>
              </button>

              <button
                type="button"
                className="quick-action-btn"
                onClick={() => onNavigateTab("profile")}
              >
                <div className="quick-action-icon amber">
                  <ShieldCheck size={18} />
                </div>
                <div className="quick-action-text">
                  <span className="title">Doctor Profile</span>
                  <span className="desc">Credentials & fees</span>
                </div>
              </button>
            </div>
          </div>

          {/* Platform Activity Feed */}
          <div className="doctor-card activity-feed-card">
            <div className="doctor-card-header">
              <div className="doctor-card-title-group">
                <h3>Recent Clinical Activity</h3>
                <p>Latest updates and platform alerts</p>
              </div>
            </div>
            <div className="doctor-activity-timeline">
              {schedule.length > 0 ? (
                schedule.slice(0, 4).map((apt, idx) => (
                  <div key={apt.id || idx} className="activity-timeline-item">
                    <div className={`activity-bullet ${apt.type === "video" ? "appointment" : "interpreter"}`}></div>
                    <div className="activity-content">
                      <div className="activity-title">
                        {apt.status === "Completed" ? "Consultation Completed" : "Appointment Scheduled"}
                      </div>
                      <div className="activity-desc">
                        {apt.patientName} • {apt.reason}
                      </div>
                      <div className="activity-time">{apt.time}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="doctor-empty-state" style={{ padding: "20px 0" }}>
                  <Activity size={24} className="empty-icon" />
                  <p style={{ margin: 0, fontSize: "12.5px" }}>No recent activity for today.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoctorDashboardTab;
