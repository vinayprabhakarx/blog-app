import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import Loading from "@/components/common/Loading";

// Route guard for protected routes
const PrivateRoute = () => {
  const { isAuthenticated, initializing } = useSelector((state) => state.auth);

  // Wait for initial auth check to complete
  if (initializing) {
    return <Loading />;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
