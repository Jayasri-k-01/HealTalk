import API from "./api";

/**
 * Fetch all prescriptions for the authenticated user (doctor or patient) from MongoDB
 */
export const fetchPrescriptions = async () => {
  try {
    const response = await API.get("/prescriptions");
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to fetch prescriptions";
    throw new Error(message);
  }
};

export const fetchDoctorPrescriptions = fetchPrescriptions;

/**
 * Create and save a new prescription to MongoDB
 */
export const createPrescription = async (prescriptionData) => {
  try {
    const response = await API.post("/prescriptions", prescriptionData);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to issue prescription";
    throw new Error(message);
  }
};

/**
 * Fetch single prescription details by ID
 */
export const fetchPrescriptionById = async (id) => {
  try {
    const response = await API.get(`/prescriptions/${id}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to fetch prescription details";
    throw new Error(message);
  }
};

/**
 * Update status of a prescription
 */
export const updatePrescriptionStatus = async (id, status) => {
  try {
    const response = await API.patch(`/prescriptions/${id}/status`, { status });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to update prescription status";
    throw new Error(message);
  }
};
