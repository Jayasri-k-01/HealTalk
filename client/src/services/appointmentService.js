import API from "./api";

/**
 * Book a new appointment
 * @param {Object} appointmentData - { doctorId, date, time, type, interpreterRequested, interpreterLanguage, reason }
 */
export const bookAppointment = async (appointmentData) => {
  try {
    const response = await API.post("/appointments", appointmentData);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to book appointment";
    throw new Error(message);
  }
};

/**
 * Fetch patient's booked appointments
 */
export const fetchMyAppointments = async () => {
  try {
    const response = await API.get("/appointments/my");
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to fetch your appointments";
    throw new Error(message);
  }
};

/**
 * Fetch doctor's appointments from MongoDB
 */
export const fetchDoctorAppointments = async () => {
  try {
    const response = await API.get("/appointments/doctor");
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to fetch doctor appointments";
    throw new Error(message);
  }
};

/**
 * Cancel an appointment
 * @param {string} id - Appointment ID
 */
export const cancelAppointment = async (id) => {
  try {
    const response = await API.put(`/appointments/${id}/cancel`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to cancel appointment";
    throw new Error(message);
  }
};

/**
 * Confirm / Accept an appointment (Doctor or Admin)
 * @param {string} id - Appointment ID
 */
export const confirmAppointment = async (id) => {
  try {
    const response = await API.put(`/appointments/${id}/confirm`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to confirm appointment";
    throw new Error(message);
  }
};

/**
 * Fetch appointment by ID with patient data and past records
 * @param {string} id - Appointment ID
 */
export const fetchAppointmentById = async (id) => {
  try {
    const response = await API.get(`/appointments/${id}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to fetch appointment details";
    throw new Error(message);
  }
};

/**
 * Mark appointment as completed
 * @param {string} id - Appointment ID
 * @param {string} notes - Optional clinical notes
 */
export const completeAppointment = async (id, notes = "") => {
  try {
    const response = await API.put(`/appointments/${id}/complete`, { notes });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to complete appointment";
    throw new Error(message);
  }
};

/**
 * Request interpreter for an appointment
 * @param {string} id - Appointment ID
 * @param {string} language - Target language
 */
export const requestAppointmentInterpreter = async (id, language) => {
  try {
    const response = await API.put(`/appointments/${id}/interpreter`, { language });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to request interpreter";
    throw new Error(message);
  }
};

/**
 * Fetch available interpreter requests matching logged-in interpreter's languages
 */
export const fetchAvailableInterpreterRequests = async () => {
  try {
    const response = await API.get("/appointments/interpreter/requests");
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to fetch interpreter requests";
    throw new Error(message);
  }
};

/**
 * Fetch assignments for logged-in interpreter
 */
export const fetchMyInterpreterAssignments = async () => {
  try {
    const response = await API.get("/appointments/interpreter/my");
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to fetch your assigned interpreter sessions";
    throw new Error(message);
  }
};

/**
 * Accept an interpreter request
 * @param {string} id - Appointment ID
 */
export const acceptInterpreterRequest = async (id) => {
  try {
    const response = await API.put(`/appointments/${id}/interpreter/accept`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to accept interpreter request";
    throw new Error(message);
  }
};

/**
 * Reject or release an interpreter assignment
 * @param {string} id - Appointment ID
 */
export const rejectInterpreterRequest = async (id) => {
  try {
    const response = await API.put(`/appointments/${id}/interpreter/reject`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to decline interpreter request";
    throw new Error(message);
  }
};

