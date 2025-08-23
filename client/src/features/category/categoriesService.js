import api from "../../api/api.js";

// Categories service
const categoryService = {
  getAll: async () => {
    const response = await api.get("/categories");
    return response.data;
  },

  // Get category by slug
  getById: async (categorySlug) => {
    const response = await api.get(`/categories/${categorySlug}`);
    return response.data;
  },

  // Create category
  create: async (categoryData) => {
    const response = await api.post("/categories", categoryData);
    return response.data;
  },

  // Update category
  update: async (categoryId, categoryData) => {
    const response = await api.put(`/categories/${categoryId}`, categoryData);
    return response.data;
  },

  // Delete category
  delete: async (categoryId) => {
    const response = await api.delete(`/categories/${categoryId}`);
    return response.data;
  },
};

export default categoryService;
