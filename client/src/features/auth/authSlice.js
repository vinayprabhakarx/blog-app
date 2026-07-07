import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "./authService";

// Async thunks
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await authService.login(credentials);
      return data;
    } catch (error) {
      const isNetworkError = !error.response;
      return rejectWithValue({
        message: error.response?.data?.message || "Login failed",
        isNetworkError
      });
    }
  }
);

export const refreshTokenThunk = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const data = await authService.refresh();
      return data;
    } catch (error) {
      const isNetworkError = !error.response;
      return rejectWithValue({
        message: error.response?.data?.message || "Refresh failed",
        isNetworkError
      });
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const data = await authService.register(userData);
      // Do not auto-login on register; require email verification
      return data;
    } catch (error) {
      const isNetworkError = !error.response;
      return rejectWithValue({
        message: error.response?.data?.message || "Registration failed",
        isNetworkError
      });
    }
  }
);

export const googleAuth = createAsyncThunk(
  "auth/googleAuth",
  async (tokenData, { rejectWithValue }) => {
    try {
      const data = await authService.googleAuth(tokenData);
      return data;
    } catch (error) {
      const isNetworkError = !error.response;
      return rejectWithValue({
        message: error.response?.data?.details?.message || error.response?.data?.message || "Google auth failed",
        isNetworkError
      });
    }
  }
);

export const linkGoogleAuth = createAsyncThunk(
  "auth/linkGoogleAuth",
  async (tokenData, { rejectWithValue }) => {
    try {
      const data = await authService.linkGoogleAuth(tokenData);
      return data;
    } catch (error) {
      const isNetworkError = !error.response;
      return rejectWithValue({
        message: error.response?.data?.details?.message || error.response?.data?.message || "Failed to link Google Auth",
        isNetworkError
      });
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
      const isNetworkError = !error.response;
      return rejectWithValue({
        message: error.response?.data?.message || "Failed to get user",
        isNetworkError
      });
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
      const isNetworkError = !error.response;
      return rejectWithValue({
        message: error.response?.data?.message || "Password change failed",
        isNetworkError
      });
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    initializing: true,
    error: null,
    isServerDown: false,
    passwordChangeLoading: false,
    passwordChangeSuccess: false,
    verificationRequired: false,
    verifyMessage: null,
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
    initializationComplete: (state) => {
      state.initializing = false;
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
      .addCase(loginUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null; // Login only returns token, user data loaded separately
        state.token = null; // Token is handled by HttpOnly cookie
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.payload;
        state.isAuthenticated = false;
        if (action.payload?.isNetworkError || action.error?.message === 'Network Error') {
          state.isServerDown = true;
        }
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.verificationRequired = true;
        state.verifyMessage =
          action.payload?.message ||
          "Registration successful. Please verify your email to activate your account.";
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.payload;
        if (action.payload?.isNetworkError || action.error?.message === 'Network Error') {
          state.isServerDown = true;
        }
      });

    // Google Auth
    builder
      .addCase(googleAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleAuth.fulfilled, (state) => {
        state.loading = false;
        state.user = null; // Google auth only returns token, user data loaded separately
        state.token = null; // Token is handled by HttpOnly cookie
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(googleAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.payload;
        if (action.payload?.isNetworkError || action.error?.message === 'Network Error') {
          state.isServerDown = true;
        }
      });

    // Link Google Auth
    builder
      .addCase(linkGoogleAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(linkGoogleAuth.fulfilled, (state) => {
        state.loading = false;
        if (state.user) {
          state.user.google_auth = true;
        }
        state.error = null;
      })
      .addCase(linkGoogleAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.payload;
        if (action.payload?.isNetworkError || action.error?.message === 'Network Error') {
          state.isServerDown = true;
        }
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
          google_auth: dbUser.google_auth || false,
          // Keep the original structure for components that might need it
          personal_info: dbUser.personal_info,
        };
        state.user = transformedUser;
        state.isAuthenticated = true;
        state.initializing = false;
        state.isServerDown = false;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.token = null;
        state.initializing = false;
        if (action.payload?.isNetworkError || action.error?.message === 'Network Error') {
          state.isServerDown = true;
        }
      });

    // Refresh Token
    builder
      .addCase(refreshTokenThunk.fulfilled, (state) => {
        state.token = null; // Token is handled by HttpOnly cookie
        state.isAuthenticated = true;
        state.isServerDown = false;
      })
      .addCase(refreshTokenThunk.rejected, (state, action) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.initializing = false;
        if (action.payload?.isNetworkError || action.error?.message === 'Network Error') {
          state.isServerDown = true;
        }
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
        state.error = action.payload?.message || action.payload;
        if (action.payload?.isNetworkError || action.error?.message === 'Network Error') {
          state.isServerDown = true;
        }
      });
  },
});

export const {
  logout,
  clearError,
  clearPasswordChangeStatus,
  updateUserProfile,
  initializationComplete,
} = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
