import React, { useState, useEffect } from "react";
import logoLight from "../../assets/logo-light.png";
import logoDark from "../../assets/logo-dark.png";
import { Link, useNavigate } from "react-router-dom";
import { FiUser } from "react-icons/fi";
import SearchBar from "./SearchBar";
import { useDispatch } from "react-redux";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { FaRegUser } from "react-icons/fa";
import { IoLogOutOutline } from "react-icons/io5";
import ThemeToggle from "./ThemeToggle";
import { logout } from "../../features/auth/authSlice";
import { showToast } from "../../utils/showToast";
import { AiOutlineMenu } from "react-icons/ai";
import { useSidebar } from "../ui/sidebar";
import { RouteIndex, RouteProfile, RouteSignIn } from "../../utils/RouteName";
import { useTheme } from "../../utils/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import { Bell, Search } from "lucide-react";
import NotificationDropdown from "../../features/notification/NotificationDropdown";

const Topbar = () => {
  const { toggleSidebar } = useSidebar();
  const [showSearch, setShowSearch] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentLogo, setCurrentLogo] = useState(logoLight);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, getUserName, getUserEmail, getUserAvatar } =
    useAuth();

  const { theme } = useTheme();

  useEffect(() => {
    setCurrentLogo(theme === "dark" ? logoDark : logoLight);
  }, [theme]);

  const handleLogout = () => {
    dispatch(logout());
    navigate(RouteIndex);
    showToast("success", "Logged out successfully");
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
  };

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
    toggleSidebar();
  };

  return (
    <>
      <div className="flex justify-between items-center h-16 fixed w-full z-20 bg-background/95 backdrop-blur-sm text-foreground px-4 sm:px-6 md:px-8 border-b border-border/20 shadow-sm no-print">
        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated && (
            <button
              onClick={handleSidebarToggle}
              className="p-2 rounded-lg hover:bg-accent/80 transition-all duration-200 ease-in-out flex-shrink-0 md:hidden"
              type="button"
              aria-label="Toggle sidebar"
            >
              <AiOutlineMenu className="w-5 h-5" />
            </button>
          )}

          <Link
            to={RouteIndex}
            className="hidden md:flex items-center hover:opacity-80 transition-opacity duration-200 p-1 rounded-lg"
          >
            <img
              key={`logo-desktop-${theme}`}
              src={currentLogo}
              alt="Logo"
              className="object-contain transition-opacity duration-300"
              style={{
                height: "80px",
                minHeight: "80px",
                width: "auto",
                minWidth: "auto",
                maxWidth: "none",
              }}
            />
          </Link>

          <Link
            to={RouteIndex}
            className="flex md:hidden items-center hover:opacity-80 transition-opacity duration-200 p-1 rounded-lg"
          >
            <img
              key={`logo-mobile-${theme}`}
              src={currentLogo}
              alt="Logo"
              className="object-contain transition-opacity duration-300"
              style={{
                height: "80px",
                minHeight: "80px",
                width: "auto",
                minWidth: "auto",
                maxWidth: "none",
              }}
            />
          </Link>
        </div>

        <div className="hidden md:block flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-4">
          <SearchBar />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleSearch}
            type="button"
            className="md:hidden p-2 rounded-lg hover:bg-accent/80 transition-all duration-200 ease-in-out active:scale-95"
            aria-label="Toggle search"
          >
            <Search className="w-5 h-5" />
          </button>

          {isAuthenticated && <NotificationDropdown />}

          <ThemeToggle />

          {!isAuthenticated ? (
            <Link
              to={RouteSignIn}
              className="p-2 rounded-lg hover:bg-accent/80 transition-all duration-200 ease-in-out relative active:scale-95"
              aria-label="Sign In"
            >
              <FiUser className="w-5 h-5" />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="cursor-pointer">
                  <Avatar className="w-8 h-8 sm:w-9 sm:h-9">
                    <AvatarImage
                      src={getUserAvatar() || undefined}
                      alt={getUserName()}
                      crossOrigin="anonymous"
                    />
                    <AvatarFallback>
                      <img
                        src="https://github.com/shadcn.png"
                        alt="Fallback"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="font-semibold truncate">{getUserName()}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {getUserEmail()}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to={RouteProfile} className="flex items-center gap-2">
                      <FaRegUser className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors text-foreground flex items-center gap-2"
                  >
                    <IoLogOutOutline className="w-4 h-4 text-red-500" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {showSearch && (
        <div className="fixed top-16 left-0 right-0 z-30 md:hidden bg-background/95 backdrop-blur-sm border-b border-border/20 shadow-sm">
          <div className="px-4 py-3">
            <SearchBar />
          </div>
        </div>
      )}

      {showSearch && (
        <div
          className="fixed inset-0 bg-black/20 z-20 md:hidden"
          onClick={() => setShowSearch(false)}
          aria-label="Close search"
        />
      )}
    </>
  );
};

export default Topbar;
