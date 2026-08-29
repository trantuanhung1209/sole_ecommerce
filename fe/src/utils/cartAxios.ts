import axios from "axios";

function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const cartAxios = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api`,
  timeout: 60000,
  withCredentials: true,
});

cartAxios.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase();
  if (method && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrf = getCsrfToken();
    if (csrf) {
      config.headers.set("X-XSRF-TOKEN", csrf);
    }
  }
  const guestId = localStorage.getItem("guest_cart_id");
  if (guestId) {
    config.headers.set("X-Guest-Cart-Id", guestId);
  }
  return config;
});

cartAxios.interceptors.response.use(
  (response) => {
    const guestHeader = response.headers["x-guest-cart-id"];
    if (typeof guestHeader === "string" && guestHeader) {
      localStorage.setItem("guest_cart_id", guestHeader);
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export default cartAxios;
