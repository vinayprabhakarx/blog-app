import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import FullScreenLoader from "@/components/common/FullScreenLoader";

// Route guard for public routes that should not be accessible when authenticated
const PublicRoute = () => {
  const { isAuthenticated, initializing, isServerDown } = useSelector((state) => state.auth);

  // Wait for initial auth check to complete
  if (initializing) {
    return <FullScreenLoader />;
  }

  // If backend is down, prevent access to auth pages and redirect to home
  if (isServerDown) {
    return <Navigate to="/" replace />;
  }

  // If user is authenticated, redirect to home, otherwise render the route
  return !isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

export default PublicRoute;
