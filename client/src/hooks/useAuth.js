import { useSelector } from "react-redux";

export const useAuth = () => {
  const { user, isAuthenticated, loading, error } = useSelector(
    (state) => state.auth
  );

  const isAdmin = user?.role === "admin";
  const isAuthor = user?.role === "author" || user?.role === "admin";
  const hasRole = (role) => user?.role === role;

  const canCreateBlog = isAuthor;
  const canEditBlog = (blog) => isAdmin || blog?.author?.id === user?.id;
  const canDeleteBlog = (blog) => isAdmin || blog?.author?.id === user?.id;

  return {
    user,
    isAuthenticated,
    loading,
    error,
    isAdmin,
    isAuthor,
    hasRole,
    canCreateBlog,
    canEditBlog,
    canDeleteBlog,
    getUserRole: () => user?.role || "user",
    getUserName: () => user?.name || "",
    getUserEmail: () => user?.email || "",
    getUserAvatar: () => user?.avatar || "",
    getUserId: () => user?._id || user?.id || null,
  };
};

export const useIsAdmin = () => {
  const { user } = useSelector((state) => state.auth);
  return user?.role === "admin";
};

export const useIsAuthor = () => {
  const { user } = useSelector((state) => state.auth);
  return user?.role === "author" || user?.role === "admin";
};

export const useCanCreateBlog = () => {
  const { user } = useSelector((state) => state.auth);
  return user?.role === "author" || user?.role === "admin";
};

export const useUser = () => {
  const { user } = useSelector((state) => state.auth);
  return user;
};

export const useUserRole = () => {
  const { user } = useSelector((state) => state.auth);
  return user?.role || "user";
};

export default useAuth;
