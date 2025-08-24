import api from "../../api/api.js";

const blogService = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/blogs?${queryString}` : "/blogs";
    const response = await api.get(endpoint);
    return response.data;
  },

  search: async (query, params = {}) => {
    const searchParams = new URLSearchParams({ search: query, ...params });
    const response = await api.get(`/blogs?${searchParams.toString()}`);
    return response.data;
  },

  // Advanced search across multiple fields (author, title, content, category, tags)
  advancedSearch: async (query, params = {}) => {
    const searchParams = new URLSearchParams({ 
      search: query, 
      searchFields: 'title,content,author,category,tags',
      ...params 
    });
    const response = await api.get(`/blogs?${searchParams.toString()}`);
    return response.data;
  },

  // Get top/popular blogs
  getTopBlogs: async (limit = 5) => {
    const response = await api.get(`/blogs?limit=${limit}&sort=views,likes,createdAt&order=desc`);
    return response.data;
  },

  getBySlug: async (slug) => {
    const response = await api.get(`/blogs/${slug}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/blogs/edit/${id}`);
    return response.data;
  },

  getByAuthor: async (username, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/blogs/author/${username}?${queryString}`
      : `/blogs/author/${username}`;
    const response = await api.get(endpoint);
    return response.data;
  },

  // Create a new blog
  create: async (blogData) => {
    const formData = new FormData();
    Object.keys(blogData).forEach((key) => {
      if (blogData[key] !== undefined) {
        formData.append(key, blogData[key]);
      }
    });
    const response = await api.post("/blogs", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Update an existing blog
  update: async (blogId, blogData) => {
    const formData = new FormData();
    Object.keys(blogData).forEach((key) => {
      if (blogData[key] !== undefined) {
        formData.append(key, blogData[key]);
      }
    });
    const response = await api.put(`/blogs/${blogId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Get blogs for the current user
  getMyBlogs: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/blogs/my-blogs?${queryString}`
      : "/blogs/my-blogs";
    const response = await api.get(endpoint);
    return response.data;
  },

  // Delete a blog
  delete: async (blogId) => {
    const response = await api.delete(`/blogs/${blogId}`);
    return response.data;
  },
};

export default blogService;
