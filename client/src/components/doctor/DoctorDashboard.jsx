import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Stethoscope,
  LayoutDashboard,
  Calendar,
  Video,
  Users,
  FileText,
  Clock,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  HeartPulse,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import DoctorDashboardTab from "./tabs/DoctorDashboardTab";
import DoctorAppointmentsTab from "./tabs/DoctorAppointmentsTab";
import DoctorConsultationsTab from "./tabs/DoctorConsultationsTab";
import DoctorPatientsTab from "./tabs/DoctorPatientsTab";
import DoctorPrescriptionsTab from "./tabs/DoctorPrescriptionsTab";
import DoctorAvailabilityTab from "./tabs/DoctorAvailabilityTab";
import DoctorProfileTab from "./tabs/DoctorProfileTab";
import "./DoctorDashboard.css";

function DoctorDashboard({ user }) {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [tabExtraData, setTabExtraData] = useState(null);

  // 7 Doctor Portal Navigation Items
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "appointments", label: "Appointments", icon: Calendar, badge: "6", badgeType: "info" },
    { id: "consultations", label: "Consultations", icon: Video, badge: "Live", badgeType: "live" },
    { id: "patients", label: "Patients", icon: Users },
    { id: "prescriptions", label: "Prescriptions", icon: FileText },
    { id: "availability", label: "Availability", icon: Clock },
    { id: "profile", label: "Profile", icon: User },
  ];

  // Inter-tab seamless navigation handler
  const handleNavigateTab = (targetTabId, extraData = null) => {
    setTabExtraData(extraData);
    setActiveTab(targetTabId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getDoctorInitials = (name) => {
    if (!name) return "DR";
    const clean = name.replace(/^Dr\.\s*/i, "");
    const parts = clean.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return clean.slice(0, 2).toUpperCase();
  };

  const activeNavMeta = navItems.find((n) => n.id === activeTab) || navItems[0];

  return (
    <div className="doctor-layout">
      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="admin-modal-backdrop"
          style={{ zIndex: 999 }}
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* 1. DOCTOR SIDEBAR */}
      <aside className={`doctor-sidebar ${isMobileSidebarOpen ? "mobile-open" : ""}`}>
        <div>
          <div className="doctor-sidebar-header">
            <div className="doctor-brand">
              <div className="doctor-brand-logo">
                <HeartPulse size={22} />
              </div>
              <div className="doctor-brand-text">
                <span className="doctor-brand-title">HealTalk</span>
                <span className="doctor-brand-badge">Doctor Portal</span>
              </div>
            </div>
            <button
              type="button"
              className="doctor-sidebar-close"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="doctor-sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`doctor-nav-item ${isActive ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                >
                  <div className="doctor-nav-item-left">
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`doctor-nav-badge ${item.badgeType || ""}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Doctor Sidebar Footer Profile & Real Logout */}
        <div className="doctor-sidebar-footer">
          <div className="doctor-profile-widget">
            <div className="doctor-profile-info">
              <div className="doctor-avatar-circle">
                {getDoctorInitials(user?.name || "Dr. Elena Rostova")}
              </div>
              <div className="doctor-profile-names">
                <span className="doctor-name-text">
                  {user?.name || "Dr. Elena Rostova"}
                </span>
                <span className="doctor-role-text">
                  {user?.specialization || "Cardiologist (MD)"}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="doctor-logout-btn"
              onClick={logout}
              title="Sign Out of Doctor Portal"
              id="doctor-sidebar-logout-btn"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN VIEWPORT & TOPBAR */}
      <div className="doctor-main-wrapper">
        <header className="doctor-topbar">
          <div className="doctor-topbar-left">
            <button
              type="button"
              className="doctor-mobile-toggle"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>
            <div className="doctor-page-breadcrumb">
              <h2>{activeNavMeta.label}</h2>
              <p>HealTalk Clinical Practice & Telehealth Suite</p>
            </div>
          </div>

          <div className="doctor-topbar-right">
            <div className="doctor-status-indicator">
              <span className="live-pulse-dot"></span>
              <span>Available for Consultations</span>
            </div>
          </div>
        </header>

        {/* 3. TAB VIEWPORT */}
        <main className="doctor-content-container">
          {activeTab === "dashboard" && (
            <DoctorDashboardTab onNavigateTab={handleNavigateTab} user={user} />
          )}

          {activeTab === "appointments" && (
            <DoctorAppointmentsTab onNavigateTab={handleNavigateTab} user={user} />
          )}

          {activeTab === "consultations" && (
            <DoctorConsultationsTab
              onNavigateTab={handleNavigateTab}
              initialSession={tabExtraData}
              user={user}
            />
          )}

          {activeTab === "patients" && (
            <DoctorPatientsTab onNavigateTab={handleNavigateTab} user={user} />
          )}

          {activeTab === "prescriptions" && (
            <DoctorPrescriptionsTab
              onNavigateTab={handleNavigateTab}
              initialData={tabExtraData}
              user={user}
            />
          )}

          {activeTab === "availability" && (
            <DoctorAvailabilityTab onNavigateTab={handleNavigateTab} user={user} />
          )}

          {activeTab === "profile" && (
            <DoctorProfileTab onNavigateTab={handleNavigateTab} user={user} />
          )}
        </main>
      </div>
    </div>
  );
}

export default DoctorDashboard;
