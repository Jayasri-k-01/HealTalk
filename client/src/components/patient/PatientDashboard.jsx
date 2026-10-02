import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../Navbar";
import PatientOverview from "./PatientOverview";
import DoctorSearch from "./DoctorSearch";
import MyAppointments from "./MyAppointments";
import ConsultationRoom from "./ConsultationRoom";
import AiHealthAssistant from "./AiHealthAssistant";
import MedicalHistory from "./MedicalHistory";
import PatientSettings from "./PatientSettings";
import {
  LayoutDashboard,
  Stethoscope,
  Calendar,
  Video,
  Bot,
  FileText,
  Settings,
  LogOut,
  User,
  Globe,
} from "lucide-react";

function PatientDashboard({ user }) {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDocForBooking, setSelectedDocForBooking] = useState(null);
  const [selectedConsultationAppointment, setSelectedConsultationAppointment] = useState(null);

  const handleBookDoctorFromOverview = (doc) => {
    setSelectedDocForBooking(doc);
    setActiveTab("find-doctor");
  };

  const handleJoinConsultation = (apt) => {
    setSelectedConsultationAppointment(apt);
    setActiveTab("consultations");
  };

  return (
    <div className="dashboard-container">
      <Navbar />

      <div className="portal-wrapper">
        {/* Patient Portal Sidebar Navigation */}
        <aside className="portal-sidebar">
          <div className="sidebar-patient-card">
            <div className="sidebar-avatar">
              <User size={28} />
            </div>
            <div className="sidebar-patient-info">
              <h4>{user?.name || "Patient"}</h4>
              <div className="sidebar-lang-pill">
                <Globe size={12} />
                <span>{user?.language || "English"}</span>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-tab-item ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <LayoutDashboard size={18} />
              <span>Overview</span>
            </button>

            <button
              className={`nav-tab-item ${activeTab === "find-doctor" ? "active" : ""}`}
              onClick={() => setActiveTab("find-doctor")}
            >
              <Stethoscope size={18} />
              <span>Find & Book Doctor</span>
            </button>

            <button
              className={`nav-tab-item ${activeTab === "appointments" ? "active" : ""}`}
              onClick={() => setActiveTab("appointments")}
            >
              <Calendar size={18} />
              <span>My Appointments</span>
            </button>

            <button
              className={`nav-tab-item ${activeTab === "consultations" ? "active" : ""}`}
              onClick={() => setActiveTab("consultations")}
            >
              <Video size={18} />
              <span>Live Consultations</span>
              <span className="live-pulse-badge">Live</span>
            </button>

            <button
              className={`nav-tab-item ${activeTab === "ai-assistant" ? "active" : ""}`}
              onClick={() => setActiveTab("ai-assistant")}
            >
              <Bot size={18} />
              <span>AI Health Assistant</span>
            </button>

            <button
              className={`nav-tab-item ${activeTab === "medical-history" ? "active" : ""}`}
              onClick={() => setActiveTab("medical-history")}
            >
              <FileText size={18} />
              <span>Medical History</span>
            </button>

            <button
              className={`nav-tab-item ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              <Settings size={18} />
              <span>Language & Settings</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <button onClick={logout} className="sidebar-logout-btn">
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Patient Portal Main View */}
        <main className="portal-main-content">
          {activeTab === "overview" && (
            <PatientOverview
              user={user}
              setActiveTab={setActiveTab}
              onBookDoctor={handleBookDoctorFromOverview}
              onJoinConsultation={handleJoinConsultation}
            />
          )}

          {activeTab === "find-doctor" && (
            <DoctorSearch
              user={user}
              initialSelectedDoctor={selectedDocForBooking}
            />
          )}

          {activeTab === "appointments" && (
            <MyAppointments
              setActiveTab={setActiveTab}
              onJoinConsultation={handleJoinConsultation}
            />
          )}

          {activeTab === "consultations" && (
            <ConsultationRoom
              user={user}
              appointment={selectedConsultationAppointment}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "ai-assistant" && (
            <AiHealthAssistant user={user} />
          )}

          {activeTab === "medical-history" && (
            <MedicalHistory user={user} />
          )}

          {activeTab === "settings" && (
            <PatientSettings user={user} />
          )}
        </main>
      </div>
    </div>
  );
}

export default PatientDashboard;
