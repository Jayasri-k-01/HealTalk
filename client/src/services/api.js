import axios from "axios";

// Determine base API URL:
// 1. If VITE_API_URL is configured, normalize it and ensure it points to /api.
// 2. Otherwise default to "/api" (which Vercel / Vite proxies to backend).
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    let url = String(import.meta.env.VITE_API_URL).trim().replace(/\/+$/, "");
    if (!url.endsWith("/api")) {
      url = `${url}/api`;
    }
    return url;
  }
  // When running locally in dev mode, use Vite proxy /api
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ) {
    return "/api";
  }
  // When running on production (e.g. Vercel), connect directly to the live Render backend
  return "https://healtalk-pv6t.onrender.com/api";
};

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token if present
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("healtalk_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
