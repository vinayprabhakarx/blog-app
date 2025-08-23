import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import userService from "../user_management/usersService";
import authService from "../auth/authService";

// Async thunk to update user profile
export const updateProfile = createAsyncThunk(
  "settings/updateProfile",
  async ({ userId, profileData }, { rejectWithValue }) => {
    try {
      const response = await userService.updateProfile(userId, profileData);
      return response.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update profile"
      );
    }
  }
);

// Async thunk to change password
export const changePassword = createAsyncThunk(
  "settings/changePassword",
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await authService.changePassword(passwordData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to change password"
      );
    }
  }
);

// Async thunk to remove profile image
export const removeProfileImage = createAsyncThunk(
  "settings/removeProfileImage",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await userService.removeProfileImage(userId);
      return response.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove profile image"
      );
    }
  }
);

const initialState = {
  // Profile update state
  profileUpdateLoading: false,
  profileUpdateSuccess: false,
  profileUpdateError: null,

  // Password change state
  passwordChangeLoading: false,
  passwordChangeSuccess: false,
  passwordChangeError: null,

  // Profile image removal state
  profileImageRemovalLoading: false,
  profileImageRemovalSuccess: false,
  profileImageRemovalError: null,

  // General settings state
  loading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    // Clear profile update status
    clearProfileUpdateStatus: (state) => {
      state.profileUpdateSuccess = false;
      state.profileUpdateError = null;
    },

    // Clear password change status
    clearPasswordChangeStatus: (state) => {
      state.passwordChangeSuccess = false;
      state.passwordChangeError = null;
    },

    // Clear profile image removal status
    clearProfileImageRemovalStatus: (state) => {
      state.profileImageRemovalSuccess = false;
      state.profileImageRemovalError = null;
    },

    // Clear all errors
    clearErrors: (state) => {
      state.error = null;
      state.profileUpdateError = null;
      state.passwordChangeError = null;
      state.profileImageRemovalError = null;
    },

    // Reset all states
    resetSettings: (state) => {
      state.profileUpdateLoading = false;
      state.profileUpdateSuccess = false;
      state.profileUpdateError = null;
      state.passwordChangeLoading = false;
      state.passwordChangeSuccess = false;
      state.passwordChangeError = null;
      state.profileImageRemovalLoading = false;
      state.profileImageRemovalSuccess = false;
      state.profileImageRemovalError = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Update Profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.profileUpdateLoading = true;
        state.profileUpdateError = null;
        state.profileUpdateSuccess = false;
      })
      .addCase(updateProfile.fulfilled, (state) => {
        state.profileUpdateLoading = false;
        state.profileUpdateSuccess = true;
        state.profileUpdateError = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.profileUpdateLoading = false;
        state.profileUpdateSuccess = false;
        state.profileUpdateError = action.payload;
      });

    // Change Password
    builder
      .addCase(changePassword.pending, (state) => {
        state.passwordChangeLoading = true;
        state.passwordChangeError = null;
        state.passwordChangeSuccess = false;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.passwordChangeLoading = false;
        state.passwordChangeSuccess = true;
        state.passwordChangeError = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.passwordChangeLoading = false;
        state.passwordChangeSuccess = false;
        state.passwordChangeError = action.payload;
      });

    // Remove Profile Image
    builder
      .addCase(removeProfileImage.pending, (state) => {
        state.profileImageRemovalLoading = true;
        state.profileImageRemovalError = null;
        state.profileImageRemovalSuccess = false;
      })
      .addCase(removeProfileImage.fulfilled, (state) => {
        state.profileImageRemovalLoading = false;
        state.profileImageRemovalSuccess = true;
        state.profileImageRemovalError = null;
      })
      .addCase(removeProfileImage.rejected, (state, action) => {
        state.profileImageRemovalLoading = false;
        state.profileImageRemovalSuccess = false;
        state.profileImageRemovalError = action.payload;
      });
  },
});

export const {
  clearProfileUpdateStatus,
  clearPasswordChangeStatus,
  clearProfileImageRemovalStatus,
  clearErrors,
  resetSettings,
} = settingsSlice.actions;

// Selectors
export const selectSettings = (state) => state.settings;
export const selectProfileUpdateLoading = (state) =>
  state.settings.profileUpdateLoading;
export const selectProfileUpdateSuccess = (state) =>
  state.settings.profileUpdateSuccess;
export const selectProfileUpdateError = (state) =>
  state.settings.profileUpdateError;
export const selectPasswordChangeLoading = (state) =>
  state.settings.passwordChangeLoading;
export const selectPasswordChangeSuccess = (state) =>
  state.settings.passwordChangeSuccess;
export const selectPasswordChangeError = (state) =>
  state.settings.passwordChangeError;

export const selectProfileImageRemovalLoading = (state) =>
  state.settings.profileImageRemovalLoading;
export const selectProfileImageRemovalSuccess = (state) =>
  state.settings.profileImageRemovalSuccess;
export const selectProfileImageRemovalError = (state) =>
  state.settings.profileImageRemovalError;

export default settingsSlice.reducer;
