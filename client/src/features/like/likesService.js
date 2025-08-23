import api from "../../api/api.js";

const likeService = {
  // Toggle blog like
  toggleBlog: async (blogId) => {
    const response = await api.post(`/likes/blogs/${blogId}/like`);
    return response.data;
  },

  // Get blog like count
  getBlogLikeCount: async (blogId) => {
    const response = await api.get(`/likes/blogs/${blogId}/likes`);
    return response.data;
  },

  // Get user's like status for a blog
  getUserLikeStatus: async (likeableId, onModel) => {
    if (onModel === "Blog") {
      const response = await api.get(`/likes/blogs/${likeableId}/like-status`);
      return response.data;
    }
    const response = await api.get(
      `/likes/status?likeableId=${likeableId}&onModel=${onModel}`
    );
    return response.data;
  },

  // Get users who liked a blog
  getBlogLikedUsers: async (blogId, page = 1, limit = 20) => {
    const response = await api.get(
      `/likes/blog/${blogId}/users?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Get user's liked items
  getUserLikes: async (type = "all", page = 1, limit = 10) => {
    const response = await api.get(
      `/likes/user/my-likes?type=${type}&page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Get trending likes
  getTrendingLikes: async (type = "all", timeframe = "week", limit = 10) => {
    const response = await api.get(
      `/likes/trending?type=${type}&timeframe=${timeframe}&limit=${limit}`
    );
    return response.data;
  },
};

export default likeService;
