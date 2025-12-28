import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import blogService from "./blogsService";

// Blog async thunks
export const fetchAllBlogs = createAsyncThunk(
  "blog/fetchAllBlogs",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await blogService.getAll(params);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch blogs"
      );
    }
  }
);

export const fetchBlogBySlug = createAsyncThunk(
  "blog/fetchBlogBySlug",
  async (slug, { rejectWithValue }) => {
    try {
      const data = await blogService.getBySlug(slug);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Blog not found");
    }
  }
);

export const fetchBlogById = createAsyncThunk(
  "blog/fetchBlogById",
  async (id, { rejectWithValue }) => {
    try {
      const data = await blogService.getById(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Blog not found");
    }
  }
);

export const fetchMyBlogs = createAsyncThunk(
  "blog/fetchMyBlogs",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await blogService.getMyBlogs(params);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch your blogs"
      );
    }
  }
);

export const fetchBlogsByAuthor = createAsyncThunk(
  "blog/fetchBlogsByAuthor",
  async ({ username, params = {} }, { rejectWithValue }) => {
    try {
      const data = await blogService.getByAuthor(username, params);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch author blogs"
      );
    }
  }
);

export const searchBlogs = createAsyncThunk(
  "blog/searchBlogs",
  async ({ query, params = {} }, { rejectWithValue }) => {
    try {
      const data = await blogService.advancedSearch(query, params);
      return { ...data, searchQuery: query };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Search failed");
    }
  }
);

export const createBlog = createAsyncThunk(
  "blog/createBlog",
  async (blogData, { rejectWithValue }) => {
    try {
      // Convert tags array to comma-separated string for FormData
      const formattedData = { ...blogData };
      if (Array.isArray(blogData.tags)) {
        formattedData.tags = blogData.tags.join(",");
      }

      const data = await blogService.create(formattedData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create blog"
      );
    }
  }
);

export const updateBlog = createAsyncThunk(
  "blog/updateBlog",
  async ({ id, blogData }, { rejectWithValue }) => {
    try {
      // Convert tags array to comma-separated string for FormData
      const formattedData = { ...blogData };
      if (Array.isArray(blogData.tags)) {
        formattedData.tags = blogData.tags.join(",");
      }

      const data = await blogService.update(id, formattedData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update blog"
      );
    }
  }
);

export const deleteBlog = createAsyncThunk(
  "blog/deleteBlog",
  async (blogId, { rejectWithValue }) => {
    try {
      await blogService.delete(blogId);
      return blogId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete blog"
      );
    }
  }
);

