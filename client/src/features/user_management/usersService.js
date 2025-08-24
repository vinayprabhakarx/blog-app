import api from "../../api/api.js";

const userService = {
  // Get user by ID
  getById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Get multiple users by IDs (batch request)
  getByIds: async (userIds) => {
    const response = await api.post("/users/batch", { userIds });
    return response.data;
  },

  updateProfile: async (userId, userData) => {
    // userData should be a FormData object for file uploads
    const response = await api.put(`/users/update/${userId}`, userData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  getPublicProfile: async (username) => {
    const response = await api.get(`/users/public-profile/${username}`);
    return response.data;
  },

  getAllUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/users/all?${queryString}` : "/users/all";
    const response = await api.get(endpoint);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  // Search users (for mentions, etc.)
  search: async (query, limit = 10) => {
    const response = await api.get(
      `/users/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return response.data;
  },

  // Change user role (Admin only)
  changeUserRole: async (userId, role) => {
    const response = await api.put(`/users/admin/change-role/${userId}`, {
      role,
    });
    return response.data; // { success, message, user }
  },

  // Remove profile image
  removeProfileImage: async (userId) => {
    const response = await api.delete(`/users/remove-profile-image/${userId}`);
    return response.data;
  },

  // Get admin statistics
  getAdminStats: async () => {
    const response = await api.get("/users/admin/stats");
    return response.data;
  },

  // Get monthly performance data
  getMonthlyPerformance: async () => {
    const response = await api.get("/users/admin/monthly-performance");
    return response.data;
  },

  // Get recent activities
  getRecentActivities: async () => {
    const response = await api.get("/users/admin/recent-activities");
    return response.data;
  },
};

export default userService;
