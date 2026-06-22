import axios from "axios";

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
    // Get token from localStorage to avoid circular dependencies
    const token = localStorage.getItem("token");

    const publicGetRoutes = [
      "/blogs?",
      "/blogs/author",
      "/categories",
      "/auth/verify-email",
      "/auth/forgot-password",
      "/auth/reset-password",
    ];

    // Check if this is a public GET request
    const _isPublicGetRequest =
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

    // Always attach token if available so backend can identify admins on public endpoints.
    if (token) {
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
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
      const isAuthPage = currentPath === "/login" || currentPath === "/signup";
      const isVerifyPage = currentPath.startsWith("/verify-email") || currentPath.startsWith("/resend-email");
      const isAuthEndpoint = 
        error.config?.url?.includes("/auth/login") || 
        error.config?.url?.includes("/auth/register") ||
        error.config?.url?.includes("/auth/verify-email");

      // If we are already on the login page, just clear the token to be safe
      if (isAuthPage) {
        localStorage.removeItem("token");
        return Promise.reject(error);
      }

      // If on verify-email or resend-email page, don't redirect - let the page handle the error
      if (isVerifyPage) {
        return Promise.reject(error);
      }

      // If the error comes from a login attempt, we don't redirect (let the form show the error)
      if (isAuthEndpoint) {
         return Promise.reject(error);
      }
      
      // For all other 401s (expired token, invalid token on protected route)
      // We must clear the token and force a redirect to login.
      console.warn("Session expired or invalid token. Logging out...");
      localStorage.removeItem("token");
      
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
