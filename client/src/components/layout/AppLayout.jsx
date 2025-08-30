import AppSidebar, { SidebarProvider } from "../common/AppSidebar";
import Footer from "../common/Footer";
import Topbar from "../common/Topbar";
import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const AppLayout = () => {
  const location = useLocation();
  const { isAuthenticated, isAdmin, isAuthor } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAuthRoute = () => {
    return location.pathname === "/login" || location.pathname === "/register";
  };

  const shouldShowSidebar = () => {
    if (isAuthRoute()) {
      return false;
    }

    if (isAuthenticated && location.pathname !== "/") {
      return true;
    }

    if (isAuthenticated && (isAdmin || isAuthor)) {
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
