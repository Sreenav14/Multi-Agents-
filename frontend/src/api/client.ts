// frontend/src/api/client.ts
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: simple interceptor for logging / future auth
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API error:", error?.response || error);
    return Promise.reject(error);
  }
);
