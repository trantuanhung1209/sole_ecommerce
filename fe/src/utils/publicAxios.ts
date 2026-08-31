import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/** Default for catalog/auth; AI calls override per-request. */
export const PUBLIC_API_TIMEOUT_MS = 30_000;
/** OpenAI chat + tools + Whisper/Vision can exceed 30s. */
export const AI_API_TIMEOUT_MS = 120_000;

// Create public axios instance for login/register
const publicAxios = axios.create({
  baseURL: `${API_BASE_URL}/api`, // Add /api prefix
  withCredentials: true, // Để nhận cookies sau khi đăng ký/đăng nhập
  timeout: PUBLIC_API_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

publicAxios.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase();
  if (method && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrf = getCsrfToken();
    if (csrf) {
      config.headers.set("X-XSRF-TOKEN", csrf);
    }
  }
  return config;
});

// Response interceptor - Selective error handling
publicAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Không log error 401 từ validate session (hành vi bình thường khi chưa đăng nhập)
    const isValidateSessionUnauthorized =
      error.config?.url?.includes("/api/v1/auth/validate") &&
      error.response?.status === 401;

    if (!isValidateSessionUnauthorized) {
      console.error(
        "Public API Error:",
        error.response?.data?.message || error.message
      );
    }

    return Promise.reject(error);
  }
);

export default publicAxios;
