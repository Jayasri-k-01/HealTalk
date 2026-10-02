import API from "./api";

// Fetch real admin dashboard statistics from MongoDB
export const getAdminDashboardStats = async () => {
  const response = await API.get("/admin/dashboard");
  return response.data;
};

// Fetch paginated, searchable, and filtered users
export const getAdminUsers = async ({
  page = 1,
  limit = 10,
  search = "",
  role = "",
  status = "",
} = {}) => {
  const params = new URLSearchParams();
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);
  if (search && search.trim() !== "") params.append("search", search.trim());
  if (role && role !== "all") params.append("role", role);
  if (status && status !== "all") params.append("status", status);

  const response = await API.get(`/admin/users?${params.toString()}`);
  return response.data;
};

// Fetch single user details
export const getUserDetails = async (userId) => {
  const response = await API.get(`/admin/users/${userId}`);
  return response.data;
};

// Update user status (approved, suspended, pending, rejected)
export const updateUserStatus = async (userId, status) => {
  const response = await API.patch(`/admin/users/${userId}/status`, { status });
  return response.data;
};

// ============================================================================
// DOCTOR VERIFICATION API HELPERS (STEP 4)
// ============================================================================

// Fetch doctor verification applications
export const getDoctorApplications = async ({
  status = "pending",
  search = "",
  page = 1,
  limit = 10,
} = {}) => {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (search && search.trim() !== "") params.append("search", search.trim());
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);

  const response = await API.get(`/admin/doctors?${params.toString()}`);
  return response.data;
};

// Fetch single doctor verification details
export const getDoctorVerificationDetails = async (doctorId) => {
  const response = await API.get(`/admin/doctors/${doctorId}`);
  return response.data;
};

// Approve doctor application
export const approveDoctorApplication = async (doctorId) => {
  const response = await API.patch(`/admin/doctors/${doctorId}/approve`);
  return response.data;
};

// Reject doctor application with reason
export const rejectDoctorApplication = async (doctorId, rejectionReason = "") => {
  const response = await API.patch(`/admin/doctors/${doctorId}/reject`, {
    rejectionReason,
  });
  return response.data;
};

// ============================================================================
// DOCTOR MANAGEMENT API HELPERS (STEP 5)
// ============================================================================

// Fetch verified/managed doctors for Admin Doctors Page from MongoDB
export const getAdminDoctors = async ({
  search = "",
  specialty = "",
  status = "",
  page = 1,
  limit = 100,
} = {}) => {
  const params = new URLSearchParams();
  if (search && search.trim() !== "") params.append("search", search.trim());
  if (specialty && specialty !== "all") params.append("specialty", specialty);
  if (status && status !== "all") params.append("status", status);
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);

  const response = await API.get(`/admin/doctors?${params.toString()}`);
  return response.data;
};

// Fetch single doctor details for Admin Doctors Page from MongoDB
export const getAdminDoctorDetails = async (doctorId) => {
  const response = await API.get(`/admin/doctors/${doctorId}`);
  return response.data;
};

// Update doctor status (approved/suspended) for Admin Doctors Page in MongoDB
export const updateDoctorStatus = async (doctorId, status) => {
  const response = await API.patch(`/admin/doctors/${doctorId}/status`, { status });
  return response.data;
};

// ============================================================================
// INTERPRETER VERIFICATION API HELPERS (STEP 6)
// ============================================================================

// Fetch interpreter verification applications
export const getInterpreterApplications = async ({
  status = "pending",
  search = "",
  page = 1,
  limit = 10,
} = {}) => {
  const params = new URLSearchParams();
  params.append("role", "interpreter");
  if (status && status !== "all") params.append("status", status);
  if (search && search.trim() !== "") params.append("search", search.trim());
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);

  const response = await API.get(`/admin/users?${params.toString()}`);
  return response.data;
};

// Approve interpreter application
export const approveInterpreterApplication = async (interpreterId) => {
  const response = await API.patch(`/admin/users/${interpreterId}/status`, {
    status: "approved",
  });
  return response.data;
};

// Reject interpreter application with reason
export const rejectInterpreterApplication = async (
  interpreterId,
  rejectionReason = ""
) => {
  const response = await API.patch(`/admin/users/${interpreterId}/status`, {
    status: "rejected",
    rejectionReason,
  });
  return response.data;
};

// ============================================================================
// INTERPRETER MANAGEMENT API HELPERS (STEP 7)
// ============================================================================

// Fetch verified/managed interpreters for Admin Interpreters Page from MongoDB
export const getAdminInterpreters = async ({
  search = "",
  language = "",
  status = "",
  page = 1,
  limit = 100,
} = {}) => {
  const params = new URLSearchParams();
  if (search && search.trim() !== "") params.append("search", search.trim());
  if (language && language !== "all") params.append("language", language);
  if (status && status !== "all") params.append("status", status);
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);

  const response = await API.get(`/admin/interpreters?${params.toString()}`);
  return response.data;
};

// Fetch single interpreter details for Admin Interpreters Page from MongoDB
export const getAdminInterpreterDetails = async (interpreterId) => {
  const response = await API.get(`/admin/interpreters/${interpreterId}`);
  return response.data;
};

// Update interpreter status (approved/suspended) for Admin Interpreters Page in MongoDB
export const updateInterpreterStatus = async (interpreterId, status) => {
  const response = await API.patch(`/admin/interpreters/${interpreterId}/status`, { status });
  return response.data;
};

// ============================================================================
// APPOINTMENTS MANAGEMENT API HELPERS (ADMIN TODAY'S APPOINTMENTS)
// ============================================================================

// Fetch appointments from MongoDB (supports date, status, search, type, view)
export const getAdminAppointments = async ({
  date = "",
  status = "",
  search = "",
  type = "",
  view = "",
} = {}) => {
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  if (status && status !== "all") params.append("status", status);
  if (search && search.trim() !== "") params.append("search", search.trim());
  if (type && type !== "all") params.append("type", type);
  if (view) params.append("view", view);

  const response = await API.get(`/admin/appointments?${params.toString()}`);
  return response.data;
};

// Fetch single appointment details
export const getAdminAppointmentDetails = async (appointmentId) => {
  const response = await API.get(`/admin/appointments/${appointmentId}`);
  return response.data;
};

// Update appointment status (Confirmed, Completed, Cancelled)
export const updateAdminAppointmentStatus = async (appointmentId, status) => {
  const response = await API.patch(`/admin/appointments/${appointmentId}/status`, { status });
  return response.data;
};

// ============================================================================
// ANALYTICS MANAGEMENT API HELPERS (ADMIN)
// ============================================================================

// Fetch aggregated analytics and trends directly from MongoDB backend
export const getAdminAnalytics = async (timeframe = "7days") => {
  const response = await API.get(`/admin/analytics?timeframe=${timeframe}`);
  return response.data;
};




