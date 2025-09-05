import axios from "axios";

const api = axios.create({
  baseURL: `${
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
  }/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Lazy import to avoid circular dependency
let store = null;
let logout = null;

const getStore = async () => {
  if (!store) {
    const storeModule = await import("../app/store");
    store = storeModule.store;
  }
  return store;
};

const getLogout = async () => {
  if (!logout) {
    const authModule = await import("../features/auth/authSlice");
    logout = authModule.logout;
  }
  return logout;
};

// Add auth token to requests that need authentication
api.interceptors.request.use(
  async (config) => {
    const storeInstance = await getStore();
    const reduxToken = storeInstance.getState().auth?.token;
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
  async (error) => {
    if (error.response && error.response.status === 401) {
      const isPasswordChangeError =
        error.config?.url?.includes("change-password");

      if (!isPasswordChangeError) {
        const storeInstance = await getStore();
        const logoutAction = await getLogout();
        storeInstance.dispatch(logoutAction());
        console.error("Unauthorized access. User has been logged out.");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
