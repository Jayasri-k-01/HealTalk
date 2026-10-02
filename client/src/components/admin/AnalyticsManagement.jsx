import { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  Stethoscope,
  Globe,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  RefreshCw,
  Loader2,
  AlertCircle,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Download,
} from "lucide-react";
import { getAdminAnalytics } from "../../services/adminService";

// Custom Tooltip for Recharts matching HealTalk design
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="analytics-tooltip-card">
        <div className="analytics-tooltip-header">{label}</div>
        <div className="analytics-tooltip-body">
          {payload.map((item, index) => (
            <div key={`tooltip-${index}`} className="analytics-tooltip-row">
              <span
                className="analytics-tooltip-dot"
                style={{ backgroundColor: item.color || item.fill }}
              />
              <span className="analytics-tooltip-name">{item.name}:</span>
              <span className="analytics-tooltip-value">
                {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for User Distribution Pie Chart
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="analytics-tooltip-card">
        <div className="analytics-tooltip-header" style={{ color: data.payload.color }}>
          {data.name}
        </div>
        <div className="analytics-tooltip-body">
          <div className="analytics-tooltip-row">
            <span className="analytics-tooltip-name">Count:</span>
            <span className="analytics-tooltip-value">{data.value?.toLocaleString()}</span>
          </div>
          {data.payload.percentage && (
            <div className="analytics-tooltip-row">
              <span className="analytics-tooltip-name">Share:</span>
              <span className="analytics-tooltip-value">{data.payload.percentage}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

function AnalyticsManagement() {
  const [timeframe, setTimeframe] = useState("7days");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Fetch analytics data directly from real MongoDB backend
  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminAnalytics(timeframe);
      if (res?.success && res?.data) {
        setAnalyticsData(res.data);
      } else {
        throw new Error("Failed to load analytics records");
      }
    } catch (err) {
      console.error("Error loading analytics:", err);
      setError("Unable to load platform analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const summary = analyticsData?.summary;
  const appointmentStatus = analyticsData?.appointmentStatus || [];
  const userDistribution = analyticsData?.userDistribution || [];
  const trendData = analyticsData?.trend || [];
  const specialtyBreakdown = analyticsData?.specialtyBreakdown || [];

  const totalUsersCount = userDistribution.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <div className="admin-analytics-page">
      {/* 1. HEADER WITH TIMEFRAME & CONTROLS */}
      <div className="admin-analytics-header">
        <div>
          <div className="admin-date-indicator">
            <span className="admin-date-chip">
              <Activity size={14} />
              <span>Platform Intelligence</span>
            </span>
          </div>
          <h2 className="admin-section-heading">Analytics & Performance</h2>
          <p className="admin-section-sub">
            Track real-time healthcare metrics, user growth patterns, and consultation volume trends.
          </p>
        </div>

        <div className="admin-header-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Timeframe Select Dropdown */}
          <div className="apt-custom-select-wrapper">
            <label className="apt-select-label" htmlFor="analytics-timeframe">
              <CalendarDays size={14} className="apt-select-lead-icon" />
              <span>Range:</span>
            </label>
            <div className="apt-select-field-box">
              <select
                id="analytics-timeframe"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="apt-custom-select"
                style={{ minWidth: "150px" }}
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            className="admin-notif-btn"
            onClick={loadAnalytics}
            title="Refresh Analytics Data"
            aria-label="Refresh Analytics"
          >
            <RefreshCw size={17} className={loading ? "spin-icon" : ""} />
          </button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="admin-alert-banner error" style={{ marginBottom: "20px" }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
          <button
            type="button"
            onClick={loadAnalytics}
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

      {/* 2. SUMMARY CARDS (4 METRICS: PATIENTS, DOCTORS, INTERPRETERS, APPOINTMENTS) */}
      <section className="admin-stats-grid" style={{ marginBottom: "24px" }}>
        {/* Total Patients */}
        <div className="admin-stat-card patients">
          <div className="admin-stat-top">
            <div className="admin-stat-icon-box">
              <Users size={22} />
            </div>
            {summary?.patientsGrowth && (
              <span className="admin-stat-pill" style={{ background: "#e0f2fe", color: "#0369a1" }}>
                <TrendingUp size={12} style={{ marginRight: "3px" }} />
                {summary.patientsGrowth}
              </span>
            )}
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-number">
              {loading ? <Loader2 size={20} className="spin-icon" /> : summary?.totalPatients?.toLocaleString() || 0}
            </div>
            <div className="admin-stat-label">Total Patients</div>
          </div>
          <div className="admin-stat-subtext">
            <ArrowUpRight size={13} style={{ color: "#0284c7" }} />
            <span>Registered patient accounts</span>
          </div>
        </div>

        {/* Total Doctors */}
        <div className="admin-stat-card doctors">
          <div className="admin-stat-top">
            <div className="admin-stat-icon-box">
              <Stethoscope size={22} />
            </div>
            {summary?.doctorsGrowth && (
              <span className="admin-stat-pill" style={{ background: "#ccfbf1", color: "#0f766e" }}>
                <TrendingUp size={12} style={{ marginRight: "3px" }} />
                {summary.doctorsGrowth}
              </span>
            )}
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-number">
              {loading ? <Loader2 size={20} className="spin-icon" /> : summary?.totalDoctors?.toLocaleString() || 0}
            </div>
            <div className="admin-stat-label">Total Doctors</div>
          </div>
          <div className="admin-stat-subtext">
            <ArrowUpRight size={13} style={{ color: "#0f766e" }} />
            <span>Verified medical practitioners</span>
          </div>
        </div>

        {/* Total Interpreters */}
        <div className="admin-stat-card interpreters">
          <div className="admin-stat-top">
            <div className="admin-stat-icon-box">
              <Globe size={22} />
            </div>
            {summary?.interpretersGrowth && (
              <span className="admin-stat-pill" style={{ background: "#f3e8ff", color: "#7c3aed" }}>
                <TrendingUp size={12} style={{ marginRight: "3px" }} />
                {summary.interpretersGrowth}
              </span>
            )}
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-number">
              {loading ? <Loader2 size={20} className="spin-icon" /> : summary?.totalInterpreters?.toLocaleString() || 0}
            </div>
            <div className="admin-stat-label">Total Interpreters</div>
          </div>
          <div className="admin-stat-subtext">
            <ArrowUpRight size={13} style={{ color: "#7c3aed" }} />
            <span>Certified multilingual linguists</span>
          </div>
        </div>

        {/* Total Appointments */}
        <div className="admin-stat-card appointments">
          <div className="admin-stat-top">
            <div className="admin-stat-icon-box">
              <Calendar size={22} />
            </div>
            {summary?.appointmentsGrowth && (
              <span className="admin-stat-pill">
                <TrendingUp size={12} style={{ marginRight: "3px" }} />
                {summary.appointmentsGrowth}
              </span>
            )}
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-number">
              {loading ? <Loader2 size={20} className="spin-icon" /> : summary?.totalAppointments?.toLocaleString() || 0}
            </div>
            <div className="admin-stat-label">Total Appointments</div>
          </div>
          <div className="admin-stat-subtext">
            <ArrowUpRight size={13} style={{ color: "#087f8c" }} />
            <span>Telemedicine sessions booked</span>
          </div>
        </div>
      </section>

      {/* 3. CHARTS GRID (APPOINTMENT ANALYTICS & USER ANALYTICS) */}
      <section className="analytics-charts-grid" style={{ marginBottom: "24px" }}>
        {/* SECTION 2: Appointment Analytics (Bar / Column Chart) */}
        <div className="admin-card analytics-chart-card">
          <div className="admin-card-header">
            <div className="admin-card-title-group">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <BarChart3 size={18} style={{ color: "#087f8c" }} />
                <h3>Appointment Analytics</h3>
              </div>
              <p>Breakdown of consultations by current booking status</p>
            </div>
            <span className="admin-stat-pill">Status Breakdown</span>
          </div>

          <div className="analytics-chart-container">
            {loading ? (
              <div className="analytics-chart-loader">
                <Loader2 size={28} className="spin-icon" style={{ color: "#087f8c" }} />
                <span>Loading appointment metrics...</span>
              </div>
            ) : appointmentStatus.length === 0 ? (
              <div className="analytics-chart-empty">
                <AlertCircle size={32} style={{ color: "#94a3b8", marginBottom: "8px" }} />
                <p>No appointment status records available.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={290}>
                <BarChart
                  data={appointmentStatus}
                  margin={{ top: 20, right: 20, left: -10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="status"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomChartTooltip />} cursor={{ fill: "rgba(8, 127, 140, 0.04)" }} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: "12px", fontSize: "12px" }}
                  />
                  <Bar
                    dataKey="count"
                    name="Appointments"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={54}
                  >
                    {appointmentStatus.map((entry, index) => (
                      <Cell key={`bar-cell-${index}`} fill={entry.fill || entry.color || "#087f8c"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* SECTION 3: User Analytics (Donut / Pie Chart) */}
        <div className="admin-card analytics-chart-card">
          <div className="admin-card-header">
            <div className="admin-card-title-group">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <PieIcon size={18} style={{ color: "#7c3aed" }} />
                <h3>User Analytics</h3>
              </div>
              <p>Platform distribution across patients, doctors, and interpreters</p>
            </div>
            <span className="admin-stat-pill" style={{ background: "#f3e8ff", color: "#7c3aed" }}>
              Total: {totalUsersCount.toLocaleString()} Users
            </span>
          </div>

          <div className="analytics-chart-container">
            {loading ? (
              <div className="analytics-chart-loader">
                <Loader2 size={28} className="spin-icon" style={{ color: "#7c3aed" }} />
                <span>Loading user distribution...</span>
              </div>
            ) : userDistribution.length === 0 ? (
              <div className="analytics-chart-empty">
                <AlertCircle size={32} style={{ color: "#94a3b8", marginBottom: "8px" }} />
                <p>No user distribution records available.</p>
              </div>
            ) : (
              <div className="analytics-donut-wrapper">
                <div style={{ flex: 1, minWidth: "220px", height: "290px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Pie
                        data={userDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {userDistribution.map((entry, index) => (
                          <Cell key={`pie-cell-${index}`} fill={entry.fill || entry.color || "#087f8c"} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Custom Donut Legend List */}
                <div className="analytics-donut-legend">
                  {userDistribution.map((item, index) => (
                    <div key={`legend-${index}`} className="analytics-legend-item">
                      <div className="analytics-legend-left">
                        <span
                          className="analytics-legend-dot"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="analytics-legend-name">{item.name}</span>
                      </div>
                      <div className="analytics-legend-right">
                        <span className="analytics-legend-val">{item.value?.toLocaleString()}</span>
                        <span className="analytics-legend-share">({item.percentage || "N/A"})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 4: Appointment Trend Over Time (Area Chart) */}
      <section className="admin-card analytics-trend-card" style={{ marginBottom: "24px" }}>
        <div className="admin-card-header">
          <div className="admin-card-title-group">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <TrendingUp size={18} style={{ color: "#087f8c" }} />
              <h3>Appointment Trend Over Time</h3>
            </div>
            <p>Historical volume trajectory and completed consultation pace</p>
          </div>

          <div className="apt-segmented-tabs" style={{ padding: "3px" }}>
            <button
              type="button"
              className={`apt-tab-button ${timeframe === "7days" ? "active" : ""}`}
              onClick={() => setTimeframe("7days")}
              style={{ padding: "5px 12px", fontSize: "12px" }}
            >
              7 Days
            </button>
            <button
              type="button"
              className={`apt-tab-button ${timeframe === "30days" ? "active" : ""}`}
              onClick={() => setTimeframe("30days")}
              style={{ padding: "5px 12px", fontSize: "12px" }}
            >
              30 Days
            </button>
          </div>
        </div>

        <div className="analytics-chart-container" style={{ padding: "20px" }}>
          {loading ? (
            <div className="analytics-chart-loader" style={{ height: "300px" }}>
              <Loader2 size={30} className="spin-icon" style={{ color: "#087f8c" }} />
              <span>Loading appointment trend curves...</span>
            </div>
          ) : trendData.length === 0 ? (
            <div className="analytics-chart-empty" style={{ height: "300px" }}>
              <AlertCircle size={32} style={{ color: "#94a3b8", marginBottom: "8px" }} />
              <p>No historical trend records found for the selected period.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart
                data={trendData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#087f8c" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#087f8c" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: "14px", fontSize: "12px" }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total Consultations"
                  stroke="#087f8c"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#totalGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Completed Sessions"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#completedGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* 5. SPECIALTY BREAKDOWN TABLE / CARDS */}
      {specialtyBreakdown.length > 0 && (
        <section className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title-group">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Stethoscope size={18} style={{ color: "#087f8c" }} />
                <h3>Consultation Volume by Medical Specialty</h3>
              </div>
              <p>Performance and consultation demand across medical disciplines</p>
            </div>
          </div>

          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Medical Specialty</th>
                  <th>Consultations Booked</th>
                  <th>Estimated Value</th>
                  <th>Demand Share</th>
                </tr>
              </thead>
              <tbody>
                {specialtyBreakdown.map((spec, index) => {
                  const maxConsultations = 100;
                  const percent = Math.min(100, Math.round((spec.consultations / maxConsultations) * 100));
                  return (
                    <tr key={`spec-${index}`}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background: "rgba(8, 127, 140, 0.1)",
                              color: "#087f8c",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Stethoscope size={15} />
                          </div>
                          <span style={{ fontWeight: 600, color: "#0f172a" }}>{spec.specialty}</span>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: "#0f172a" }}>{spec.consultations}</strong>
                        <span style={{ color: "#64748b", fontSize: "12px", marginLeft: "4px" }}>sessions</span>
                      </td>
                      <td>
                        <span style={{ color: "#059669", fontWeight: 600 }}>{spec.revenue}</span>
                      </td>
                      <td style={{ width: "35%" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              flex: 1,
                              height: "8px",
                              background: "#f1f5f9",
                              borderRadius: "999px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${percent}%`,
                                height: "100%",
                                background: "linear-gradient(90deg, #087f8c 0%, #0f766e 100%)",
                                borderRadius: "999px",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569", minWidth: "35px" }}>
                            {percent}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default AnalyticsManagement;
