import API from "./api";

/**
 * Fetch authenticated interpreter's complete profile
 */
export const fetchInterpreterProfile = async () => {
  try {
    const response = await API.get("/interpreter/profile");
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      (error.response
        ? `Failed to load profile (HTTP ${error.response.status})`
        : "Network error: Unable to reach HealTalk backend server.");
    throw new Error(message);
  }
};

/**
 * Update editable personal, professional, language, and availability details
 * @param {Object} profileData
 */
export const updateInterpreterProfile = async (profileData) => {
  try {
    const response = await API.put("/interpreter/profile", profileData);
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      (error.response
        ? `Failed to save changes (HTTP ${error.response.status})`
        : "Network error: Unable to connect to server.");
    throw new Error(message);
  }
};

/**
 * Upload profile photo file
 * @param {File} file
 */
export const uploadProfilePhoto = async (file) => {
  try {
    const formData = new FormData();
    formData.append("photo", file);
    const response = await API.post("/interpreter/profile/photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to upload profile photo";
    throw new Error(message);
  }
};

/**
 * Upload certification document file (PDF or Image)
 * @param {File} file
 */
export const uploadCertificationDocument = async (file) => {
  try {
    const formData = new FormData();
    formData.append("document", file);
    const response = await API.post("/interpreter/profile/document", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to upload certification document";
    throw new Error(message);
  }
};

/**
 * Quick update of availability status, working days, and time slots
 * @param {Object} availabilityData - { availabilityStatus, workingDays, availableTimeSlots, timeZone }
 */
export const updateInterpreterAvailability = async (availabilityData) => {
  try {
    const response = await API.patch("/interpreter/availability", availabilityData);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to update availability";
    throw new Error(message);
  }
};
