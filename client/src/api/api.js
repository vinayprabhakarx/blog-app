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

// Add auth token only to authenticated routes
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth?.token;

    // List of public routes that don't need authentication
    const publicRoutes = ["/blogs", "/categories", "/blogs/author"];

    // Check if the current route is not in public routes
    const needsAuth = !publicRoutes.some((route) =>
      config.url.startsWith(route)
    );

    if (token && needsAuth) {
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
