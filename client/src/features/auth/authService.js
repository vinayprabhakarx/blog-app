import api from "../../api/api.js";

const authService = {
  // Login
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  // Register
  register: async (userData) => {
    const formData = new FormData();
    Object.keys(userData).forEach((key) => formData.append(key, userData[key]));
    const response = await api.post("/auth/register", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await api.post("/auth/verify-email", { token });
    return response.data;
  },

  // Resend verification
  resendVerification: async (email) => {
    const response = await api.post("/auth/resend-verification", { email });
    return response.data;
  },

  // Google authentication
  googleAuth: async (tokenData) => {
    const response = await api.post("/auth/google", tokenData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put("/users/change-password", passwordData);
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem("token");
  },
};

export default authService;
