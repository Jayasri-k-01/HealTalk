import API from "./api";

/**
 * Fetch authenticated patient's clinical context for the AI health assistant
 */
export const fetchPatientAssistantContext = async () => {
  try {
    const response = await API.get("/assistant/context");
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to fetch patient context";
    throw new Error(message);
  }
};

/**
 * Send a query to the AI health assistant
 * @param {string} message - Patient query
 * @param {string} language - Target language (e.g. English, Spanish, Hindi, French)
 */
export const sendAssistantMessage = async (message, language) => {
  try {
    const response = await API.post("/assistant/chat", { message, language });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to get AI health response";
    throw new Error(message);
  }
};

/**
 * Fetch chat conversation history with the assistant
 */
export const fetchAssistantHistory = async () => {
  try {
    const response = await API.get("/assistant/history");
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to load chat history";
    throw new Error(message);
  }
};

/**
 * Clear assistant conversation history
 */
export const clearAssistantHistory = async () => {
  try {
    const response = await API.delete("/assistant/history");
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to clear chat history";
    throw new Error(message);
  }
};
