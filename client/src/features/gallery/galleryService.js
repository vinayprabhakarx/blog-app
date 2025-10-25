import api from "../../api/api.js";

const galleryService = {
  // Upload image to gallery
  uploadToGallery: async (formData) => {
    const response = await api.post("/gallery/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Get all gallery images with filters
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/gallery?${queryString}` : "/gallery";
    const response = await api.get(endpoint);
    return response.data;
  },

  // Get single gallery image
  getById: async (id) => {
    const response = await api.get(`/gallery/${id}`);
    return response.data;
  },

  // Update gallery image details
  update: async (id, data) => {
    const response = await api.put(`/gallery/${id}`, data);
    return response.data;
  },

  // Delete gallery image
  delete: async (id) => {
    const response = await api.delete(`/gallery/${id}`);
    return response.data;
  },

  // Get image link for markdown
  getImageLink: async (id, options = {}) => {
    const response = await api.get(`/gallery/${id}/link`, { params: options });
    return response.data;
  },

  // Get gallery statistics
  getStats: async () => {
    const response = await api.get("/gallery/stats");
    return response.data;
  },

  // Increment image usage count
  incrementUsage: async (id) => {
    const response = await api.post(`/gallery/${id}/use`);
    return response.data;
  },
};

export default galleryService;
