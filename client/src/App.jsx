import React, { useEffect } from "react";
import { ThemeProvider } from "./utils/ThemeContext.jsx";
import { NotificationProvider } from "./utils/NotificationContext";
import AppRouter from "./utils/AppRouter";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getCurrentUser,
  initializationComplete,
} from "./features/auth/authSlice";
import "./index.css";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "./utils/ThemeContext.jsx";

// Initialize authentication state
const AuthInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const { token, initializing } = useSelector((state) => state.auth);

  useEffect(() => {
    // Only run once on mount
    if (initializing) {
      const currentPath = window.location.pathname;
      const publicRoutes = [
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
      ];
      const isPublicRoute = publicRoutes.some((route) =>
        currentPath.startsWith(route)
      );

      // CRITICAL: If on auth pages AND we have a token, clear it immediately
      // This prevents redirect loops from stale/invalid tokens
      if (isPublicRoute && token) {
        console.log("AuthInitializer: Clearing stale token on auth page");
        localStorage.removeItem("token");
        dispatch({ type: "auth/logout" });
        dispatch(initializationComplete());
        return;
      }

      // If on auth pages without token, just complete initialization
      if (isPublicRoute) {
        dispatch(initializationComplete());
        return;
      }

      // Only verify token if we have one AND we're not on a public route
      if (token) {
        // Verify the token by fetching current user
        dispatch(getCurrentUser()).catch(() => {
          // Token verification failed - 401 interceptor handles redirect
        });
      } else {
        // No token, mark initialization complete
        dispatch(initializationComplete());
      }
    }
  }, [dispatch, token, initializing]);

  return children;
};

const AppContent = () => {
  const { theme } = useTheme();
  
  return (
    <NotificationProvider>
      <AuthInitializer>
        <div className="App w-full min-h-screen bg-background text-foreground ">
          <AppRouter />
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme={theme}
          />
        </div>
      </AuthInitializer>
    </NotificationProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
