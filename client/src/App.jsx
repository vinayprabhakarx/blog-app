import React, { useEffect } from "react";
import { ThemeProvider } from "@/utils/ThemeContext.jsx";
import { NotificationProvider } from "@/utils/NotificationContext";
import AppRouter from "@/utils/AppRouter";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getCurrentUser,
  initializationComplete,
  refreshTokenThunk,
} from "@/features/auth/authSlice";
import "@/index.css";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "@/utils/ThemeContext.jsx";

// Initialize authentication state
const AuthInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const { token, initializing } = useSelector((state) => state.auth);

  useEffect(() => {
    // Only run once on mount
    if (initializing) {
      const currentPath = window.location.pathname;
      // Auth pages that should clear tokens (login/signup flow)
      const authRoutes = [
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
      ];
      // Pages that bypass token logic entirely
      const bypassRoutes = ["/verify-email", "/resend-email"];
      
      const isAuthRoute = authRoutes.some((route) =>
        currentPath.startsWith(route)
      );
      const isBypassRoute = bypassRoutes.some((route) =>
        currentPath.startsWith(route)
      );

      const initAuth = async () => {
        try {
          if (isBypassRoute) {
            return;
          }

          if (isAuthRoute) {
            console.log("AuthInitializer: Clearing token on auth page");
            dispatch({ type: "auth/logout" });
            return;
          }

          // Try silent refresh
          const action = await dispatch(refreshTokenThunk());
          
          if (refreshTokenThunk.fulfilled.match(action)) {
            // We got a new token! Now fetch user profile
            await dispatch(getCurrentUser());
          }
        } finally {
          dispatch(initializationComplete());
        }
      };

      initAuth();
    }
  }, [dispatch, initializing]);

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
