import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import userService from "./usersService";

// Async thunk to fetch user data by ID
export const fetchUserById = createAsyncThunk(
  "user/fetchUserById",
  async (userId, { rejectWithValue, getState }) => {
    try {
      // Check if user already exists in cache
      const existingUser = getState().user.usersById[userId];
      if (existingUser && !existingUser.isStale) {
        return existingUser;
      }

      const userData = await userService.getById(userId);
      return { ...userData, userId, fetchedAt: Date.now() };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch user data"
      );
    }
  }
);

// Async thunk to fetch multiple users at once
export const fetchUsersByIds = createAsyncThunk(
  "user/fetchUsersByIds",
  async (userIds, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const usersToFetch = userIds.filter((userId) => {
        const existingUser = state.user.usersById[userId];
        return !existingUser || existingUser.isStale;
      });

      if (usersToFetch.length === 0) {
        return []; // All users already cached
      }

      const userData = await userService.getByIds(usersToFetch);
      return userData.map((user) => ({ ...user, fetchedAt: Date.now() }));
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch users data"
      );
    }
  }
);

// Async thunk to fetch all users with pagination
export const fetchAllUsers = createAsyncThunk(
  "user/fetchAllUsers",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await userService.getAllUsers(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch all users"
      );
    }
  }
);

// Async thunk to delete a user
export const deleteUser = createAsyncThunk(
  "user/deleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      await userService.deleteUser(userId);
      return userId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete user"
      );
    }
  }
);

// Async thunk to change user role
export const changeUserRole = createAsyncThunk(
  "user/changeUserRole",
  async ({ userId, role }, { rejectWithValue }) => {
    try {
      const response = await userService.changeUserRole(userId, role);
      return response.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to change user role"
      );
    }
  }
);

const initialState = {
  profile: null,
  loading: false,
  error: null,

  // User data cache - maps userId to user data
  usersById: {},

  // Loading states for cached users
  userLoading: {}, // { userId: boolean }
  bulkLoading: false,

  // Errors for cached users
  userError: {}, // { userId: errorMessage }
  bulkError: null,

  // User management state
  allUsers: [],
  allUsersLoading: false,
  allUsersError: null,
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalUsers: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },

  // Cache settings
  cacheExpiryTime: 5 * 60 * 1000, // 5 minutes
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
    clearProfile: (state) => {
      state.profile = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },

    // User cache management
    addUserToCache: (state, action) => {
      const { userId, userData } = action.payload;
      state.usersById[userId] = {
        ...userData,
        userId,
        fetchedAt: Date.now(),
        isStale: false,
      };
    },

    // Bulk add users to cache
    addUsersToCache: (state, action) => {
      const users = action.payload;
      users.forEach((userData) => {
        if (userData.userId || userData._id) {
          const userId = userData.userId || userData._id;
          state.usersById[userId] = {
            ...userData,
            userId,
            fetchedAt: Date.now(),
            isStale: false,
          };
        }
      });
    },

    // Mark user data as stale for refresh
    markUserAsStale: (state, action) => {
      const userId = action.payload;
      if (state.usersById[userId]) {
        state.usersById[userId].isStale = true;
      }
    },

    // Clear user data
    removeUserFromCache: (state, action) => {
      const userId = action.payload;
      delete state.usersById[userId];
      delete state.userLoading[userId];
      delete state.userError[userId];
    },

    // Clear all cached data
    clearUsersCache: (state) => {
      state.usersById = {};
      state.userLoading = {};
      state.userError = {};
    },

    // Clear user cache errors
    clearUserError: (state, action) => {
      const userId = action.payload;
      if (userId) {
        delete state.userError[userId];
      } else {
        state.userError = {};
        state.bulkError = null;
      }
    },

    // Auto-cleanup stale cache entries
    cleanupStaleCache: (state) => {
      const now = Date.now();
      const expiryTime = state.cacheExpiryTime;

      Object.keys(state.usersById).forEach((userId) => {
        const user = state.usersById[userId];
        if (user.fetchedAt && now - user.fetchedAt > expiryTime) {
          user.isStale = true;
        }
      });
    },
  },
  extraReducers: (builder) => {
    // Fetch single user
    builder
      .addCase(fetchUserById.pending, (state, action) => {
        const userId = action.meta.arg;
        state.userLoading[userId] = true;
        delete state.userError[userId];
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        const userData = action.payload;
        const userId = userData.userId || userData._id;

        state.userLoading[userId] = false;
        state.usersById[userId] = {
          ...userData,
          userId,
          isStale: false,
        };
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        const userId = action.meta.arg;
        state.userLoading[userId] = false;
        state.userError[userId] = action.payload;
      });

    // Fetch multiple users
    builder
      .addCase(fetchUsersByIds.pending, (state) => {
        state.bulkLoading = true;
        state.bulkError = null;
      })
      .addCase(fetchUsersByIds.fulfilled, (state, action) => {
        state.bulkLoading = false;
        const users = action.payload;

        users.forEach((userData) => {
          const userId = userData.userId || userData._id;
          if (userId) {
            state.userLoading[userId] = false;
            state.usersById[userId] = {
              ...userData,
              userId,
              isStale: false,
            };
          }
        });
      })
      .addCase(fetchUsersByIds.rejected, (state, action) => {
        state.bulkLoading = false;
        state.bulkError = action.payload;
      });

    // Fetch all users
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.allUsersLoading = true;
        state.allUsersError = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.allUsersLoading = false;
        state.allUsers = action.payload.users || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.allUsersLoading = false;
        state.allUsersError = action.payload;
      });

    // Delete user
    builder
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        const deletedUserId = action.payload;
        // Remove from allUsers list
        state.allUsers = state.allUsers.filter(
          (user) => user._id !== deletedUserId
        );
        // Remove from cache
        delete state.usersById[deletedUserId];
        // Update pagination count
        if (state.pagination.totalUsers > 0) {
          state.pagination.totalUsers -= 1;
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Change user role
    builder
      .addCase(changeUserRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changeUserRole.fulfilled, (state, action) => {
        state.loading = false;
        const updatedUser = action.payload;
        // Update in allUsers list
        const userIndex = state.allUsers.findIndex(
          (user) => user._id === updatedUser.id
        );
        if (userIndex !== -1) {
          state.allUsers[userIndex] = {
            ...state.allUsers[userIndex],
            role: updatedUser.role,
          };
        }
        // Update in cache
        if (state.usersById[updatedUser.id]) {
          state.usersById[updatedUser.id].role = updatedUser.role;
        }
      })
      .addCase(changeUserRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setProfile, clearProfile, setLoading, setError, clearError } =
  userSlice.actions;

// Selectors
export const selectAllUsers = (state) => state.user.allUsers;
export const selectAllUsersLoading = (state) => state.user.allUsersLoading;
export const selectAllUsersError = (state) => state.user.allUsersError;
export const selectUsersPagination = (state) => state.user.pagination;

export default userSlice.reducer;
