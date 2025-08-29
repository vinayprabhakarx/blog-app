import AppSidebar from "../common/AppSidebar";
import Footer from "../common/Footer";
import Topbar from "../common/Topbar";
import { SidebarProvider } from "../ui/sidebar";
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const AppLayout = () => {
  const location = useLocation();
  const { isAuthenticated, isAdmin, isAuthor } = useAuth();

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

  const showSidebar = shouldShowSidebar();
  const isAuth = isAuthRoute();

  return (
    <div className="flex flex-col min-h-screen w-full">
      <SidebarProvider>
        <Topbar />
        <div className="flex flex-1 overflow-hidden">
          {showSidebar && <AppSidebar />}
          <main
            className={`flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out ${
              showSidebar ? "" : "w-full"
            }`}
          >
            {isAuth ? (
              <div className="flex items-center justify-center min-h-[calc(100vh-64px)] pt-16 pb-20 px-4">
                <div className="w-full max-w-[400px]">
                  <Outlet />
                </div>
              </div>
            ) : (
              <div className="w-full min-h-[calc(100vh-64px)] pt-20 pb-8 px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 mx-auto max-w-[2000px]">
                <div className="w-full max-w-full mx-auto">
                  <Outlet />
                </div>
              </div>
            )}
            <Footer className="border-t border-border" />
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AppLayout;
