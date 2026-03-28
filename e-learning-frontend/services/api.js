import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : "/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function resolveFileUrl(filePath) {
  if (!filePath) {
    return "#";
  }

  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  return API_BASE_URL ? `${API_BASE_URL}${filePath}` : filePath;
}

export function formatError(error) {
  if (error.code === "ERR_NETWORK") {
    return "Cannot reach the backend server. Make sure backend and frontend are both running, then refresh the page.";
  }

  return error.response?.data?.message || error.message || "Something went wrong.";
}

export default api;
