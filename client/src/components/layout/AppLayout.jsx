import AppSidebar from "@/components/common/AppSidebar";
import { SidebarProvider } from "@/components/common/sidebar-context.jsx";
import Footer from "@/components/common/Footer";
import Topbar from "@/components/common/Topbar";
import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const AppLayout = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Reset sidebar state when authentication changes
  useEffect(() => {
    if (!isAuthenticated) {
      setSidebarOpen(false);
    }
  }, [isAuthenticated]);

  const isAuthRoute = () => {
    return location.pathname === "/login" || location.pathname === "/register";
  };

  const shouldShowSidebar = () => {
    if (isAuthRoute()) {
      return false;
    }

    // Show sidebar for all authenticated users (including regular users)
    if (isAuthenticated) {
      return true;
    }

    return false;
  };

  const isAuth = isAuthRoute();

  return (
    <SidebarProvider open={sidebarOpen} setOpen={setSidebarOpen}>
      <div className="flex flex-col min-h-screen">
        <Topbar />
        <div className="flex flex-1">
          {shouldShowSidebar() && <AppSidebar />}
          <div
            className={`flex-1 overflow-auto ${
              shouldShowSidebar() ? "md:ml-[60px]" : ""
            }`}
          >
            <main className="mx-auto w-full">
              {isAuth ? (
                <div className="flex items-center justify-center min-h-[calc(100vh-64px)] pt-10 pb-10 px-4">
                  <div className="w-full max-w-[400px]">
                    <Outlet />
                  </div>
                </div>
              ) : (
                <div className="w-full min-h-[calc(100vh-64px)] pt-20 pb-8 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 mx-auto max-w-[2000px]">
                  <div className="w-full max-w-full mx-auto">
                    <Outlet />
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
        <Footer className="border-t border-border" />
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
