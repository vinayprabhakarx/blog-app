import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "./authService";

// Async thunks
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await authService.login(credentials);
      localStorage.setItem("token", data.token);
      return data;
    } catch (error) {
      localStorage.removeItem("token");
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const data = await authService.register(userData);
      localStorage.setItem("token", data.token);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Registration failed"
      );
    }
  }
);

export const googleAuth = createAsyncThunk(
  "auth/googleAuth",
  async (tokenData, { rejectWithValue }) => {
    try {
      const data = await authService.googleAuth(tokenData);
      localStorage.setItem("token", data.token);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Google auth failed"
      );
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      // Use auth service for current user since it uses /auth/me endpoint
      const data = await authService.getCurrentUser();
      return data;
    } catch (error) {
      localStorage.removeItem("token");
      return rejectWithValue(
        error.response?.data?.message || "Failed to get user"
      );
    }
  }
);

// Alias for getUserProfile (used in Topbar)
export const getUserProfile = getCurrentUser;

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (passwordData, { rejectWithValue }) => {
    try {
      const data = await authService.changePassword(passwordData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Password change failed"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: localStorage.getItem("token"),
    isAuthenticated: !!localStorage.getItem("token"),
    loading: false,
    error: null,
    passwordChangeLoading: false,
    passwordChangeSuccess: false,
  },
  reducers: {
    logout: (state) => {
      authService.logout();
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearPasswordChangeStatus: (state) => {
      state.passwordChangeSuccess = false;
      state.passwordChangeLoading = false;
    },
    updateUserProfile: (state, action) => {
      if (state.user) {
        // Update the user state with the new data
        state.user = { ...state.user, ...action.payload };

        // Also update the flat fields for consistency with useAuth hook
        if (action.payload.personal_info) {
          state.user.name =
            action.payload.personal_info.name || state.user.name;
          state.user.username =
            action.payload.personal_info.username || state.user.username;
          state.user.email =
            action.payload.personal_info.email || state.user.email;
          state.user.avatar =
            action.payload.personal_info.profile_img || state.user.avatar;
        }

        // Update social links if provided
        if (action.payload.social_links) {
          state.user.social_links = action.payload.social_links;
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = null; // Login only returns token, user data loaded separately
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = null; // Register only returns token, user data loaded separately
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Google Auth
    builder
      .addCase(googleAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = null; // Google auth only returns token, user data loaded separately
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(googleAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Get Current User
    builder
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        // Transform the database user object to match our expected format
        const dbUser = action.payload.user;
        const transformedUser = {
          ...dbUser,
          // Map database fields to expected format for consistency
          name: dbUser.personal_info?.name || dbUser.name,
          username: dbUser.personal_info?.username || dbUser.username,
          email: dbUser.personal_info?.email || dbUser.email,
          avatar: dbUser.personal_info?.profile_img || dbUser.avatar || "",
          // Keep the original structure for components that might need it
          personal_info: dbUser.personal_info,
        };
        state.user = transformedUser;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.token = null;
      });

    // Change Password
    builder
      .addCase(changePassword.pending, (state) => {
        state.passwordChangeLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.passwordChangeLoading = false;
        state.passwordChangeSuccess = true;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.passwordChangeLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  logout,
  clearError,
  clearPasswordChangeStatus,
  updateUserProfile,
} = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
