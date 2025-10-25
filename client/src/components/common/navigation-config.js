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
  IconPencil,
  IconChartBar,
  IconNotification,
  IconPhoto,
} from "@tabler/icons-react";

// Navigation configuration
export const NAVIGATION_CONFIG = {
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
    activeIcon: IconTags,
    roles: ["user", "author", "admin"],
  },
  blogs: {
    title: "All Blogs",
    path: "/blogs",
    icon: IconNews,
    activeIcon: IconNews,
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
  gallery: {
    title: "Gallery",
    path: "/gallery",
    icon: IconPhoto,
    activeIcon: IconPhoto,
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
export const NAVIGATION_SECTIONS = {
  main: {
    label: "Navigation",
    items: ["dashboard", "categories", "blogs", "comments", "notifications"],
  },
  contentManagement: {
    label: "Blog Management",
    items: ["myBlogs", "createBlog", "gallery"],
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

// Helper function to determine user role
export const getUserRole = (isAdmin, isAuthor) => {
  if (isAdmin) return "admin";
  if (isAuthor) return "author";
  return "user";
};

// Helper function to check if user has required role
export const hasRole = (roles, userRole) => roles.includes(userRole);

// Helper function to check route activity
export const isRouteActive = (path, pathname) => {
  const exactMatches = [
    "/dashboard",
    "/profile",
    "/analytics",
    "/users",
    "/my-blogs",
    "/blogs/create",
    "/gallery",
    "/comments",
    "/notifications",
  ];

  if (exactMatches.includes(path)) {
    return pathname === path;
  }

  if (path === "/blogs") {
    return pathname === "/blogs" || pathname.startsWith("/blogs/");
  }

  if (path === "/categories") {
    return pathname === "/categories" || pathname.startsWith("/categories/");
  }

  return pathname.startsWith(path);
};
