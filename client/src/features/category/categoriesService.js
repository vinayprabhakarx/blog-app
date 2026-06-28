import api from "@/api/api.js";

// Categories service
const categoryService = {
  getAll: async () => {
    const response = await api.get("/category");
    return response.data;
  },

  // Get category by ID (for editing)
  getById: async (categoryId) => {
    const response = await api.get(`/category/show/${categoryId}`);
    return response.data;
  },

  // Get category by slug (for public viewing)
  getBySlug: async (categorySlug) => {
    const response = await api.get(`/category/${categorySlug}`);
    return response.data;
  },

  // Create category
  create: async (categoryData) => {
    const response = await api.post("/category", categoryData);
    return response.data;
  },

  // Update category
  update: async (categoryId, categoryData) => {
    const response = await api.put(`/category/${categoryId}`, categoryData);
    return response.data;
  },

  // Delete category
  delete: async (categoryId) => {
    const response = await api.delete(`/category/${categoryId}`);
    return response.data;
  },
};

export default categoryService;
