import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../Navbar";
import {
  Languages,
  Globe,
  Video,
  Clock,
  User,
  CheckCircle2,
  LogOut,
  Activity,
  Headphones,
} from "lucide-react";

function InterpreterDashboard({ user }) {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("relays");

  const [activeRelays, setActiveRelays] = useState([
    {
      id: "relay-201",
      doctorName: "Dr. Elena Rostova",
      patientName: "Jane Cooper",
      languagePair: "Spanish ↔ English",
      scheduledTime: "4:30 PM (Active Now)",
      status: "In Progress",
    },
    {
      id: "relay-202",
      doctorName: "Dr. Rajesh Sharma",
      patientName: "Sunita Patel",
      languagePair: "Hindi ↔ English",
      scheduledTime: "6:00 PM",
      status: "Scheduled",
    },
  ]);

  return (
    <div className="dashboard-container">
      <Navbar />

      <div className="portal-wrapper">
        <aside className="portal-sidebar">
          <div className="sidebar-patient-card">
            <div className="sidebar-avatar" style={{ background: "#7c3aed" }}>
              <Languages size={26} />
            </div>
            <div className="sidebar-patient-info">
              <h4>{user?.name || "Interpreter"}</h4>
              <div className="sidebar-lang-pill">
                <Globe size={12} />
                <span>Interpreter Portal</span>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-tab-item ${activeTab === "relays" ? "active" : ""}`}
              onClick={() => setActiveTab("relays")}
            >
              <Headphones size={18} />
              <span>Active Relay Sessions</span>
            </button>

            <button
              className={`nav-tab-item ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              <Activity size={18} />
              <span>Session History</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <button onClick={logout} className="sidebar-logout-btn">
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        <main className="portal-main-content">
          <div className="metrics-grid" style={{ marginBottom: "28px" }}>
            <div className="metric-card purple">
              <div className="metric-icon">
                <Headphones size={22} />
              </div>
              <div className="metric-info">
                <span className="metric-value">2</span>
                <span className="metric-label">Today's Assigned Relays</span>
              </div>
            </div>

            <div className="metric-card green">
              <div className="metric-icon">
                <Globe size={22} />
              </div>
              <div className="metric-info">
                <span className="metric-value">{user?.language || "Spanish"}</span>
                <span className="metric-label">Primary Language Pair</span>
              </div>
            </div>

            <div className="metric-card cyan">
              <div className="metric-icon">
                <CheckCircle2 size={22} />
              </div>
              <div className="metric-info">
                <span className="metric-value">48</span>
                <span className="metric-label">Total Relays Completed</span>
              </div>
            </div>
          </div>

          {activeTab === "relays" && (
            <div className="my-appointments-container">
              <div className="appointments-header">
                <div>
                  <h2>Assigned Live Interpretation Relays</h2>
                  <p>Provide real-time speech translation during doctor-patient telemedicine consultations</p>
                </div>
              </div>

              <div className="appointments-list">
                {activeRelays.map((relay) => (
                  <div key={relay.id} className="appointment-card">
                    <div className="apt-card-main">
                      <div className="doc-avatar-mid" style={{ background: "#f3e8ff", color: "#7c3aed" }}>
                        <Languages size={26} />
                      </div>

                      <div className="apt-info">
                        <div className="apt-header-line">
                          <h3>{relay.languagePair}</h3>
                          <span className="status-badge status-confirmed">
                            {relay.status}
                          </span>
                        </div>

                        <p className="apt-spec" style={{ color: "#4a6368" }}>
                          Doctor: <strong>{relay.doctorName}</strong> &bull; Patient: <strong>{relay.patientName}</strong>
                        </p>

                        <div className="apt-meta-tags">
                          <span className="apt-tag">
                            <Clock size={14} /> {relay.scheduledTime}
                          </span>
                          <span className="apt-tag">
                            <Video size={14} /> Video Relay Audio Stream
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="apt-card-actions">
                      <button
                        className="enter-room-btn"
                        style={{ background: "#7c3aed" }}
                        onClick={() => alert(`Connecting live audio relay for ${relay.doctorName} and ${relay.patientName}`)}
                      >
                        <Headphones size={16} />
                        <span>Join Live Relay</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="patient-settings-container">
              <div className="settings-header">
                <h2>Completed Interpretation Logs</h2>
                <p>Track past sessions and relayed consultation duration</p>
              </div>
              <div className="settings-card">
                <p style={{ color: "#61777b" }}>No past relay logs found for today.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default InterpreterDashboard;
