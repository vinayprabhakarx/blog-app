import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getRoleBasedRedirect } from "@/utils/RouteName";
import LoadingSpinner from "./LoadingSpinner";

const DashboardRedirect = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = getRoleBasedRedirect(user);
      navigate(redirectPath, { replace: true });
    } else if (!isAuthenticated) {
      // If not authenticated, redirect to login
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <LoadingSpinner size="lg" message="Redirecting to your dashboard..." />
    </div>
  );
};

export default DashboardRedirect;