const blogSlice = createSlice({
  name: "blog",
  initialState: {
    // All blogs (public)
    allBlogs: [],
    allBlogsLoading: false,
    allBlogsError: null,
    allBlogsPagination: null,

    // My blogs (author's own)
    myBlogs: [],
    myBlogsLoading: false,
    myBlogsError: null,
    myBlogsPagination: null,

    // Author blogs (specific author)
    authorBlogs: [],
    authorBlogsLoading: false,
    authorBlogsError: null,
    authorBlogsPagination: null,

    // Current blog
    currentBlog: null,
    currentBlogLoading: false,
    currentBlogError: null,

    // CRUD operations
    createLoading: false,
    updateLoading: false,
    deleteLoading: false,
    operationError: null,

    // UI state
    filters: {
      category: "all",
      search: "",
      tags: [],
      sortBy: "createdAt",
      sortOrder: "desc",
    },
  },
  reducers: {
    // UI actions
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        category: "all",
        search: "",
        tags: [],
        sortBy: "createdAt",
        sortOrder: "desc",
      };
    },
    clearCurrentBlog: (state) => {
      state.currentBlog = null;
      state.currentBlogError = null;
    },
    clearErrors: (state) => {
      state.allBlogsError = null;
      state.myBlogsError = null;
      state.authorBlogsError = null;
      state.currentBlogError = null;
      state.operationError = null;
    },
    clearAllBlogs: (state) => {
      state.allBlogs = [];
      state.myBlogs = [];
      state.authorBlogs = [];
      state.currentBlog = null;
      state.allBlogsPagination = null;
      state.myBlogsPagination = null;
      state.authorBlogsPagination = null;
    },
    // Optimistic updates
    optimisticDeleteBlog: (state, action) => {
      const blogId = action.payload;
      state.allBlogs = state.allBlogs.filter((blog) => blog._id !== blogId);
      state.myBlogs = state.myBlogs.filter((blog) => blog._id !== blogId);
      state.authorBlogs = state.authorBlogs.filter(
        (blog) => blog._id !== blogId
      );
    },

    // Update blog stats (comments, likes, etc.)
    updateBlogStats: (state, action) => {
      const { blogId, stats } = action.payload;
      const updateInArray = (array) => {
        const index = array.findIndex((blog) => blog._id === blogId);
        if (index !== -1) {
          array[index] = {
            ...array[index],
            activity: {
              ...array[index].activity,
              ...stats,
            },
          };
        }
      };

      updateInArray(state.allBlogs);
      updateInArray(state.myBlogs);
      updateInArray(state.authorBlogs);

      if (state.currentBlog && state.currentBlog._id === blogId) {
        state.currentBlog = {
          ...state.currentBlog,
          activity: {
            ...state.currentBlog.activity,
            ...stats,
          },
        };
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch All Blogs
    builder
      .addCase(fetchAllBlogs.pending, (state) => {
        state.allBlogsLoading = true;
        state.allBlogsError = null;
      })
      .addCase(fetchAllBlogs.fulfilled, (state, action) => {
        state.allBlogsLoading = false;
        state.allBlogs =
          action.payload.blogs ||
          (Array.isArray(action.payload) ? action.payload : []);
        // Store pagination including the category that was loaded
        state.allBlogsPagination = {
          ...action.payload.pagination,
          loadedCategory: action.meta.arg.category || "all",
        };
      })
      .addCase(fetchAllBlogs.rejected, (state, action) => {
        state.allBlogsLoading = false;
        state.allBlogsError = action.payload;
      });

    // Fetch Blog by Slug
    builder
      .addCase(fetchBlogBySlug.pending, (state) => {
        state.currentBlogLoading = true;
        state.currentBlogError = null;
      })
      .addCase(fetchBlogBySlug.fulfilled, (state, action) => {
        state.currentBlogLoading = false;
        state.currentBlog = action.payload.blog || action.payload;
      })
      .addCase(fetchBlogBySlug.rejected, (state, action) => {
        state.currentBlogLoading = false;
        state.currentBlogError = action.payload;
      });

    // Fetch Blog by ID
    builder
      .addCase(fetchBlogById.pending, (state) => {
        state.currentBlogLoading = true;
        state.currentBlogError = null;
      })
      .addCase(fetchBlogById.fulfilled, (state, action) => {
        state.currentBlogLoading = false;
        state.currentBlog = action.payload.blog || action.payload;
      })
      .addCase(fetchBlogById.rejected, (state, action) => {
        state.currentBlogLoading = false;
        state.currentBlogError = action.payload;
      });

    // Fetch My Blogs
    builder
      .addCase(fetchMyBlogs.pending, (state) => {
        state.myBlogsLoading = true;
        state.myBlogsError = null;
      })
      .addCase(fetchMyBlogs.fulfilled, (state, action) => {
        state.myBlogsLoading = false;
        state.myBlogs = action.payload.blogs || action.payload;
        state.myBlogsPagination = action.payload.pagination;
      })
      .addCase(fetchMyBlogs.rejected, (state, action) => {
        state.myBlogsLoading = false;
        state.myBlogsError = action.payload;
      });

    // Fetch Blogs by Author
    builder
      .addCase(fetchBlogsByAuthor.pending, (state) => {
        state.authorBlogsLoading = true;
        state.authorBlogsError = null;
      })
      .addCase(fetchBlogsByAuthor.fulfilled, (state, action) => {
        state.authorBlogsLoading = false;
        state.authorBlogs = action.payload.blogs || action.payload;
        state.authorBlogsPagination = action.payload.pagination;
      })
      .addCase(fetchBlogsByAuthor.rejected, (state, action) => {
        state.authorBlogsLoading = false;
        state.authorBlogsError = action.payload;
      });

    // Search Blogs
    builder
      .addCase(searchBlogs.pending, (state) => {
        state.allBlogsLoading = true;
        state.allBlogsError = null;
      })
      .addCase(searchBlogs.fulfilled, (state, action) => {
        state.allBlogsLoading = false;
        state.allBlogs = action.payload.blogs || [];
        state.allBlogsPagination = action.payload.pagination;
        // Update search filter with current search query
        state.filters.search = action.payload.searchQuery || "";
      })
      .addCase(searchBlogs.rejected, (state, action) => {
        state.allBlogsLoading = false;
        state.allBlogsError = action.payload;
      });

    // Create Blog
    builder
      .addCase(createBlog.pending, (state) => {
        state.createLoading = true;
        state.operationError = null;
      })
      .addCase(createBlog.fulfilled, (state, action) => {
        state.createLoading = false;
        const newBlog = action.payload.blog || action.payload;
        state.myBlogs.unshift(newBlog);
        if (!newBlog.draft) {
          state.allBlogs.unshift(newBlog);
        }
      })
      .addCase(createBlog.rejected, (state, action) => {
        state.createLoading = false;
        state.operationError = action.payload;
      });

    // Update Blog
    builder
      .addCase(updateBlog.pending, (state) => {
        state.updateLoading = true;
        state.operationError = null;
      })
      .addCase(updateBlog.fulfilled, (state, action) => {
        state.updateLoading = false;
        const updatedBlog = action.payload.blog || action.payload;

        // Update in all relevant arrays
        const updateInArray = (array) => {
          const index = array.findIndex((blog) => blog._id === updatedBlog._id);
          if (index !== -1) {
            array[index] = updatedBlog;
          }
        };

        updateInArray(state.allBlogs);
        updateInArray(state.myBlogs);
        updateInArray(state.authorBlogs);

        if (state.currentBlog && state.currentBlog._id === updatedBlog._id) {
          state.currentBlog = updatedBlog;
        }
      })
      .addCase(updateBlog.rejected, (state, action) => {
        state.updateLoading = false;
        state.operationError = action.payload;
      });

    // Delete Blog
    builder
      .addCase(deleteBlog.pending, (state) => {
        state.deleteLoading = true;
        state.operationError = null;
      })
      .addCase(deleteBlog.fulfilled, (state, action) => {
        state.deleteLoading = false;
        const blogId = action.payload;

        state.allBlogs = state.allBlogs.filter((blog) => blog._id !== blogId);
        state.myBlogs = state.myBlogs.filter((blog) => blog._id !== blogId);
        state.authorBlogs = state.authorBlogs.filter(
          (blog) => blog._id !== blogId
        );

        if (state.currentBlog && state.currentBlog._id === blogId) {
          state.currentBlog = null;
        }
      })
      .addCase(deleteBlog.rejected, (state, action) => {
        state.deleteLoading = false;
        state.operationError = action.payload;
      });
  },
});

