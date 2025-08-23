import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";


// Route guard for admin and author routes

const AdminRoute = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is an admin or author
  if (!["admin", "author"].includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
