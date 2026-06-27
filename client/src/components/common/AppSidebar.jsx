import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useRedux";
import { fetchAllCategories } from "@/features/category/categoriesSlice";
import { cn } from "@/lib/utils";
import { motion as Motion } from "motion/react";
import { IconSettings, IconPin, IconPinnedOff } from "@tabler/icons-react";
import {
  NAVIGATION_CONFIG,
  NAVIGATION_SECTIONS,
  getUserRole,
  hasRole,
  isRouteActive,
} from "./navigation-config";
import { useSidebar } from "./sidebar-hooks";
import { SidebarProvider } from "./sidebar-context.jsx";

// Sidebar Context and Components

export const Sidebar = ({ children, open, setOpen, animate }) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...props} />
    </>
  );
};

export const DesktopSidebar = React.memo(
  ({ className, children, ...props }) => {
    const { open, setOpen, animate } = useSidebar();
    const containerRef = useRef(null);

    // Close sidebar on outside click for tablet and smaller (<= 1024px)
    useEffect(() => {
      if (!open) return;

      const isTabletOrBelow = () =>
        window.matchMedia("(max-width: 1024px)").matches;

      const handleDocumentClick = (e) => {
        if (!containerRef.current) return;
        if (!isTabletOrBelow()) return; // Only handle for tablet / smaller
        if (!containerRef.current.contains(e.target)) {
          setOpen(false);
        }
      };

      document.addEventListener("mousedown", handleDocumentClick);
      return () =>
        document.removeEventListener("mousedown", handleDocumentClick);
    }, [open, setOpen]);

    return (
      <Motion.aside
        ref={containerRef}
        className={cn(
          "relative z-40 px-4 py-4 hidden md:flex md:flex-col bg-background border-r border-border shrink-0",
          className
        )}
        initial={false}
        animate={{
          width: animate ? (open ? "16rem" : "4rem") : "16rem",
        }}
        style={{
          height: "calc(100vh - 4rem)",
          maxHeight: "calc(100vh - 4rem)",
        }}
        {...props}
      >
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden w-full">
          {children}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            setOpen(!open);
          }}
          className="absolute -right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-all z-60 flex items-center justify-center cursor-pointer bg-transparent border-none outline-none"
          title={open ? "Unpin sidebar" : "Pin sidebar"}
        >
          {open ? <IconPinnedOff size={16} /> : <IconPin size={16} />}
        </button>
      </Motion.aside>
    );
  }
);

DesktopSidebar.displayName = "DesktopSidebar";

export const MobileSidebar = React.memo(({ className, children, ...props }) => {
  const { open, setOpen } = useSidebar();
  const containerRef = useRef(null);

  const handleOverlayClick = useCallback(() => setOpen(false), [setOpen]);

  // Close on clicks outside the sidebar on small devices
  useEffect(() => {
    if (!open) return;

    const isSmallScreen = () => window.matchMedia("(max-width: 767px)").matches;

    const handleDocumentClick = (e) => {
      if (!containerRef.current) return;
      if (!isSmallScreen()) return; // Only for small screens
      if (!containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [open, setOpen]);

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={handleOverlayClick}
        />
      )}
      {/* Sidebar */}
      <Motion.aside
        ref={containerRef}
        className={cn(
          "fixed left-0 top-16 bottom-0 z-40 px-4 py-4 flex flex-col overflow-hidden bg-background border-r border-border w-sidebar md:hidden",
          className
        )}
        initial={{ x: "-100%" }}
        animate={{ x: open ? 0 : "-100%" }}
        transition={{ type: "tween", duration: 0.2 }}
        style={{
          height: "calc(100vh - 4rem)",
          maxHeight: "calc(100vh - 4rem)",
        }}
        {...props}
      >
        {children}
      </Motion.aside>
    </>
  );
});

MobileSidebar.displayName = "MobileSidebar";

export const SidebarLink = React.memo(({ link, className, ...props }) => {
  const { open, animate } = useSidebar();
  const location = useLocation();

  // Memoize active state calculation
  const isActive = useMemo(() => {
    // Exact match for most routes
    if (location.pathname === link.href) {
      return true;
    }
    // Special handling for /blogs
    if (link.href === "/blogs") {
      return (
        location.pathname === "/blogs" ||
        (location.pathname.startsWith("/blogs/") &&
          !location.pathname.startsWith("/blogs/create") &&
          !location.pathname.startsWith("/blogs/edit"))
      );
    }
    // Special handling for /category
    if (link.href === "/category") {
      return (
        location.pathname === "/category" ||
        location.pathname.startsWith("/category/")
      );
    }
    return false;
  }, [location.pathname, link.href]);

  // Check if this is User Management and is active
  const isUserManagementActive = link.href === "/users" && isActive;

  return (
    <Link
      to={link.href}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2 px-1 rounded-md transition-colors duration-200",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-foreground/80 hover:bg-accent/50 hover:text-foreground",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "transition-colors",
          isUserManagementActive && "text-destructive"
        )}
      >
        {link.icon}
      </span>
      <Motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block p-0! m-0! md:inline-block"
      >
        {link.label}
      </Motion.span>
    </Link>
  );
});

