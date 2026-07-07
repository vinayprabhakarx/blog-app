import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import contactService from "./contactService";

const initialState = {
  contacts: [],
  contact: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  unreadCount: 0,
};

// Get contacts
export const getContacts = createAsyncThunk(
  "contact/getAll",
  async ({ page, limit, search, status }, thunkAPI) => {
    try {
      return await contactService.getContacts(page, limit, search, status);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update status
export const updateContactStatus = createAsyncThunk(
  "contact/updateStatus",
  async ({ id, status }, thunkAPI) => {
    try {
      return await contactService.updateContactStatus(id, status);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete contact
export const deleteContact = createAsyncThunk(
  "contact/delete",
  async (id, thunkAPI) => {
    try {
      await contactService.deleteContact(id);
      return id;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const contactSlice = createSlice({
  name: "contact",
  initialState,
  reducers: {
    reset: (state) => {
      state.isError = false;
      state.isSuccess = false;
      state.isLoading = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getContacts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getContacts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.contacts = action.payload.data;
        state.pagination = action.payload.pagination;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(getContacts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateContactStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateContactStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const updatedContact = action.payload.data;
        state.contacts = state.contacts.map((contact) =>
          contact._id === updatedContact._id ? updatedContact : contact
        );
        // adjust unreadCount slightly naively:
        if (updatedContact.status === "read") {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
        } else {
            state.unreadCount += 1;
        }
      })
      .addCase(updateContactStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteContact.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteContact.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const deletedId = action.payload;
        const contact = state.contacts.find((c) => c._id === deletedId);
        if (contact && contact.status === "unread") {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.contacts = state.contacts.filter((c) => c._id !== deletedId);
        state.pagination.total -= 1;
      })
      .addCase(deleteContact.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = contactSlice.actions;
export default contactSlice.reducer;
