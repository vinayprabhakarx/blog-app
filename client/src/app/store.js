import { configureStore } from "@reduxjs/toolkit";
import { cleanupStaleToken } from "@/utils/authTokenCleanup";

// CRITICAL: Clean up stale tokens BEFORE Redux initializes
// This must happen before authSlice reads localStorage
cleanupStaleToken();
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "@reduxjs/toolkit";

import authReducer from "@/features/auth/authSlice";
import blogReducer from "@/features/blog/blogSlice";
import categoriesReducer from "@/features/category/categoriesSlice";
import commentsReducer from "@/features/comment/commentsSlice";
import userReducer from "@/features/user_management/userSlice";
import contactReducer from "@/features/contact/contactSlice";
import likesReducer from "@/features/like/likesSlice";
import notificationsReducer from "@/features/notification/notificationsSlice";
import settingsReducer from "@/features/settings/settingsSlice";

import {
  syncMiddleware,
  optimisticMiddleware,
} from "./middleware/syncMiddleware";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "likes"],
  blacklist: [
    "blog",
    "comments",
    "categories",
    "user",
    "notifications",
    "gallery",
    "contact",
  ],
};

const rootReducer = combineReducers({
  auth: authReducer,
  blog: blogReducer,
  categories: categoriesReducer,
  comments: commentsReducer,
  user: userReducer,
  contact: contactReducer,
  likes: likesReducer,
  notifications: notificationsReducer,
  settings: settingsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/PAUSE",
          "persist/PURGE",
          "persist/REGISTER",
        ],
      },
    }).concat(syncMiddleware, optimisticMiddleware),
  devTools: import.meta.env.MODE !== "production",
});

export const persistor = persistStore(store);
