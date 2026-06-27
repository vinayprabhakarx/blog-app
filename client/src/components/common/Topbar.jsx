import React, { useEffect, useCallback, useMemo } from "react";
import Logo from "@/components/common/Logo";
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
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaRegUser } from "react-icons/fa";
import { IoLogOutOutline } from "react-icons/io5";
import ThemeToggle from "./ThemeToggle";
import { logout } from "@/features/auth/authSlice";
import { showToast } from "@/utils/showToast";
import { RouteIndex, RouteProfile, RouteSignIn } from "@/utils/RouteName";
import { useAuth } from "@/hooks/useAuth";
import { Search, Menu, X, ArrowLeft } from "lucide-react";
import NotificationDropdown from "@/features/notification/NotificationDropdown";
import { useSidebar } from "./sidebar-hooks";

const Topbar = React.memo(() => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, getUserName, getUserEmail, getUserAvatar } =
    useAuth();
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



  // Memoize callback functions
  const handleLogout = useCallback(() => {
    dispatch(logout());
    navigate(RouteIndex);
    showToast("success", "Logged out successfully");
  }, [dispatch, navigate]);

  // Handle closing mobile search from SearchBar
  useEffect(() => {
    const handleCloseMobileSearch = () => {
      // no-op if we are using the modal directly in SearchBar now
    };
    
    window.addEventListener("closeMobileSearch", handleCloseMobileSearch);
    return () => window.removeEventListener("closeMobileSearch", handleCloseMobileSearch);
  }, []);

  return (
    <header className="fixed top-0 w-full z-30 bg-background/95 backdrop-blur-sm text-foreground border-b border-border/20 shadow-sm no-print">
      <div className="mx-auto max-w-7xl w-full h-14 flex items-center px-4 md:px-6 lg:px-8">
        <>
          {/* Left Section: Menu & Logo */}
          <div className="flex items-center gap-1 sm:gap-6 md:gap-8 flex-1">
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
              className="flex items-center hover:opacity-80 transition-opacity duration-200 rounded-lg shrink-0"
            >
              <Logo svgClassName="w-8 h-8 text-foreground" />
            </Link>
          </div>

          {/* Middle Section: Search Bar (Desktop) */}
          <div className="flex items-center justify-center hidden md:flex shrink-0 px-4">
            <div className="w-64 lg:w-96">
              <SearchBar />
            </div>
          </div>

          {/* Right Section: Docs, Mobile Search, Actions */}
          <div className="flex items-center justify-end gap-1 sm:gap-4 flex-1">
            <a
              href="https://docs.vinayprabhakar.dev"
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm font-semibold text-foreground hover:text-primary transition-colors duration-200 ${isAuthenticated ? "hidden md:block" : "block"}`}
            >
              Docs
            </a>
            {/* Mobile: just a search icon that opens the same modal */}
            <div className="md:hidden">
              <SearchBar iconOnly disableHotkey />
            </div>


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
                    className="w-56 md:w-64 max-w-modal mr-2 sm:mr-4"
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
      </div>
    </header>
  );
});

Topbar.displayName = "Topbar";
export default Topbar;
