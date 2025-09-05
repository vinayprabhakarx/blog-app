import React, { useEffect } from "react";
import { ThemeProvider } from "./utils/ThemeContext.jsx";
import { NotificationProvider } from "./utils/NotificationContext";
import AppRouter from "./utils/AppRouter";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getCurrentUser } from "./features/auth/authSlice";
import "./index.css";
import { useDispatch, useSelector } from "react-redux";

// Initialize authentication state
const AuthInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const { token, isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && (!user || !isAuthenticated)) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, token, isAuthenticated, user]);

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
