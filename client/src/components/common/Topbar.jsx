import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { RouteIndex, RouteProfile, RouteSignIn } from "../../utils/RouteName";
import { useTheme } from "../../utils/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import { Search, Menu, X, ArrowLeft } from "lucide-react";
import NotificationDropdown from "../../features/notification/NotificationDropdown";
import { useSidebar } from "./sidebar-hooks";

const Topbar = React.memo(() => {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [currentLogo, setCurrentLogo] = useState(logoLight);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, getUserName, getUserEmail, getUserAvatar } =
    useAuth();
  const { theme } = useTheme();
  const { open, setOpen } = useSidebar();

  // Memoize user data to prevent unnecessary re-renders
  const userData = useMemo(
    () => ({
      name: getUserName(),
      email: getUserEmail(),
      avatar: getUserAvatar(),
    }),
    [getUserName, getUserEmail, getUserAvatar]
  );

  // Memoize logo based on theme
  const currentLogoMemo = useMemo(
    () => (theme === "dark" ? logoDark : logoLight),
    [theme]
  );

  // Memoize logo style to prevent recreation
  const logoStyle = useMemo(
    () => ({
      height: "80px",
      minHeight: "80px",
      width: "auto",
      minWidth: "auto",
      maxWidth: "none",
    }),
    []
  );

  useEffect(() => {
    setCurrentLogo(currentLogoMemo);
  }, [currentLogoMemo]);

  // Memoize callback functions
  const handleLogout = useCallback(() => {
    dispatch(logout());
    navigate(RouteIndex);
    showToast("success", "Logged out successfully");
  }, [dispatch, navigate]);

  const openMobileSearch = useCallback(() => {
    setShowMobileSearch(true);
  }, []);

  const closeMobileSearch = useCallback(() => {
    setShowMobileSearch(false);
  }, []);

  // Listen for close mobile search event from SearchBar
  useEffect(() => {
    const handleCloseMobileSearch = () => {
      setShowMobileSearch(false);
    };
    window.addEventListener("closeMobileSearch", handleCloseMobileSearch);
    return () => window.removeEventListener("closeMobileSearch", handleCloseMobileSearch);
  }, []);

  return (
    <div className="flex justify-between items-center h-16 fixed w-full z-[100] bg-background/95 backdrop-blur-sm text-foreground pl-4 pr-3 sm:pl-4 sm:pr-4 md:pl-4 md:pr-6 border-b border-border/20 shadow-sm no-print">
      {/* Mobile search mode - replaces entire navbar content like YouTube */}
      {showMobileSearch ? (
        <div className="flex items-center gap-2 w-full md:hidden pr-2">
          <button
            onClick={closeMobileSearch}
            className="p-1.5 rounded-md hover:bg-accent/50 transition-colors flex-shrink-0"
            aria-label="Close search"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <SearchBar onResultClick={closeMobileSearch} />
          </div>
        </div>
      ) : (
        <>
          {/* Normal navbar content */}
          <div className="flex items-center gap-2 sm:gap-4">
            {isAuthenticated && (
              <button
                className="md:hidden p-2 -ml-2 rounded-md hover:bg-accent/50 transition-colors"
                onClick={() => setOpen(!open)}
                aria-label={open ? "Close menu" : "Open menu"}
              >
                {open ? (
                  <X className="h-5 w-5 transition-transform duration-200" />
                ) : (
                  <Menu className="h-5 w-5 transition-transform duration-200" />
                )}
              </button>
            )}
            <Link
              to={RouteIndex}
              className="flex items-center hover:opacity-80 transition-opacity duration-200 rounded-lg"
            >
              <img
                key={`logo-${theme}`}
                src={currentLogo}
                alt="Logo"
                className="object-contain transition-opacity duration-300"
                style={logoStyle}
              />
            </Link>
          </div>

          {/* Desktop search bar */}
          <div className="hidden md:block flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-4">
            <SearchBar />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile search icon */}
            <button
              onClick={openMobileSearch}
              type="button"
              className="md:hidden p-2 rounded-lg hover:bg-accent/80 transition-all duration-200 ease-in-out active:scale-95"
              aria-label="Open search"
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
                  <DropdownMenuTrigger asChild>
                    <button
                      className="cursor-pointer rounded-full focus:outline-none p-0.5 -m-0.5 touch-manipulation transition-all duration-200"
                      aria-label="Open user menu"
                    >
                      <Avatar className=" w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-8 transition-transform duration-200 hover:scale-105 active:scale-95">
                        <AvatarImage
                          src={userData.avatar || null}
                          className="w-full h-full object-cover rounded-full"
                        />
                        <AvatarFallback>
                          <FaRegUser className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 md:w-64 max-w-[90vw] mr-2 sm:mr-4"
                    sideOffset={8}
                    alignOffset={-4}
                  >
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
                      <IoLogOutOutline className="w-4 h-4 text-destructive" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
});

Topbar.displayName = "Topbar";
export default Topbar;
