import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

// Route guard for admin-only routes
const AdminRoute = () => {
  const { isAuthenticated, user, isServerDown } = useSelector((state) => state.auth);

  // If backend is down, redirect to home instead of login
  if (isServerDown) {
    return <Navigate to="/" replace />;
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user data is still loading
  if (!user) {
    return <div>Loading...</div>;
  }

  // Check if user is an admin only
  if (user?.role !== "admin") {
    // Redirect based on user role
    if (user?.role === "author") {
      return <Navigate to="/dashboard" replace />;
    } else {
      // Normal users go to home page
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

export default AdminRoute;
