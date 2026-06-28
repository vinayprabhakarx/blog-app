import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import FullScreenLoader from "@/components/common/FullScreenLoader";

// Route guard for protected routes
const PrivateRoute = () => {
  const { isAuthenticated, initializing, isServerDown } = useSelector((state) => state.auth);

  // Wait for initial auth check to complete
  if (initializing) {
    return <FullScreenLoader />;
  }

  if (isAuthenticated) {
    return <Outlet />;
  }

  // If backend is down, redirect to home instead of login
  if (isServerDown) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default PrivateRoute;
