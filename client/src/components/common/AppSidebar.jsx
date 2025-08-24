import React, { useEffect, useMemo } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCategories } from "../../hooks/useRedux";
import { fetchAllCategories } from "../../features/category/categoriesSlice";
import {
  FaChartLine,
  FaChartArea,
  FaBlog,
  FaShieldAlt,
  FaUserCircle,
  FaTachometerAlt,
  FaPencilAlt,
  FaThLarge,
} from "react-icons/fa";
import {
  FaNewspaper,
  FaTags,
  FaTag,
  FaComments,
  FaComment,
  FaPen,
  FaBookOpen,
  FaBook,
  FaUsers,
  FaBell,
  FaRegBell,
  FaUser,
} from "react-icons/fa6";

// Navigation configuration
const NAVIGATION_CONFIG = {
  dashboard: {
    title: "Dashboard",
    path: "/dashboard",
    icon: FaThLarge,
    activeIcon: FaTachometerAlt,
    roles: ["author", "admin"],
  },
  categories: {
    title: "Categories",
    path: "/categories",
    icon: FaTag,
    activeIcon: FaTags,
    roles: ["user", "author", "admin"],
  },
  blogs: {
    title: "All Blogs",
    path: "/blogs",
    icon: FaNewspaper,
    activeIcon: FaBlog,
    roles: ["user", "author", "admin"],
  },
  comments: {
    title: "Comments",
    path: "/comments",
    icon: FaComment,
    activeIcon: FaComments,
    roles: ["admin", "author"],
  },
  notifications: {
    title: "Notifications",
    path: "/notifications",
    icon: FaRegBell,
    activeIcon: FaBell,
    roles: ["user", "author", "admin"],
  },

  myBlogs: {
    title: "My Blogs",
    path: "/my-blogs",
    icon: FaBookOpen,
    activeIcon: FaBook,
    roles: ["author", "admin"],
  },
  createBlog: {
    title: "Create Blog",
    path: "/blogs/create",
    icon: FaPencilAlt,
    activeIcon: FaPen,
    roles: ["author", "admin"],
  },
  analytics: {
    title: "Analytics",
    path: "/analytics",
    icon: FaChartLine,
    activeIcon: FaChartArea,
    roles: ["admin"],
  },
  users: {
    title: "User Management",
    path: "/users",
    icon: FaUsers,
    activeIcon: FaUsers,
    roles: ["admin"],
  },
  profile: {
    title: "Profile",
    path: "/profile",
    icon: FaUser,
    activeIcon: FaUserCircle,
    roles: ["user", "author", "admin"],
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
    icon: FaShieldAlt,
    className: "text-red-600 dark:text-red-400",
  },
  account: {
    label: "Account",
    items: ["profile"],
  },
};

const AppSidebar = () => {
  const location = useLocation();
  const { isAuthenticated, isAdmin, isAuthor } = useAuth();
  const { categories, loading: categoriesLoading, dispatch } = useCategories();

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

    // Handle routes with sub-paths
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

  const renderNavigationItem = (itemKey) => {
    const item = getFilteredItems[itemKey];
    if (!item) return null;

    const isActive = isActiveRoute(item.path);
    const IconComponent = isActive ? item.activeIcon : item.icon;

    return (
      <SidebarMenuItem key={item.path}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          className="w-full transition-all duration-200 ease-in-out hover:bg-accent/80"
        >
          <Link
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
              isActive
                ? "bg-primary/10 text-primary font-medium shadow-sm"
                : "text-foreground/80 hover:text-foreground"
            }`}
          >
            <IconComponent
              className={`w-5 h-5 ${
                isActive ? "text-primary" : "text-foreground/70"
              }`}
            />
            <span className="text-sm">{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const renderAdminNavigationItem = (itemKey) => {
    const item = getFilteredItems[itemKey];
    if (!item) return null;

    const isActive = isActiveRoute(item.path);
    const IconComponent = isActive ? item.activeIcon : item.icon;

    return (
      <SidebarMenuItem key={item.path}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          className="w-full transition-all duration-200 ease-in-out hover:bg-accent/80"
        >
          <Link
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
              isActive
                ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-medium shadow-sm"
                : "text-foreground/80 hover:text-foreground"
            }`}
          >
            <IconComponent
              className={`w-5 h-5 ${
                isActive
                  ? "text-red-600 dark:text-red-400"
                  : "text-foreground/70"
              }`}
            />
            <span className="text-sm">{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const renderNavigationSection = (sectionKey) => {
    const section = NAVIGATION_SECTIONS[sectionKey];
    if (!section) return null;

    if (section.showFor && !section.showFor.includes(userRole)) return null;

    const availableItems = section.items.filter(
      (itemKey) => getFilteredItems[itemKey]
    );
    if (availableItems.length === 0) return null;

    const isAdminSection = sectionKey === "admin";

    return (
      <React.Fragment key={sectionKey}>
        {sectionKey !== "main" && <SidebarSeparator className="my-4" />}
        <SidebarGroup>
          <SidebarGroupLabel
            className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
              section.className || "text-foreground/60"
            }`}
          >
            {section.icon && <section.icon className="w-3 h-3" />}
            {section.label}
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            {availableItems.map((itemKey) => {
              const item = getFilteredItems[itemKey];
              if (!item) return null;

              return isAdminSection
                ? renderAdminNavigationItem(itemKey)
                : renderNavigationItem(itemKey);
            })}
          </SidebarMenu>
        </SidebarGroup>
      </React.Fragment>
    );
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Sidebar>
      <SidebarContent className="bg-background text-foreground pt-4">
        {renderNavigationSection("main")}
        {renderNavigationSection("contentManagement")}
        {renderNavigationSection("admin")}
        {renderNavigationSection("account")}
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
