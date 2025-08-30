import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import categoryService from "./categoriesService";

// Async thunks
export const fetchAllCategories = createAsyncThunk(
  "categories/fetchAllCategories",
  async (_, { rejectWithValue }) => {
    try {
      const data = await categoryService.getAll();
      return data.categories || data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch categories"
      );
    }
  }
);

export const fetchCategoryBySlug = createAsyncThunk(
  "categories/fetchCategoryBySlug",
  async (slug, { rejectWithValue }) => {
    try {
      const data = await categoryService.getBySlug(slug);
      return data.category || data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Category not found"
      );
    }
  }
);

export const fetchCategoryById = createAsyncThunk(
  "categories/fetchCategoryById",
  async (id, { rejectWithValue }) => {
    try {
      const data = await categoryService.getById(id);
      return data.category || data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Category not found"
      );
    }
  }
);

export const createCategory = createAsyncThunk(
  "categories/createCategory",
  async (categoryData, { rejectWithValue }) => {
    try {
      const data = await categoryService.create(categoryData);
      return data.category || data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create category"
      );
    }
  }
);

export const updateCategory = createAsyncThunk(
  "categories/updateCategory",
  async ({ id, categoryData }, { rejectWithValue }) => {
    try {
      const data = await categoryService.update(id, categoryData);
      return data.category || data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update category"
      );
    }
  }
);

export const deleteCategory = createAsyncThunk(
  "categories/deleteCategory",
  async (categoryId, { rejectWithValue }) => {
    try {
      await categoryService.delete(categoryId);
      return categoryId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete category"
      );
    }
  }
);

const categoriesSlice = createSlice({
  name: "categories",
  initialState: {
    categories: [],
    currentCategory: null,
    loading: false,
    currentCategoryLoading: false,
    createLoading: false,
    updateLoading: false,
    deleteLoading: false,
    error: null,
    currentCategoryError: null,
    operationError: null,
  },
  reducers: {
    clearCurrentCategory: (state) => {
      state.currentCategory = null;
      state.currentCategoryError = null;
    },
    clearErrors: (state) => {
      state.error = null;
      state.currentCategoryError = null;
      state.operationError = null;
    },
    // Optimistic updates
    optimisticDeleteCategory: (state, action) => {
      const categoryId = action.payload;
      state.categories = state.categories.filter(
        (cat) => cat._id !== categoryId
      );
    },
  },
  extraReducers: (builder) => {
    // Fetch All Categories
    builder
      .addCase(fetchAllCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchAllCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Category by Slug
    builder
      .addCase(fetchCategoryBySlug.pending, (state) => {
        state.currentCategoryLoading = true;
        state.currentCategoryError = null;
      })
      .addCase(fetchCategoryBySlug.fulfilled, (state, action) => {
        state.currentCategoryLoading = false;
        state.currentCategory = action.payload;
      })
      .addCase(fetchCategoryBySlug.rejected, (state, action) => {
        state.currentCategoryLoading = false;
        state.currentCategoryError = action.payload;
      });

    // Fetch Category by ID (for editing)
    builder
      .addCase(fetchCategoryById.pending, (state) => {
        state.currentCategoryLoading = true;
        state.currentCategoryError = null;
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.currentCategoryLoading = false;
        state.currentCategory = action.payload;
      })
      .addCase(fetchCategoryById.rejected, (state, action) => {
        state.currentCategoryLoading = false;
        state.currentCategoryError = action.payload;
      });

    // Create Category
    builder
      .addCase(createCategory.pending, (state) => {
        state.createLoading = true;
        state.operationError = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.createLoading = false;
        state.categories.push(action.payload);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.createLoading = false;
        state.operationError = action.payload;
      });

    // Update Category
    builder
      .addCase(updateCategory.pending, (state) => {
        state.updateLoading = true;
        state.operationError = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.updateLoading = false;
        const updatedCategory = action.payload;
        const index = state.categories.findIndex(
          (cat) => cat._id === updatedCategory._id
        );
        if (index !== -1) {
          state.categories[index] = updatedCategory;
        }
        if (
          state.currentCategory &&
          state.currentCategory._id === updatedCategory._id
        ) {
          state.currentCategory = updatedCategory;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.updateLoading = false;
        state.operationError = action.payload;
      });

    // Delete Category
    builder
      .addCase(deleteCategory.pending, (state) => {
        state.deleteLoading = true;
        state.operationError = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.deleteLoading = false;
        const categoryId = action.payload;
        state.categories = state.categories.filter(
          (cat) => cat._id !== categoryId
        );
        if (state.currentCategory && state.currentCategory._id === categoryId) {
          state.currentCategory = null;
        }
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.deleteLoading = false;
        state.operationError = action.payload;
      });
  },
});

export const { clearCurrentCategory, clearErrors, optimisticDeleteCategory } =
  categoriesSlice.actions;

// Selectors
export const selectAllCategories = (state) => state.categories.categories;
// Selector for fetched flag
export const selectCategoriesFetched = (state) => state.categories.fetched;
export const selectCategoriesLoading = (state) => state.categories.loading;
export const selectCurrentCategory = (state) => state.categories.currentCategory;
export const selectCurrentCategoryLoading = (state) =>
  state.categories.currentCategoryLoading;
export const selectCategoriesError = (state) => state.categories.error;
export const selectCurrentCategoryError = (state) =>
  state.categories.currentCategoryError;
// Memoized selector for operation loading states
export const selectOperationLoading = createSelector(
  [
    (state) => state.categories.createLoading,
    (state) => state.categories.updateLoading,
    (state) => state.categories.deleteLoading,
  ],
  (create, update, deleteLoading) => ({
    create,
    update,
    delete: deleteLoading,
  })
);

// Complex selectors
export const selectCategoriesWithBlogCount = createSelector(
  [(state) => state.categories.categories, (state) => state.blog.allBlogs],
  (categories, allBlogs) =>
    categories.map((category) => {
      const blogCount = allBlogs.filter(
        (blog) => blog.category === category.slug
      ).length;
      return {
        ...category,
        blogCount,
      };
    })
);

// Selector for featured categories with article count > 0, limited to 5
export const selectFeaturedCategories = createSelector(
  [(state) => state.categories.categories],
  (categories) =>
    categories
      .filter((category) => category.featured && category.articleCount > 0)
      .slice(0, 5)
);

// Selector for all categories (including non-featured) for admin/dropdown use
export const selectAllCategoriesForAdmin = (state) => {
  return state.categories.categories;
};

export const selectCategoryOptions = createSelector(
  [(state) => state.categories.categories],
  (categories) => [
    { value: "all", label: "All Categories" },
    ...categories.map((category) => ({
      value: category.slug,
      label: category.name,
    })),
  ]
);

// Selector for featured category options only
export const selectFeaturedCategoryOptions = createSelector(
  [selectFeaturedCategories],
  (featuredCategories) => [
    { value: "all", label: "All Categories" },
    ...featuredCategories.map((category) => ({
      value: category.slug,
      label: category.name,
    })),
  ]
);

export default categoriesSlice.reducer;
