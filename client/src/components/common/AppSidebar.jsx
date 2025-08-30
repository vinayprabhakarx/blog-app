import React, {
  useEffect,
  useMemo,
  useState,
  createContext,
  useContext,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCategories } from "../../hooks/useRedux";
import { fetchAllCategories } from "../../features/category/categoriesSlice";
import { cn } from "../../lib/utils";
import { motion } from "motion/react";
import {
  IconDashboard,
  IconNews,
  IconTags,
  IconMessages,
  IconBell,
  IconBookmark,
  IconEdit,
  IconChartLine,
  IconUsers,
  IconShield,
  IconSettings,
  IconFolder,
  IconPencil,
  IconChartBar,
  IconNotification,
} from "@tabler/icons-react";

// Sidebar Context and Components (from the provided sidebar)
const SidebarContext = createContext(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}) => {
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

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

export const DesktopSidebar = ({ className, children, ...props }) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "h-screen fixed left-0 top-0 z-50 px-4 py-4 hidden md:flex md:flex-col bg-background border-r border-border shrink-0 overflow-hidden",
          className
        )}
        animate={{
          width: animate ? (open ? "300px" : "60px") : "300px",
        }}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({ className, children, ...props }) => {
  const { open, setOpen } = useSidebar();

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      {/* Sidebar */}
      <motion.div
        className={cn(
          "fixed left-0 top-16 bottom-0 z-40 px-4 py-4 flex flex-col bg-background border-r border-border w-[250px] md:hidden",
          className
        )}
        initial={{ x: "-100%" }}
        animate={{ x: open ? 0 : "-100%" }}
        transition={{ type: "tween", duration: 0.2 }}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const SidebarLink = ({ link, className, ...props }) => {
  const { open, animate } = useSidebar();
  const location = useLocation();

  // Check if current route is active
  const isActive = (() => {
    // Exact match for most routes
    if (location.pathname === link.href) {
      return true;
    }

    // Special handling for /blogs - only match /blogs and /blogs/:slug, not /blogs/create
    if (link.href === "/blogs") {
      return (
        location.pathname === "/blogs" ||
        (location.pathname.startsWith("/blogs/") &&
          !location.pathname.startsWith("/blogs/create") &&
          !location.pathname.startsWith("/blogs/edit"))
      );
    }

    // Special handling for /categories - only match /categories and /categories/:slug
    if (link.href === "/categories") {
      return (
        location.pathname === "/categories" ||
        location.pathname.startsWith("/categories/")
      );
    }

    return false;
  })();

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
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0 md:inline-block"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};

// Navigation configuration
const NAVIGATION_CONFIG = {
  dashboard: {
    title: "Dashboard",
    path: "/dashboard",
    icon: IconDashboard,
    activeIcon: IconDashboard,
    roles: ["author", "admin"],
  },
  categories: {
    title: "Categories",
    path: "/categories",
    icon: IconTags,
    activeIcon: IconFolder,
    roles: ["user", "author", "admin"],
  },
  blogs: {
    title: "All Blogs",
    path: "/blogs",
    icon: IconNews,
    activeIcon: IconBookmark,
    roles: ["user", "author", "admin"],
  },
  comments: {
    title: "Comments",
    path: "/comments",
    icon: IconMessages,
    activeIcon: IconMessages,
    roles: ["admin", "author"],
  },
  notifications: {
    title: "Notifications",
    path: "/notifications",
    icon: IconBell,
    activeIcon: IconNotification,
    roles: ["user", "author", "admin"],
  },
  myBlogs: {
    title: "My Blogs",
    path: "/my-blogs",
    icon: IconBookmark,
    activeIcon: IconBookmark,
    roles: ["author", "admin"],
  },
  createBlog: {
    title: "Create Blog",
    path: "/blogs/create",
    icon: IconPencil,
    activeIcon: IconEdit,
    roles: ["author", "admin"],
  },
  analytics: {
    title: "Analytics",
    path: "/analytics",
    icon: IconChartLine,
    activeIcon: IconChartBar,
    roles: ["admin"],
  },
  users: {
    title: "User Management",
    path: "/users",
    icon: IconUsers,
    activeIcon: IconUsers,
    roles: ["admin"],
  },
};

// Navigation sections configuration
const NAVIGATION_SECTIONS = {
  main: {
    label: "Navigation",
    items: ["dashboard", "categories", "blogs", "comments", "notifications"],
  },
  contentManagement: {
    label: "Blog Management",
    items: ["myBlogs", "createBlog"],
    showFor: ["author", "admin"],
  },
  admin: {
    label: "Admin Panel",
    items: ["analytics", "users"],
    showFor: ["admin"],
    icon: IconShield,
  },
  account: {
    label: "Account",
    items: ["profile"],
  },
};

// Logo Components
export const Logo = () => {
  return (
    <Link
      to="/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-foreground"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-foreground" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-foreground hidden md:inline-block"
      >
        Acet Labs
      </motion.span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      to="/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-foreground"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-foreground" />
    </Link>
  );
};

const AppSidebar = () => {
  const location = useLocation();
  const { isAuthenticated, isAdmin, isAuthor } = useAuth();
  const { categories, loading: categoriesLoading, dispatch } = useCategories();
  const { open, setOpen } = useSidebar();

  useEffect(() => {
    if (categories.length === 0 && !categoriesLoading && isAuthenticated) {
      dispatch(fetchAllCategories());
    }
  }, [categories.length, categoriesLoading, isAuthenticated, dispatch]);

  const userRole = useMemo(() => {
    if (isAdmin) return "admin";
    if (isAuthor) return "author";
    return "user";
  }, [isAdmin, isAuthor]);

  const getFilteredItems = useMemo(() => {
    const hasRole = (roles) => roles.includes(userRole);

    return Object.entries(NAVIGATION_CONFIG).reduce((acc, [key, config]) => {
      if (!hasRole(config.roles)) return acc;

      acc[key] = config;
      return acc;
    }, {});
  }, [userRole]);

  const isActiveRoute = (path) => {
    const exactMatches = [
      "/dashboard",
      "/profile",
      "/analytics",
      "/users",
      "/my-blogs",
      "/blogs/create",
      "/comments",
    ];

    if (exactMatches.includes(path)) {
      return location.pathname === path;
    }

    if (path === "/blogs") {
      return (
        location.pathname === "/blogs" ||
        location.pathname.startsWith("/blogs/")
      );
    }

    if (path === "/categories") {
      return (
        location.pathname === "/categories" ||
        location.pathname.startsWith("/categories/")
      );
    }

    return location.pathname.startsWith(path);
  };

  const createLinks = () => {
    const links = [];

    Object.entries(NAVIGATION_SECTIONS).forEach(([sectionKey, section]) => {
      if (section.showFor && !section.showFor.includes(userRole)) return;

      const availableItems = section.items.filter(
        (itemKey) => getFilteredItems[itemKey]
      );

      if (availableItems.length === 0) return;

      availableItems.forEach((itemKey) => {
        const item = getFilteredItems[itemKey];
        if (!item) return;

        const isActive = isActiveRoute(item.path);
        const IconComponent = isActive ? item.activeIcon : item.icon;
        const isAdminSection = sectionKey === "admin";

        links.push({
          label: item.title,
          href: item.path,
          icon: (
            <IconComponent className="h-5 w-5 flex-shrink-0 min-w-[20px] min-h-[20px] text-foreground/80" />
          ),
        });
      });
    });

    return links;
  };

  if (!isAuthenticated) {
    return null;
  }

  const links = createLinks();

  return (
    <>
      {/* Sidebar */}
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          <div className="mt-4 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>
        </div>
        <div>
          <SidebarLink
            link={{
              label: "Profile Settings",
              href: "/profile",
              icon: (
                <IconSettings className="h-5 w-5 flex-shrink-0 min-w-[20px] min-h-[20px] text-foreground/80" />
              ),
            }}
          />
        </div>
      </SidebarBody>

      {/* Content area push is now handled in AppLayout.jsx */}
    </>
  );
};

export default AppSidebar;
