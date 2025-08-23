import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./app/store";
import { ThemeProvider } from "./utils/ThemeContext.jsx";
import { SidebarProvider } from "./components/ui/sidebar";
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
    <PersistGate persistor={persistor}>
      <Provider store={store}>
        <ThemeProvider>
          <SidebarProvider>
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
          </SidebarProvider>
        </ThemeProvider>
      </Provider>
    </PersistGate>
  );
}

export default App;
