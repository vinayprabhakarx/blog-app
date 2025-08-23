import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

// Route guard for protected routes
const PrivateRoute = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
