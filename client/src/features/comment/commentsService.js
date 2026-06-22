import api from "@/api/api.js";

const commentService = {
  // Get all comments for a blog (with nested structure)
  getByBlog: async (blogId, params = {}) => {
    const { page = 1, limit = 20, sort = "newest" } = params;
    const response = await api.get(
      `/blogs/${blogId}/comments?page=${page}&limit=${limit}&sort=${sort}`
    );
    return response.data;
  },

  // Create a new comment or reply
  create: async (commentData) => {
    const { blog_id } = commentData;
    const response = await api.post(`/blogs/${blog_id}/comments`, commentData);
    return response.data;
  },

  // Update a comment
  update: async (commentId, commentData) => {
    const response = await api.put(`/comments/${commentId}`, commentData);
    return response.data;
  },

  // Delete a comment
  delete: async (commentId) => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },

  // Get a single comment by ID
  getById: async (commentId) => {
    const response = await api.get(`/comments/${commentId}`);
    return response.data;
  },

  // Get direct replies to a comment
  getReplies: async (commentId, page = 1, limit = 10) => {
    const response = await api.get(
      `/comments/${commentId}/replies?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Report a comment
  report: async (commentId, reason) => {
    const response = await api.post(`/comments/${commentId}/report`, {
      reason,
    });
    return response.data;
  },

  // Toggle comment like
  toggleLike: async (commentId) => {
    const response = await api.post(`/comments/${commentId}/like`);
    return response.data;
  },

  // Get current user's comments
  getUserComments: async (page = 1, limit = 10) => {
    const response = await api.get(
      `/comments/user/my-comments?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Admin: get all comments across the platform
  getAdminComments: async (params = {}) => {
    const { page = 1, limit = 20, sort = "newest" } = params;
    const response = await api.get(
      `/comments/admin/all?page=${page}&limit=${limit}&sort=${sort}`
    );
    return response.data;
  },

  // Author: get all comments across author's blogs
  getAuthorComments: async (params = {}) => {
    const { page = 1, limit = 20, sort = "newest" } = params;
    const response = await api.get(
      `/comments/author/all?page=${page}&limit=${limit}&sort=${sort}`
    );
    return response.data;
  },

  // Reported comments (role-based)
  getReportedComments: async (scope = "admin", params = {}) => {
    const { page = 1, limit = 20, sort = "newest" } = params;
    const base =
      scope === "author"
        ? "/comments/author/reported"
        : "/comments/admin/reported";
    const response = await api.get(
      `${base}?page=${page}&limit=${limit}&sort=${sort}`
    );
    return response.data;
  },

  // Admin: get comments on admin's own blogs (separate from all comments)
  getAdminOwnBlogComments: async (params = {}) => {
    const { page = 1, limit = 20, sort = "newest" } = params;
    const response = await api.get(
      `/comments/admin/my-blogs?page=${page}&limit=${limit}&sort=${sort}`
    );
    return response.data;
  },

  // Search users by username for tagging
  searchUsers: async (query, signal) => {
    const response = await api.get(
      `/comments/search-users/${encodeURIComponent(query)}?limit=3`,
      { signal }
    );
    return response.data;
  },

  // Admin: dismiss a report
  dismissReport: async (commentId) => {
    const response = await api.post(
      `/comments/admin/${commentId}/dismiss-report`
    );
    return response.data;
  },

  // Admin: force delete a comment (admin override)
  forceDeleteComment: async (commentId) => {
    const response = await api.delete(
      `/comments/admin/${commentId}/force-delete`
    );
    return response.data;
  },

  // Update comment status (approve/reject) - for admins and authors
  updateCommentStatus: async (commentId, status) => {
    const response = await api.put(`/comments/${commentId}/status`, { status });
    return response.data;
  },

  // Get comment statistics for dashboard
  getCommentStats: async () => {
    const response = await api.get("/comments/stats");
    return response.data;
  },

  // Get notification data for current user
  getNotifications: async () => {
    const response = await api.get("/comments/notifications");
    return response.data;
  },

  // Mark notification as read
  markNotificationRead: async (notificationId) => {
    const response = await api.put(
      `/comments/notifications/${notificationId}/read`
    );
    return response.data;
  },

  // Mark all notifications as read
  markAllNotificationsRead: async () => {
    const response = await api.put("/comments/notifications/read-all");
    return response.data;
  },
};

export default commentService;
