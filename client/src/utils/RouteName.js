export const RouteIndex = "/";
export const RouteProfile = "/profile";
export const RouteUserHome = "/dashboard";
export const RouteLogin = "/login";
export const RouteSignIn = "/login";
export const RouteSignUp = "/register";
export const RouteForgotPassword = "/forgot-password";
export const RouteResetPassword = "/reset-password";

// Public Category & Blog routes (for users)
export const RouteCategories = "/category";
export const RouteCategoryView = (slug) => `/category/${slug}`;
export const RouteBlogs = "/blogs";
export const RouteBlogView = (slug) => `/blog/${slug}`;

// Dashboard routes - clean URLs
export const RouteAdminHome = "/dashboard";
export const RouteAdminDashboard = "/dashboard";
export const RouteAuthorHome = "/dashboard";
export const RouteAuthorDashboard = "/dashboard";

// Role-based Category routes
export const RouteAddCategory = () => {
  return "/categories/add";
};

export const RouteEditCategory = (id) => {
  return `/categories/edit/${id}`;
};

// Role-based Blog routes
export const RouteCreateBlog = () => {
  return "/blogs/create";
};

export const RouteMyBlogs = "/my-blogs";
export const RouteAdminBlogs = "/blogs";
export const RouteAuthorBlogs = "/blogs";

// Role-based redirect helper
export const getRoleBasedRedirect = (user) => {
  if (!user) return "/";

  if (
    user.role === "admin" ||
    user.isAdmin ||
    user.role === "author" ||
    user.isAuthor
  ) {
    return "/dashboard";
  }

  return "/";
};
