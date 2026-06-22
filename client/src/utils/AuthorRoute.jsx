import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const AuthorRoute = () => {
  const { isAuthenticated, user, isAuthor, isAdmin, isServerDown } = useAuth();

  // If backend is down, redirect to home instead of login
  if (isServerDown) {
    return <Navigate to="/" replace />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user data is still loading, show loading or wait
  if (!user) {
    return <div>Loading...</div>;
  }

  // Check if user has author or admin role
  if (!isAuthor && !isAdmin) {
    // Redirect normal users to home page
    return <Navigate to="/" replace />;
  }

  // User is authenticated and has author/admin role
  return <Outlet />;
};

export default AuthorRoute;
