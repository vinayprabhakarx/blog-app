import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createSelector } from "@reduxjs/toolkit";
import likeService from "./likesService";

// Async thunks
export const toggleBlogLike = createAsyncThunk(
  "likes/toggleBlogLike",
  async ({ blogId }, { rejectWithValue }) => {
    try {
      const data = await likeService.toggleBlog(blogId);
      return {
        blogId,
        totalLikes: data.data?.total_likes || data.totalLikes || 0,
        message: data.message,
        isLiked: data.data?.action === "liked" || data.isLiked || false,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to toggle like"
      );
    }
  }
);

export const getLikeCount = createAsyncThunk(
  "likes/getLikeCount",
  async ({ likeableId, onModel }, { rejectWithValue }) => {
    try {
      const data = await likeService.getBlogLikeCount(likeableId, onModel);
      return {
        likeableId,
        onModel,
        totalLikes: data.data?.total || data.total || 0,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get like count"
      );
    }
  }
);

export const getUserLikeStatus = createAsyncThunk(
  "likes/getUserLikeStatus",
  async ({ likeableId, onModel }, { rejectWithValue }) => {
    try {
      const data = await likeService.getUserLikeStatus(likeableId, onModel);
      return {
        likeableId,
        onModel,
        isLiked: data.data?.has_liked || data.isLiked || false,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get user like status"
      );
    }
  }
);

const likesSlice = createSlice({
  name: "likes",
  initialState: {
    // Like counts for different items
    likeCounts: {}, // { 'blog_id': count, 'comment_id': count }

    // User's like status for different items
    userLikes: {}, // { 'blog_id': true/false, 'comment_id': true/false }

    // Loading states
    toggleLoading: {}, // { 'blog_id': true/false, 'comment_id': true/false }

    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },

    // Frontend-only like toggle (no API call)
    toggleBlogLikeFrontend: (state, action) => {
      const { blogId } = action.payload;
      const currentStatus = state.userLikes[`blog_${blogId}`] || false;
      const currentCount = state.likeCounts[`blog_${blogId}`] || 0;

      // Toggle like status
      state.userLikes[`blog_${blogId}`] = !currentStatus;

      // Update count
      state.likeCounts[`blog_${blogId}`] = currentStatus
        ? Math.max(0, currentCount - 1)
        : currentCount + 1;
    },

    // Set initial data (useful when loading blog data)
    setLikeData: (state, action) => {
      const { items } = action.payload; // Array of { id, type, count, isLiked }
      items.forEach((item) => {
        const key = `${item.type}_${item.id}`;
        state.likeCounts[key] = item.count;
        if (item.isLiked !== undefined) {
          state.userLikes[key] = item.isLiked;
        }
      });
    },
  },
  extraReducers: (builder) => {
    // Toggle Blog Like
    builder
      .addCase(toggleBlogLike.pending, (state, action) => {
        const { blogId } = action.meta.arg;
        state.toggleLoading[`blog_${blogId}`] = true;
        state.error = null;
      })
      .addCase(toggleBlogLike.fulfilled, (state, action) => {
        const { blogId, totalLikes, isLiked } = action.payload;
        state.toggleLoading[`blog_${blogId}`] = false;
        state.likeCounts[`blog_${blogId}`] = totalLikes;
        state.userLikes[`blog_${blogId}`] = isLiked;
      })
      .addCase(toggleBlogLike.rejected, (state, action) => {
        const { blogId } = action.meta.arg;
        state.toggleLoading[`blog_${blogId}`] = false;
        state.error = action.payload;
      });

    // Get Like Count
    builder.addCase(getLikeCount.fulfilled, (state, action) => {
      const { likeableId, onModel, totalLikes } = action.payload;
      const key = `${onModel.toLowerCase()}_${likeableId}`;
      state.likeCounts[key] = totalLikes;
    });

    // Get User Like Status
    builder.addCase(getUserLikeStatus.fulfilled, (state, action) => {
      const { likeableId, onModel, isLiked } = action.payload;
      const key = `${onModel.toLowerCase()}_${likeableId}`;
      state.userLikes[key] = isLiked;
    });
  },
});

export const { clearError, toggleBlogLikeFrontend, setLikeData } =
  likesSlice.actions;

// Base selectors
const selectLikesState = (state) => state.likes;
const selectLikeCounts = (state) => state.likes.likeCounts;
const selectUserLikes = (state) => state.likes.userLikes;
const selectToggleLoadings = (state) => state.likes.toggleLoading;

// Memoized selectors to prevent unnecessary re-renders
export const selectLikeCount = createSelector(
  [selectLikeCounts, (state, itemId, itemType) => `${itemType}_${itemId}`],
  (likeCounts, key) => likeCounts[key] || 0
);

export const selectUserLikeStatus = createSelector(
  [selectUserLikes, (state, itemId, itemType) => `${itemType}_${itemId}`],
  (userLikes, key) => userLikes[key] || false
);

export const selectToggleLoading = createSelector(
  [selectToggleLoadings, (state, itemId, itemType) => `${itemType}_${itemId}`],
  (toggleLoadings, key) => toggleLoadings[key] || false
);

export const selectLikesError = createSelector(
  [selectLikesState],
  (likesState) => likesState.error
);

export default likesSlice.reducer;
