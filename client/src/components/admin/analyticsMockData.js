// ============================================================================
// HEALTALK ADMIN ANALYTICS - MOCK DATA
// ============================================================================
// TEMP: replace with API call (GET /api/admin/analytics)
// All data structures below match the exact API response contract.

export const mockAnalyticsData = {
  // 1. Summary Overview Cards Data
  summary: {
    totalPatients: 1428,
    totalDoctors: 84,
    totalInterpreters: 36,
    totalAppointments: 1892,
    patientsGrowth: "+12.5%",
    doctorsGrowth: "+4.2%",
    interpretersGrowth: "+8.0%",
    appointmentsGrowth: "+18.3%",
  },

  // 2. Appointment Analytics by Status (Bar / Column Chart)
  appointmentStatus: [
    { status: "Upcoming", count: 42, color: "#0284c7", fill: "#0284c7" },
    { status: "Completed", count: 128, color: "#10b981", fill: "#10b981" },
    { status: "Cancelled", count: 18, color: "#ef4444", fill: "#ef4444" },
  ],

  // 3. User Analytics Distribution (Donut / Pie Chart)
  userDistribution: [
    { name: "Patients", value: 1428, color: "#0284c7", fill: "#0284c7", percentage: "78%" },
    { name: "Doctors", value: 84, color: "#0f766e", fill: "#0f766e", percentage: "15%" },
    { name: "Interpreters", value: 36, color: "#7c3aed", fill: "#7c3aed", percentage: "7%" },
  ],

  // 4. Appointment Trend Over Time (Area / Line Chart)
  appointmentTrends: {
    last7Days: [
      { date: "Sep 17", total: 22, completed: 18, upcoming: 3, cancelled: 1 },
      { date: "Sep 18", total: 28, completed: 22, upcoming: 4, cancelled: 2 },
      { date: "Sep 19", total: 35, completed: 29, upcoming: 5, cancelled: 1 },
      { date: "Sep 20", total: 29, completed: 24, upcoming: 3, cancelled: 2 },
      { date: "Sep 21", total: 40, completed: 33, upcoming: 5, cancelled: 2 },
      { date: "Sep 22", total: 45, completed: 38, upcoming: 5, cancelled: 2 },
      { date: "Sep 23", total: 48, completed: 36, upcoming: 9, cancelled: 3 },
    ],
    last30Days: [
      { date: "Week 1", total: 140, completed: 118, upcoming: 14, cancelled: 8 },
      { date: "Week 2", total: 175, completed: 148, upcoming: 18, cancelled: 9 },
      { date: "Week 3", total: 210, completed: 178, upcoming: 22, cancelled: 10 },
      { date: "Week 4", total: 245, completed: 206, upcoming: 26, cancelled: 13 },
    ],
  },

  // 5. Specialty Consultation Breakdown
  specialtyBreakdown: [
    { specialty: "Cardiology", consultations: 58, revenue: "$5,800" },
    { specialty: "General Medicine", consultations: 92, revenue: "$4,600" },
    { specialty: "Neurology", consultations: 34, revenue: "$5,100" },
    { specialty: "Pediatrics", consultations: 48, revenue: "$3,840" },
    { specialty: "Dermatology", consultations: 41, revenue: "$3,690" },
    { specialty: "Psychiatry", consultations: 36, revenue: "$4,320" },
  ],
};

/**
 * Async fetch simulation for Analytics Data
 * TEMP: replace with API call e.g. API.get('/admin/analytics')
 */
export const fetchAnalyticsData = async (timeframe = "7days") => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          ...mockAnalyticsData,
          trend:
            timeframe === "30days"
              ? mockAnalyticsData.appointmentTrends.last30Days
              : mockAnalyticsData.appointmentTrends.last7Days,
        },
      });
    }, 400);
  });
};
