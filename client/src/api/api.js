import axios from "axios";
import { store } from "../app/store";
import { logout } from "../features/auth/authSlice";

const api = axios.create({
  baseURL: `${
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
  }/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests that need authentication
api.interceptors.request.use(
  (config) => {
    const reduxToken = store.getState().auth?.token;
    const localStorageToken = localStorage.getItem("token");

    // Use Redux token first, fallback to localStorage
    const token = reduxToken || localStorageToken;

    const publicGetRoutes = [
      "/blogs?",
      "/blogs/author",
      "/categories",
      "/auth/verify-email",
      "/auth/forgot-password",
      "/auth/reset-password",
    ];

    // Check if this is a public GET request
    const isPublicGetRequest =
      config.method === "get" &&
      publicGetRoutes.some((route) => {
        if (route === "/blogs?") {
          return (
            config.url === "/blogs" ||
            (config.url.startsWith("/blogs?") &&
              !config.url.includes("/blogs/my-blogs"))
          );
        }
        return config.url.startsWith(route);
      });

    // Add token for all requests except public GET requests
    if (token && !isPublicGetRequest) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const isPasswordChangeError =
        error.config?.url?.includes("change-password");

      if (!isPasswordChangeError) {
        store.dispatch(logout());
        console.error("Unauthorized access. User has been logged out.");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
