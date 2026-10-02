import API from "./api";

/**
 * Register a new user
 * @param {Object} userData - { name, email, password, role, language }
 */
export const registerUser = async (userData) => {
  try {
    const response = await API.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Registration failed. Please try again.";
    throw new Error(message);
  }
};

/**
 * Login user
 * @param {Object} credentials - { email, password }
 */
export const loginUser = async (credentials) => {
  try {
    const response = await API.post("/auth/login", credentials);
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Invalid credentials. Please try again.";
    throw new Error(message);
  }
};

/**
 * Fetch authenticated user profile from backend
 */
export const fetchMyProfile = async () => {
  try {
    const response = await API.get("/auth/me");
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to fetch profile";
    throw new Error(message);
  }
};

/**
 * Update patient profile preferences and settings
 * @param {Object} settingsData - { language, autoRequestInterpreter, emergencyContactPhone }
 */
export const updatePatientSettings = async (settingsData) => {
  try {
    const response = await API.put("/auth/profile/settings", settingsData);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to update settings";
    throw new Error(message);
  }
};

/**
 * Update primary consultation language
 * @param {string} language - Target language string
 */
export const updatePatientLanguage = async (language) => {
  try {
    const response = await API.put("/auth/profile/language", { language });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to update language";
    throw new Error(message);
  }
};
