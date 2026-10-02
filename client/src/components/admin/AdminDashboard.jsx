import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { getAdminDashboardStats } from "../../services/adminService";
import UsersManagement from "./UsersManagement";
import DoctorVerification from "./DoctorVerification";
import DoctorsManagement from "./DoctorsManagement";
import InterpretersManagement from "./InterpretersManagement";
import InterpreterVerification from "./InterpreterVerification";
import AppointmentsManagement from "./AppointmentsManagement";
import AnalyticsManagement from "./AnalyticsManagement";
import SettingsManagement from "./SettingsManagement";
import {
  HeartPulse,
  LayoutDashboard,
  Users,
  Stethoscope,
  UserCheck,
  Globe,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  Clock,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileCheck,
  ShieldCheck,
  Activity,
  Loader2,
  RefreshCw,
} from "lucide-react";
import "./AdminDashboard.css";

function AdminDashboard({ user }) {
  const { logout } = useAuth();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [activeVerificationTab, setActiveVerificationTab] = useState("doctor");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // STEP 2: MongoDB Real Statistics State
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real statistics from MongoDB backend API
  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminDashboardStats();
      setStats({
        totalPatients: Number(data?.totalPatients) || 0,
        totalDoctors: Number(data?.totalDoctors) || 0,
        totalInterpreters: Number(data?.totalInterpreters) || 0,
        totalAppointments: Number(data?.totalAppointments) || 0,
        pendingDoctors: Number(data?.pendingDoctors) || 0,
        pendingInterpreters: Number(data?.pendingInterpreters) || 0,
      });
    } catch (err) {
      console.error("Failed to load admin stats from MongoDB:", err);
      setError("Unable to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Navigation Items
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "doctors", label: "Doctors", icon: Stethoscope },
    {
      id: "doctor-verification",
      label: "Doctor Verification",
      icon: UserCheck,
      badge: stats ? String(stats.pendingDoctors) : "0",
      badgeType: "warning",
    },
    { id: "interpreters", label: "Interpreters", icon: Globe },
    {
      id: "interpreter-verification",
      label: "Interpreter Verification",
      icon: ShieldCheck,
      badge: stats ? String(stats.pendingInterpreters) : "0",
      badgeType: "rose",
    },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // 6 Statistic Cards connected directly to MongoDB Real Counts
  const statsCards = [
    {
      id: "patients",
      label: "Total Patients",
      value: stats ? stats.totalPatients : 0,
      subtext: "Registered patient accounts",
      icon: Users,
      cardClass: "patients",
    },
    {
      id: "doctors",
      label: "Total Doctors",
      value: stats ? stats.totalDoctors : 0,
      subtext: "Registered doctor accounts",
      icon: Stethoscope,
      cardClass: "doctors",
    },
    {
      id: "interpreters",
      label: "Total Interpreters",
      value: stats ? stats.totalInterpreters : 0,
      subtext: "Registered language interpreters",
      icon: Globe,
      cardClass: "interpreters",
    },
    {
      id: "appointments",
      label: "Total Appointments",
      value: stats ? stats.totalAppointments : 0,
      subtext: "Booked consultation sessions",
      icon: Calendar,
      cardClass: "appointments",
    },
    {
      id: "pending-doctor",
      label: "Pending Doctor Verifications",
      value: stats ? stats.pendingDoctors : 0,
      subtext: "Doctors requiring admin verification",
      icon: UserCheck,
      cardClass: "pending-doc",
      pillText: stats?.pendingDoctors > 0 ? "Review Required" : "Up to date",
      pillClass: stats?.pendingDoctors > 0 ? "alert" : "",
    },
    {
      id: "pending-interpreter",
      label: "Pending Interpreter Verifications",
      value: stats ? stats.pendingInterpreters : 0,
      subtext: "Interpreters requiring verification",
      icon: ShieldCheck,
      cardClass: "pending-interp",
      pillText: stats?.pendingInterpreters > 0 ? "Action Needed" : "Up to date",
      pillClass: stats?.pendingInterpreters > 0 ? "rose" : "",
    },
  ];

  // Placeholder Pending Verifications
  const pendingDoctors = [
    {
      id: "doc-1",
      name: "Dr. Elena Rostova",
      specialty: "Cardiology",
      experience: "8 yrs exp • Harvard Med",
      appliedDate: "Yesterday",
      status: "Pending",
      initials: "ER",
      color: "#087f8c",
    },
    {
      id: "doc-2",
      name: "Dr. Rajesh Sharma",
      specialty: "Neurology",
      experience: "12 yrs exp • AIIMS",
      appliedDate: "2 days ago",
      status: "Pending",
      initials: "RS",
      color: "#0f766e",
    },
  ];

  const pendingInterpreters = [
    {
      id: "int-1",
      name: "Carlos Mendez",
      languages: "Spanish ↔ English",
      certification: "Medical Certified (CCHI)",
      appliedDate: "Today",
      status: "Pending",
      initials: "CM",
      color: "#7c3aed",
    },
  ];

  // Placeholder Recent Activity Timeline
  const recentActivities = [
    {
      id: "act-1",
      type: "patient",
      text: <span><strong>Sarah Jenkins</strong> registered as a new patient</span>,
      time: "10 minutes ago",
      icon: UserPlus,
    },
    {
      id: "act-2",
      type: "doctor",
      text: <span><strong>Dr. Michael Chen</strong> submitted registration details for Cardiology</span>,
      time: "25 minutes ago",
      icon: Stethoscope,
    },
    {
      id: "act-3",
      type: "verify",
      text: <span><strong>Dr. Elena Rostova</strong> was approved and verified by Admin</span>,
      time: "1 hour ago",
      icon: CheckCircle2,
    },
    {
      id: "act-4",
      type: "interp",
      text: <span><strong>Carlos Mendez</strong> applied for Spanish Interpreter role</span>,
      time: "2 hours ago",
      icon: Globe,
    },
    {
      id: "act-5",
      type: "appointment",
      text: <span>New appointment <strong>#4820</strong> booked with Dr. Sarah Smith</span>,
      time: "3 hours ago",
      icon: Calendar,
    },
  ];

  const adminName = user?.name || "System Admin";
  const adminInitial = adminName.charAt(0).toUpperCase();

  return (
    <div className="admin-layout">
      {/* Mobile Sidebar Overlay */}
      <div
        className={`admin-sidebar-overlay ${isMobileSidebarOpen ? "active" : ""}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      {/* 1. SIDEBAR */}
      <aside className={`admin-sidebar ${isMobileSidebarOpen ? "open" : ""}`}>
        <div>
          <div className="admin-sidebar-header">
            <a href="#" className="admin-brand">
              <div className="admin-brand-logo">
                <HeartPulse size={22} />
              </div>
              <div className="admin-brand-text">
                <span className="admin-brand-title">HealTalk</span>
                <span className="admin-brand-badge">Admin Portal</span>
              </div>
            </a>
            <button
              className="admin-sidebar-close"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="admin-sidebar-nav">
            <div className="admin-nav-section-label">Main Menu</div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  className={`admin-nav-item ${isActive ? "active" : ""}`}
                  onClick={() => {
                    setActiveNav(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                >
                  <Icon className="admin-nav-icon" size={19} />
                  <span>{item.label}</span>
                  {item.badge && item.badge !== "0" && (
                    <span className={`admin-nav-badge ${item.badgeType || ""}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="admin-sidebar-footer">
          <button onClick={logout} className="admin-logout-btn">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN LAYOUT CONTENT */}
      <div className="admin-main">
        {/* 2. TOP HEADER */}
        <header className="admin-top-header">
          <div className="admin-header-left">
            <button
              className="admin-mobile-toggle"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>

            <div className="admin-header-title-group">
              <h1>
                {activeNav === "dashboard"
                  ? "Admin Dashboard"
                  : navItems.find((n) => n.id === activeNav)?.label || "Admin Panel"}
              </h1>
              <p>Overview of your HealTalk platform</p>
            </div>
          </div>

          <div className="admin-header-right">
            {/* Quick Refresh Button */}
            <button
              className="admin-notif-btn"
              onClick={fetchDashboardStats}
              title="Refresh MongoDB Statistics"
            >
              <RefreshCw size={17} className={loading ? "spin-icon" : ""} />
            </button>

            {/* Quick Search Input */}
            <div className="admin-search-wrapper">
              <Search className="admin-search-icon" size={16} />
              <input
                type="text"
                placeholder="Search users, doctors..."
                className="admin-search-input"
              />
            </div>

            {/* Notification Icon */}
            <div style={{ position: "relative" }}>
              <button
                className="admin-notif-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
              >
                <Bell size={19} />
                <span className="admin-notif-dot" />
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div className="admin-notif-popover">
                  <div className="admin-notif-header">
                    <h4>Notifications</h4>
                    <span className="admin-stat-pill alert">System Active</span>
                  </div>
                  <div className="admin-notif-list">
                    <div className="admin-notif-item">
                      <FileCheck size={18} style={{ color: "#d97706", flexShrink: 0 }} />
                      <div>
                        <p>Pending Doctor Verifications: <strong>{stats?.pendingDoctors || 0}</strong></p>
                        <div className="admin-notif-time">Live MongoDB Count</div>
                      </div>
                    </div>
                    <div className="admin-notif-item">
                      <ShieldCheck size={18} style={{ color: "#e11d48", flexShrink: 0 }} />
                      <div>
                        <p>Pending Interpreter Verifications: <strong>{stats?.pendingInterpreters || 0}</strong></p>
                        <div className="admin-notif-time">Live MongoDB Count</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile/Avatar */}
            <div className="admin-profile-badge">
              <div className="admin-avatar">{adminInitial}</div>
              <div className="admin-user-details">
                <span className="admin-user-name">{adminName}</span>
                <span className="admin-user-role">Administrator</span>
              </div>
            </div>
          </div>
        </header>

        {/* 3. DASHBOARD MAIN VIEW */}
        <main className="admin-content">
          {/* Error Banner State */}
          {error && (
            <div
              style={{
                padding: "12px 18px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fee2e2",
                color: "#991b1b",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
              <button
                onClick={fetchDashboardStats}
                style={{
                  marginLeft: "auto",
                  background: "transparent",
                  border: "none",
                  color: "#991b1b",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Retry
              </button>
            </div>
          )}

          {activeNav === "users" ? (
            <UsersManagement />
          ) : activeNav === "doctors" ? (
            <DoctorsManagement onUpdateStats={fetchDashboardStats} />
          ) : activeNav === "doctor-verification" ? (
            <DoctorVerification onUpdateStats={fetchDashboardStats} />
          ) : activeNav === "interpreters" ? (
            <InterpretersManagement onUpdateStats={fetchDashboardStats} />
          ) : activeNav === "interpreter-verification" ? (
            <InterpreterVerification onUpdateStats={fetchDashboardStats} />
          ) : activeNav === "appointments" ? (
            <AppointmentsManagement onUpdateStats={fetchDashboardStats} />
          ) : activeNav === "analytics" ? (
            <AnalyticsManagement />
          ) : activeNav === "settings" ? (
            <SettingsManagement user={user} />
          ) : activeNav !== "dashboard" ? (
            /* Sub-navigation placeholder view */
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-title-group">
                  <h3>{navItems.find((n) => n.id === activeNav)?.label}</h3>
                  <p>Manage and monitor {activeNav} settings for HealTalk telemedicine platform.</p>
                </div>
              </div>
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "#64748b",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px dashed #cbd5e1",
                }}
              >
                <Activity size={40} style={{ color: "#087f8c", marginBottom: "12px" }} />
                <h4 style={{ margin: "0 0 6px 0", color: "#0f172a" }}>
                  {navItems.find((n) => n.id === activeNav)?.label} Section
                </h4>
                <p style={{ margin: 0, fontSize: "14px" }}>
                  Section management controls will connect in future steps. Select "Dashboard" in sidebar for main overview.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* 3. STATISTICS CARDS (6 CARDS WITH REAL MONGODB COUNTS) */}
              <section className="admin-stats-grid">
                {statsCards.map((card) => {
                  const Icon = card.icon;
                  const handleCardClick = () => {
                    if (card.id === "patients") setActiveNav("users");
                    else if (card.id === "doctors") setActiveNav("doctors");
                    else if (card.id === "interpreters") setActiveNav("interpreters");
                    else if (card.id === "appointments") setActiveNav("appointments");
                    else if (card.id === "pending-doctor") setActiveNav("doctor-verification");
                    else if (card.id === "pending-interpreter") setActiveNav("interpreter-verification");
                  };
                  return (
                    <div
                      key={card.id}
                      className={`admin-stat-card ${card.cardClass}`}
                      onClick={handleCardClick}
                      style={{ cursor: "pointer" }}
                      title={`Go to ${card.label}`}
                    >
                      <div className="admin-stat-top">
                        <div className="admin-stat-icon-box">
                          <Icon size={22} />
                        </div>
                        {card.pillText && (
                          <span className={`admin-stat-pill ${card.pillClass || ""}`}>
                            {card.pillText}
                          </span>
                        )}
                      </div>

                      <div className="admin-stat-info">
                        <div className="admin-stat-number">
                          {loading ? (
                            <span style={{ opacity: 0.5, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              <Loader2 size={20} className="spin-icon" />
                            </span>
                          ) : (
                            card.value
                          )}
                        </div>
                        <div className="admin-stat-label">{card.label}</div>
                      </div>

                      {card.subtext && (
                        <div className="admin-stat-subtext">
                          <TrendingUp size={13} style={{ color: "#10b981" }} />
                          <span>{card.subtext}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>

              {/* 4. CHART AREA PLACEHOLDERS */}
              <section className="admin-charts-grid">
                {/* User Distribution Bar Chart Placeholder */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <div className="admin-card-title-group">
                      <h3>User Distribution</h3>
                      <p>Platform breakdown across user categories</p>
                    </div>
                    <span className="admin-stat-pill">MongoDB Live Data</span>
                  </div>

                  <div className="admin-chart-placeholder-box">
                    <div className="admin-distribution-bars">
                      {/* Patients Bar */}
                      <div className="admin-dist-bar-item">
                        <div className="admin-dist-bar-info">
                          <span className="admin-dist-label">
                            <span className="admin-dist-dot" style={{ background: "#0284c7" }} />
                            Patients
                          </span>
                          <span className="admin-dist-val">{stats ? stats.totalPatients : 0}</span>
                        </div>
                        <div className="admin-dist-track">
                          <div
                            className="admin-dist-fill"
                            style={{
                              width: `${Math.min(100, Math.max(10, (stats?.totalPatients || 0) * 15))}%`,
                              background: "#0284c7",
                            }}
                          />
                        </div>
                      </div>

                      {/* Doctors Bar */}
                      <div className="admin-dist-bar-item">
                        <div className="admin-dist-bar-info">
                          <span className="admin-dist-label">
                            <span className="admin-dist-dot" style={{ background: "#0f766e" }} />
                            Doctors
                          </span>
                          <span className="admin-dist-val">{stats ? stats.totalDoctors : 0}</span>
                        </div>
                        <div className="admin-dist-track">
                          <div
                            className="admin-dist-fill"
                            style={{
                              width: `${Math.min(100, Math.max(10, (stats?.totalDoctors || 0) * 25))}%`,
                              background: "#0f766e",
                            }}
                          />
                        </div>
                      </div>

                      {/* Interpreters Bar */}
                      <div className="admin-dist-bar-item">
                        <div className="admin-dist-bar-info">
                          <span className="admin-dist-label">
                            <span className="admin-dist-dot" style={{ background: "#7c3aed" }} />
                            Interpreters
                          </span>
                          <span className="admin-dist-val">{stats ? stats.totalInterpreters : 0}</span>
                        </div>
                        <div className="admin-dist-track">
                          <div
                            className="admin-dist-fill"
                            style={{
                              width: `${Math.min(100, Math.max(10, (stats?.totalInterpreters || 0) * 25))}%`,
                              background: "#7c3aed",
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="admin-chart-watermark">
                      <BarChart3 size={16} />
                      <span>Bar Chart Visualization Surface</span>
                    </div>
                  </div>
                </div>

                {/* Appointment Overview Line Chart Placeholder */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <div className="admin-card-title-group">
                      <h3>Appointment Overview</h3>
                      <p>Activity and consultations over time</p>
                    </div>
                    <select className="admin-card-action-select">
                      <option>This Week</option>
                      <option>This Month</option>
                      <option>This Year</option>
                    </select>
                  </div>

                  <div className="admin-chart-placeholder-box">
                    <div className="admin-line-graph-placeholder">
                      <div className="admin-graph-svg-container">
                        <svg
                          viewBox="0 0 500 120"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ width: "100%", height: "100%" }}
                        >
                          <defs>
                            <linearGradient id="gradientCurve" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#087f8c" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#087f8c" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <line x1="0" y1="30" x2="500" y2="30" stroke="#e2e8f0" strokeDasharray="4 4" />
                          <line x1="0" y1="70" x2="500" y2="70" stroke="#e2e8f0" strokeDasharray="4 4" />

                          <path
                            d="M0 80 C 70 30, 130 95, 200 40 C 270 -10, 340 75, 410 25 C 450 0, 480 30, 500 20 L 500 120 L 0 120 Z"
                            fill="url(#gradientCurve)"
                          />
                          <path
                            d="M0 80 C 70 30, 130 95, 200 40 C 270 -10, 340 75, 410 25 C 450 0, 480 30, 500 20"
                            stroke="#087f8c"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />
                          <circle cx="200" cy="40" r="5" fill="#087f8c" stroke="#ffffff" strokeWidth="2" />
                          <circle cx="410" cy="25" r="5" fill="#087f8c" stroke="#ffffff" strokeWidth="2" />
                        </svg>
                      </div>

                      <div className="admin-graph-x-axis">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                      </div>
                    </div>

                    <div className="admin-chart-watermark">
                      <TrendingUp size={16} />
                      <span>Line Chart Visualization Surface</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 5 & 6. PENDING VERIFICATION & RECENT ACTIVITY GRID */}
              <section className="admin-bottom-grid">
                {/* 5. Pending Verification Section */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <div className="admin-card-title-group">
                      <h3>Pending Verifications</h3>
                      <p>Healthcare providers awaiting administrator approval</p>
                    </div>
                  </div>

                  {/* Doctor vs Interpreter Tab Selection */}
                  <div className="admin-pending-tabs">
                    <button
                      className={`admin-tab-btn ${activeVerificationTab === "doctor" ? "active" : ""}`}
                      onClick={() => setActiveVerificationTab("doctor")}
                    >
                      Doctor Verification ({stats ? stats.pendingDoctors : 0})
                    </button>
                    <button
                      className={`admin-tab-btn ${activeVerificationTab === "interpreter" ? "active" : ""}`}
                      onClick={() => setActiveVerificationTab("interpreter")}
                    >
                      Interpreter Verification ({stats ? stats.pendingInterpreters : 0})
                    </button>
                  </div>

                  <div className="admin-verification-list">
                    {activeVerificationTab === "doctor"
                      ? pendingDoctors.map((doc) => (
                          <div key={doc.id} className="admin-verification-item">
                            <div className="admin-verify-user">
                              <div
                                className="admin-verify-avatar"
                                style={{ backgroundColor: `${doc.color}15`, color: doc.color }}
                              >
                                {doc.initials}
                              </div>
                              <div className="admin-verify-details">
                                <span className="admin-verify-name">{doc.name}</span>
                                <span className="admin-verify-sub">
                                  {doc.specialty} • {doc.experience}
                                </span>
                              </div>
                            </div>

                            <div className="admin-verify-actions">
                              <span className="admin-status-tag pending">{doc.status}</span>
                              <button
                                className="admin-btn-review"
                                onClick={() => setActiveNav("doctor-verification")}
                              >
                                Review
                              </button>
                            </div>
                          </div>
                        ))
                      : pendingInterpreters.map((int) => (
                          <div key={int.id} className="admin-verification-item">
                            <div className="admin-verify-user">
                              <div
                                className="admin-verify-avatar"
                                style={{ backgroundColor: `${int.color}15`, color: int.color }}
                              >
                                {int.initials}
                              </div>
                              <div className="admin-verify-details">
                                <span className="admin-verify-name">{int.name}</span>
                                <span className="admin-verify-sub">
                                  {int.languages} • {int.certification}
                                </span>
                              </div>
                            </div>

                            <div className="admin-verify-actions">
                              <span className="admin-status-tag pending">{int.status}</span>
                              <button
                                className="admin-btn-review"
                                onClick={() => setActiveNav("interpreter-verification")}
                              >
                                Review
                              </button>
                            </div>
                          </div>
                        ))}
                  </div>
                </div>

                {/* 6. Recent Activity Section */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <div className="admin-card-title-group">
                      <h3>Recent Activity</h3>
                      <p>Live stream of platform events</p>
                    </div>
                  </div>

                  <div className="admin-activity-timeline">
                    {recentActivities.map((act) => {
                      const Icon = act.icon;
                      return (
                        <div key={act.id} className="admin-activity-item">
                          <div className={`admin-activity-icon ${act.type}`}>
                            <Icon size={16} />
                          </div>
                          <div className="admin-activity-content">
                            <div className="admin-activity-text">{act.text}</div>
                            <div className="admin-activity-time">
                              <Clock size={12} />
                              <span>{act.time}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
