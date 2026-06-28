import axios from "axios";

// Inject Redux store to avoid circular dependency
let store;
export const injectStore = (_store) => {
  store = _store;
};

const api = axios.create({
  baseURL: `${
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
  }/api`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Crucial for sending/receiving HttpOnly cookies
});

// Add auth token to requests that need authentication
api.interceptors.request.use(
  (config) => {
    // Get token from Redux store memory
    const token = store ? store.getState().auth.token : null;

    const publicGetRoutes = [
      "/blogs?",
      "/blogs/author",
      "/category",
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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      const isAuthEndpoint = 
        originalRequest?.url?.includes("/auth/login") || 
        originalRequest?.url?.includes("/auth/register") ||
        originalRequest?.url?.includes("/auth/refresh") ||
        originalRequest?.url?.includes("/auth/verify-email");

      // If the error comes from an auth endpoint, don't try to refresh
      if (isAuthEndpoint) {
         return Promise.reject(error);
      }

      if (!originalRequest._retry) {
        if (isRefreshing) {
          return new Promise(function (resolve, reject) {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers["Authorization"] = "Bearer " + token;
              return api(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        return new Promise(function (resolve, reject) {
          axios
            .post(`${api.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true })
            .then((res) => {
              const { token } = res.data;
              
              // Update Redux state with new token
              if (store) {
                store.dispatch({ type: "auth/refreshToken/fulfilled", payload: { token } });
              }
              
              originalRequest.headers["Authorization"] = "Bearer " + token;
              processQueue(null, token);
              resolve(api(originalRequest));
            })
            .catch((err) => {
              processQueue(err, null);
              
              // Force logout if refresh fails
              if (store) {
                store.dispatch({ type: "auth/logout" });
              }
              
              if (typeof window !== "undefined") {
                window.location.href = "/login";
              }
              
              reject(err);
            })
            .finally(() => {
              isRefreshing = false;
            });
        });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
