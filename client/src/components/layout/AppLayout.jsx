import AppSidebar from "@/components/common/AppSidebar";
import { SidebarProvider } from "@/components/common/sidebar-context.jsx";
import Footer from "@/components/common/Footer";
import Topbar from "@/components/common/Topbar";
import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ScrollToTopButton from "@/components/common/ScrollToTopButton";

const AppLayout = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

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
    <SidebarProvider 
      open={sidebarOpen} 
      setOpen={setSidebarOpen}
    >
      <div className="flex flex-col h-screen overflow-hidden">
        <Topbar />
        <div className="flex flex-1 pt-16 min-h-0">
          {shouldShowSidebar() && <AppSidebar />}
          <div id="main-scroll-container" className="flex-1 overflow-auto min-h-0">
            <main className="mx-auto w-full">
              {isAuth ? (
                <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-4 px-4">
                  <div className="w-full max-w-md">
                    <Outlet />
                  </div>
                </div>
              ) : (
                <div className="w-full min-h-[calc(100vh-4rem)] pt-4 pb-8 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 mx-auto max-w-7xl">
                  <div className="w-full max-w-full mx-auto">
                    <Outlet />
                  </div>
                </div>
              )}
            </main>
            <Footer className="border-t border-border mt-auto" />
            <ScrollToTopButton />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
