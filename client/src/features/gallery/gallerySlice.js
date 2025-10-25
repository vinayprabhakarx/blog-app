import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import galleryService from "./galleryService";

// Gallery async thunks
export const fetchGalleryImages = createAsyncThunk(
  "gallery/fetchGalleryImages",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await galleryService.getAll(params);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch gallery images"
      );
    }
  }
);

export const fetchGalleryImage = createAsyncThunk(
  "gallery/fetchGalleryImage",
  async (id, { rejectWithValue }) => {
    try {
      const data = await galleryService.getById(id);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Image not found"
      );
    }
  }
);

export const uploadGalleryImage = createAsyncThunk(
  "gallery/uploadGalleryImage",
  async (formData, { rejectWithValue }) => {
    try {
      const data = await galleryService.uploadToGallery(formData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to upload image"
      );
    }
  }
);

export const updateGalleryImage = createAsyncThunk(
  "gallery/updateGalleryImage",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const result = await galleryService.update(id, data);
      return result;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update image"
      );
    }
  }
);

export const deleteGalleryImage = createAsyncThunk(
  "gallery/deleteGalleryImage",
  async (id, { rejectWithValue }) => {
    try {
      await galleryService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete image"
      );
    }
  }
);

export const getImageLink = createAsyncThunk(
  "gallery/getImageLink",
  async ({ id, options = {} }, { rejectWithValue }) => {
    try {
      const data = await galleryService.getImageLink(id, options);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get image link"
      );
    }
  }
);

export const fetchGalleryStats = createAsyncThunk(
  "gallery/fetchGalleryStats",
  async (_, { rejectWithValue }) => {
    try {
      const data = await galleryService.getStats();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch gallery stats"
      );
    }
  }
);

const gallerySlice = createSlice({
  name: "gallery",
  initialState: {
    // Images
    images: [],
    imagesLoading: false,
    imagesError: null,
    pagination: null,

    // Current image
    currentImage: null,
    currentImageLoading: false,
    currentImageError: null,

    // CRUD operations
    uploadLoading: false,
    updateLoading: false,
    deleteLoading: false,
    operationError: null,

    // Stats
    stats: null,
    statsLoading: false,
    statsError: null,

    // UI state
    filters: {
      category: "all",
      search: "",
      tags: "",
      uploadedBy: "",
      dateFrom: "",
      dateTo: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    },

    // Selected images for operations
    selectedImages: [],

    // Upload modal state
    uploadModalOpen: false,
    cropModalOpen: false,
    linkModalOpen: false,
    linkModalImage: null,
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
        tags: "",
        uploadedBy: "",
        dateFrom: "",
        dateTo: "",
        sortBy: "createdAt",
        sortOrder: "desc",
      };
    },
    clearCurrentImage: (state) => {
      state.currentImage = null;
      state.currentImageError = null;
    },
    clearErrors: (state) => {
      state.imagesError = null;
      state.currentImageError = null;
      state.operationError = null;
      state.statsError = null;
    },
    clearImages: (state) => {
      state.images = [];
      state.currentImage = null;
      state.pagination = null;
    },

    // Selection actions
    toggleImageSelection: (state, action) => {
      const imageId = action.payload;
      const index = state.selectedImages.indexOf(imageId);
      if (index > -1) {
        state.selectedImages.splice(index, 1);
      } else {
        state.selectedImages.push(imageId);
      }
    },
    selectAllImages: (state) => {
      state.selectedImages = state.images.map((image) => image._id);
    },
    clearSelection: (state) => {
      state.selectedImages = [];
    },

    // Modal actions
    setUploadModalOpen: (state, action) => {
      state.uploadModalOpen = action.payload;
    },
    setCropModalOpen: (state, action) => {
      state.cropModalOpen = action.payload;
    },
    setLinkModalOpen: (state, action) => {
      state.linkModalOpen = action.payload.open;
      state.linkModalImage = action.payload.image || null;
    },

    // Optimistic updates
    optimisticDeleteImage: (state, action) => {
      const imageId = action.payload;
      state.images = state.images.filter((image) => image._id !== imageId);
    },

    // Update image stats
    updateImageStats: (state, action) => {
      const { imageId, stats } = action.payload;
      const index = state.images.findIndex((image) => image._id === imageId);
      if (index !== -1) {
        state.images[index] = {
          ...state.images[index],
          usage: stats.usage,
          lastUsed: stats.lastUsed,
        };
      }

      if (state.currentImage && state.currentImage._id === imageId) {
        state.currentImage = {
          ...state.currentImage,
          usage: stats.usage,
          lastUsed: stats.lastUsed,
        };
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Gallery Images
    builder
      .addCase(fetchGalleryImages.pending, (state) => {
        state.imagesLoading = true;
        state.imagesError = null;
      })
      .addCase(fetchGalleryImages.fulfilled, (state, action) => {
        state.imagesLoading = false;
        state.images =
          action.payload.data?.images || action.payload.images || [];
        state.pagination =
          action.payload.data?.pagination || action.payload.pagination;
      })
      .addCase(fetchGalleryImages.rejected, (state, action) => {
        state.imagesLoading = false;
        state.imagesError = action.payload;
      });

    // Fetch Gallery Image
    builder
      .addCase(fetchGalleryImage.pending, (state) => {
        state.currentImageLoading = true;
        state.currentImageError = null;
      })
      .addCase(fetchGalleryImage.fulfilled, (state, action) => {
        state.currentImageLoading = false;
        state.currentImage = action.payload.data || action.payload;
      })
      .addCase(fetchGalleryImage.rejected, (state, action) => {
        state.currentImageLoading = false;
        state.currentImageError = action.payload;
      });

    // Upload Gallery Image
    builder
      .addCase(uploadGalleryImage.pending, (state) => {
        state.uploadLoading = true;
        state.operationError = null;
      })
      .addCase(uploadGalleryImage.fulfilled, (state, action) => {
        state.uploadLoading = false;
        const newImage = action.payload.data || action.payload;
        state.images.unshift(newImage);
        state.uploadModalOpen = false;
      })
      .addCase(uploadGalleryImage.rejected, (state, action) => {
        state.uploadLoading = false;
        state.operationError = action.payload;
      });

    // Update Gallery Image
    builder
      .addCase(updateGalleryImage.pending, (state) => {
        state.updateLoading = true;
        state.operationError = null;
      })
      .addCase(updateGalleryImage.fulfilled, (state, action) => {
        state.updateLoading = false;
        const updatedImage = action.payload.data || action.payload;
        const index = state.images.findIndex(
          (image) => image._id === updatedImage._id
        );
        if (index !== -1) {
          state.images[index] = updatedImage;
        }
        if (state.currentImage && state.currentImage._id === updatedImage._id) {
          state.currentImage = updatedImage;
        }
      })
      .addCase(updateGalleryImage.rejected, (state, action) => {
        state.updateLoading = false;
        state.operationError = action.payload;
      });

    // Delete Gallery Image
    builder
      .addCase(deleteGalleryImage.pending, (state) => {
        state.deleteLoading = true;
        state.operationError = null;
      })
      .addCase(deleteGalleryImage.fulfilled, (state, action) => {
        state.deleteLoading = false;
        const imageId = action.payload;
        state.images = state.images.filter((image) => image._id !== imageId);
        if (state.currentImage && state.currentImage._id === imageId) {
          state.currentImage = null;
        }
        // Remove from selection if selected
        state.selectedImages = state.selectedImages.filter(
          (id) => id !== imageId
        );
      })
      .addCase(deleteGalleryImage.rejected, (state, action) => {
        state.deleteLoading = false;
        state.operationError = action.payload;
      });

    // Get Image Link
    builder
      .addCase(getImageLink.pending, (state) => {
        state.operationError = null;
      })
      .addCase(getImageLink.fulfilled, (state, action) => {
        // The link is handled in the component
        const linkData = action.payload.data || action.payload;
        if (linkData.usage) {
          // Update usage count in the image
          const imageId = linkData.id;
          const index = state.images.findIndex(
            (image) => image._id === imageId
          );
          if (index !== -1) {
            state.images[index].usage = linkData.usage;
          }
        }
      })
      .addCase(getImageLink.rejected, (state, action) => {
        state.operationError = action.payload;
      });

    // Fetch Gallery Stats
    builder
      .addCase(fetchGalleryStats.pending, (state) => {
        state.statsLoading = true;
        state.statsError = null;
      })
      .addCase(fetchGalleryStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload.data || action.payload;
      })
      .addCase(fetchGalleryStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.statsError = action.payload;
      });
  },
});

