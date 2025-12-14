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

// Initialize authentication state
const AuthInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const { token, initializing } = useSelector((state) => state.auth);

  useEffect(() => {
    // Only run once on mount
    if (initializing) {
      // Public routes that don't need auth verification
      const publicRoutes = [
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
      ];
      const isPublicRoute = publicRoutes.some((route) =>
        window.location.pathname.startsWith(route)
      );

      if (token && !isPublicRoute) {
        // Verify the token by fetching current user
        dispatch(getCurrentUser()).catch(() => {
          // If token validation fails, clear it
          localStorage.removeItem("token");
        });
      } else {
        // No token or on public route, mark initialization complete
        dispatch(initializationComplete());
      }
    }
  }, [dispatch, token, initializing]);

  return children;
};

function App() {
  return (
    <ThemeProvider>
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
              theme="light"
            />
          </div>
        </AuthInitializer>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