SidebarLink.displayName = "SidebarLink";

// Logo Components
export const Logo = React.memo(() => {
  return (
    <Link
      to="/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-foreground"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-foreground" />
      <Motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-foreground hidden md:inline-block"
      >
        Blog
      </Motion.span>
    </Link>
  );
});

Logo.displayName = "Logo";

export const LogoIcon = React.memo(() => {
  return (
    <Link
      to="/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-foreground"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-foreground" />
    </Link>
  );
});

LogoIcon.displayName = "LogoIcon";

const AppSidebar = React.memo(() => {
  const location = useLocation();
  const { isAuthenticated, isAdmin, isAuthor } = useAuth();
  const { loading: categoriesLoading, dispatch } = useCategories();
  const [hasFetched, setHasFetched] = useState(false);

  // Memoize user role to prevent recalculation
  const userRole = useMemo(
    () => getUserRole(isAdmin, isAuthor),
    [isAdmin, isAuthor]
  );

  // Memoize filtered navigation items
  const filteredItems = useMemo(() => {
    return Object.entries(NAVIGATION_CONFIG).reduce((acc, [key, config]) => {
      if (hasRole(config.roles, userRole)) {
        acc[key] = config;
      }
      return acc;
    }, {});
  }, [userRole]);

  // Memoize navigation links creation
  const navigationLinks = useMemo(() => {
    const links = [];

    Object.entries(NAVIGATION_SECTIONS).forEach(([, section]) => {
      // Skip sections that user doesn't have access to
      if (section.showFor && !section.showFor.includes(userRole)) return;

      // Get available items for this section
      const availableItems = section.items.filter(
        (itemKey) => filteredItems[itemKey]
      );

      if (availableItems.length === 0) return;

      // Create links for available items
      availableItems.forEach((itemKey) => {
        const item = filteredItems[itemKey];
        if (!item) return;

        const isActive = isRouteActive(item.path, location.pathname);
        const IconComponent = isActive ? item.activeIcon : item.icon;

        links.push({
          label: item.title,
          href: item.path,
          icon: (
            <IconComponent className="h-5 w-5 shrink-0 min-w-5 min-h-5 text-foreground/80" />
          ),
        });
      });
    });

    return links;
  }, [filteredItems, userRole, location.pathname]);

  // Profile link is static, so memoize it
  const profileLink = useMemo(
    () => ({
      label: "Profile Settings",
      href: "/profile",
      icon: (
        <IconSettings className="h-5 w-5 shrink-0 min-w-5 min-h-5 text-foreground/80" />
      ),
    }),
    []
  );

  // Fetch categories effect - optimized to prevent unnecessary calls
  useEffect(() => {
    if (isAuthenticated && !hasFetched && !categoriesLoading) {
      dispatch(fetchAllCategories())
        .unwrap()
        .then(() => setHasFetched(true))
        .catch(() => {
          // Handle error silently, but mark as fetched to prevent infinite retry loop
          setHasFetched(true);
        });
    }
  }, [isAuthenticated, hasFetched, categoriesLoading, dispatch]);

  // Early return for unauthenticated users
  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarBody className="h-full">
      {/* Desktop Layout */}
      <div className="hidden md:flex flex-col h-full w-full min-h-0">
        {/* Navigation Section - constrained height for desktop */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <nav
            className="flex flex-col gap-1 h-full py-1 overflow-hidden"
            role="navigation"
            aria-label="Main navigation"
          >
            {navigationLinks.map((link, idx) => (
              <SidebarLink key={`${link.href}-${idx}`} link={link} />
            ))}
          </nav>
        </div>

        {/* Profile Section - Fixed at bottom for desktop */}
        <div className="shrink-0 h-auto min-h-12 pt-2 border-t border-border/10 bg-background">
          <SidebarLink link={profileLink} />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col h-full min-h-0">
        {/* Navigation items - scrollable */}
        <nav
          className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto py-1"
          role="navigation"
          aria-label="Main navigation"
        >
          {navigationLinks.map((link, idx) => (
            <SidebarLink key={`${link.href}-${idx}`} link={link} />
          ))}
        </nav>

        {/* Profile section - pinned at bottom */}
        <div className="shrink-0 pt-2 border-t border-border/10">
          <SidebarLink link={profileLink} />
        </div>
      </div>
    </SidebarBody>
  );
});

AppSidebar.displayName = "AppSidebar";

export default AppSidebar;