export const {
  setFilters,
  resetFilters,
  clearCurrentImage,
  clearErrors,
  clearImages,
  toggleImageSelection,
  selectAllImages,
  clearSelection,
  setUploadModalOpen,
  setCropModalOpen,
  setLinkModalOpen,
  optimisticDeleteImage,
  updateImageStats,
} = gallerySlice.actions;

// Selectors
export const selectGalleryImages = (state) => state.gallery.images;
export const selectCurrentImage = (state) => state.gallery.currentImage;
export const selectGalleryFilters = (state) => state.gallery.filters;
export const selectGalleryStats = (state) => state.gallery.stats;
export const selectSelectedImages = (state) => state.gallery.selectedImages;
export const selectGalleryPagination = (state) => state.gallery.pagination;

export const selectGalleryLoading = createSelector(
  [
    (state) => state.gallery.imagesLoading,
    (state) => state.gallery.currentImageLoading,
    (state) => state.gallery.uploadLoading,
    (state) => state.gallery.updateLoading,
    (state) => state.gallery.deleteLoading,
    (state) => state.gallery.statsLoading,
  ],
  (images, currentImage, upload, update, deleteLoading, stats) => ({
    images,
    currentImage,
    upload,
    update,
    delete: deleteLoading,
    stats,
  })
);

// Filtered selectors
export const selectFilteredGalleryImages = createSelector(
  [(state) => state.gallery.images, (state) => state.gallery.filters],
  (images, filters) => applyFilters(images, filters)
);

// Helper function for filtering
const applyFilters = (images, filters) => {
  let filtered = [...images];

  if (filters.category !== "all") {
    filtered = filtered.filter((image) => image.category === filters.category);
  }

  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(
      (image) =>
        image.title.toLowerCase().includes(searchTerm) ||
        image.description.toLowerCase().includes(searchTerm) ||
        image.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
    );
  }

  if (filters.tags) {
    const tagArray = filters.tags.split(",").map((tag) => tag.trim());
    filtered = filtered.filter((image) =>
      image.tags.some((tag) => tagArray.includes(tag))
    );
  }

  if (filters.uploadedBy) {
    filtered = filtered.filter(
      (image) => image.uploadedBy._id === filters.uploadedBy
    );
  }

  if (filters.dateFrom) {
    filtered = filtered.filter(
      (image) => new Date(image.createdAt) >= new Date(filters.dateFrom)
    );
  }

  if (filters.dateTo) {
    filtered = filtered.filter(
      (image) => new Date(image.createdAt) <= new Date(filters.dateTo)
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

export default gallerySlice.reducer;
