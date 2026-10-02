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
