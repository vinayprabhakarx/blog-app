import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import Loading from "@/components/common/Loading";

// Route guard for public routes that should not be accessible when authenticated
const PublicRoute = () => {
  const { isAuthenticated, initializing } = useSelector((state) => state.auth);

  // Wait for initial auth check to complete
  if (initializing) {
    return <Loading />;
  }

  // If user is authenticated, redirect to home, otherwise render the route
  return !isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

export default PublicRoute;
