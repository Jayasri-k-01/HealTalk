import API from "./api";

/**
 * Register a new user
 * @param {Object} userData - { name, email, password, role, language }
 */
export const registerUser = async (userData) => {
  try {
    const cleanData = {
      ...userData,
      email: userData?.email ? userData.email.trim().toLowerCase() : "",
    };
    const response = await API.post("/auth/register", cleanData);
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error.response?.status) {
      throw new Error(`Registration failed (HTTP ${error.response.status}): ${error.response.statusText || "Request error"}`);
    }
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      throw new Error("Connection timeout: Backend server took too long to respond.");
    }
    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network Error: Could not connect to backend server. Please verify backend is running and reachable.");
    }
    throw new Error(error.message || "Registration failed. Please try again.");
  }
};

/**
 * Login user
 * @param {Object} credentials - { email, password }
 */
export const loginUser = async (credentials) => {
  try {
    const cleanCredentials = {
      email: credentials?.email ? credentials.email.trim().toLowerCase() : "",
      password: credentials?.password,
    };
    const response = await API.post("/auth/login", cleanCredentials);
    return response.data;
  } catch (error) {
    // If the backend returned a specific error message, display it
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    // If HTTP error status received from backend
    if (error.response?.status) {
      if (error.response.status === 401) {
        throw new Error("Invalid email or password. Please verify your credentials.");
      }
      throw new Error(`Server returned error (${error.response.status}): ${error.response.statusText || "Request failed"}`);
    }
    // Connection timeout
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      throw new Error("Connection timeout: The backend server took too long to respond. Please check your network.");
    }
    // Network / unreachable server error
    if (error.message === "Network Error" || !error.response) {
      throw new Error(
        "Network Error: Unable to connect to HealTalk backend server. Please check your Wi-Fi network and verify the backend is running."
      );
    }
    throw new Error(error.message || "Login failed. Please check your credentials and network connection.");
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
    const message =
      error.response?.data?.message ||
      (error.response
        ? `Failed to fetch profile (HTTP ${error.response.status})`
        : "Network error: Unable to reach backend server.");
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
