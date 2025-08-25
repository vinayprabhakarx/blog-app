import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

// Route guard for public routes that should not be accessible when authenticated
const PublicRoute = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  // If user is authenticated, redirect to home, otherwise render the route
  return !isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

export default PublicRoute;