export const {
  setFilters,
  resetFilters,
  clearCurrentBlog,
  clearErrors,
  clearAllBlogs,
  optimisticDeleteBlog,
  updateBlogStats,
} = blogSlice.actions;

// Selectors
export const selectAllBlogs = (state) => state.blog.allBlogs || [];
export const selectMyBlogs = (state) => state.blog.myBlogs || [];
export const selectAuthorBlogs = (state) => state.blog.authorBlogs || [];
export const selectCurrentBlog = (state) => state.blog.currentBlog;
export const selectBlogFilters = (state) => state.blog.filters;
export const selectBlogLoading = createSelector(
  [
    (state) => state.blog.allBlogsLoading,
    (state) => state.blog.myBlogsLoading,
    (state) => state.blog.authorBlogsLoading,
    (state) => state.blog.currentBlogLoading,
    (state) => state.blog.createLoading,
    (state) => state.blog.updateLoading,
    (state) => state.blog.deleteLoading,
  ],
  (
    allBlogs,
    myBlogs,
    authorBlogs,
    currentBlog,
    create,
    update,
    deleteLoading
  ) => ({
    allBlogs,
    myBlogs,
    authorBlogs,
    currentBlog,
    create,
    update,
    delete: deleteLoading,
  })
);

// Filtered selectors
export const selectFilteredAllBlogs = createSelector(
  [(state) => state.blog.allBlogs, (state) => state.blog.filters],
  (allBlogs, filters) => applyFilters(allBlogs, filters)
);

export const selectFilteredMyBlogs = createSelector(
  [(state) => state.blog.myBlogs, (state) => state.blog.filters],
  (myBlogs, filters) => applyFilters(myBlogs, filters)
);

// Helper function for filtering
const applyFilters = (blogs, filters) => {
  let filtered = [...blogs];

  if (filters.category !== "all") {
    filtered = filtered.filter((blog) => blog.category === filters.category);
  }

  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(
      (blog) =>
        blog.title.toLowerCase().includes(searchTerm) ||
        blog.excerpt.toLowerCase().includes(searchTerm) ||
        blog.content.toLowerCase().includes(searchTerm)
    );
  }

  if (filters.tags.length > 0) {
    filtered = filtered.filter((blog) =>
      blog.tags.some((tag) => filters.tags.includes(tag))
    );
  }

  // Sort
  filtered.sort((a, b) => {
    const aValue = a[filters.sortBy];
    const bValue = b[filters.sortBy];
    const comparison = aValue > bValue ? 1 : -1;
    return filters.sortOrder === "desc" ? -comparison : comparison;
  });

  return filtered;
};

export default blogSlice.reducer;
