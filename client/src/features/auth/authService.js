import api from "@/api/api.js";

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

  // Link Google Auth
  linkGoogleAuth: async (tokenData) => {
    const response = await api.post("/auth/link-google", tokenData);
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
  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error(err);
    }
  },

  // Refresh token
  refresh: async () => {
    const response = await api.post("/auth/refresh");
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post("/auth/forgot-password", { email });
    // Return the success message from the server or a default one
    return response.data || { message: "If your email exists, you will receive a password reset link." };
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    if (!token) {
      throw new Error('Reset token is required');
    }
    
    try {
      const response = await api.post("/auth/reset-password", { 
        token, 
        newPassword 
      });
      return response.data;
    } catch (error) {
      // Handle specific error cases
      if (error.response) {
        // Handle 400 Bad Request (validation errors)
        if (error.response.status === 400) {
          throw new Error(error.response.data.message || 'Invalid request');
        }
        // Handle 401 Unauthorized (invalid/expired token)
        if (error.response.status === 401) {
          throw new Error('Your password reset link has expired. Please request a new one.');
        }
      }
      throw error;
    }
  },

  // Validate reset token
  validateResetToken: async (token) => {
    const response = await api.get(`/auth/validate-reset-token/${token}`);
    return response.data;
  },
};

export default authService;
