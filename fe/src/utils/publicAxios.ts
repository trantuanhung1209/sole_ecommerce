import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Create public axios instance for login/register
const publicAxios = axios.create({
  baseURL: `${API_BASE_URL}/api`, // Add /api prefix
  withCredentials: true, // Để nhận cookies sau khi đăng ký/đăng nhập
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
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
