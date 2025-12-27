/**
 * Clean up stale authentication tokens before Redux store initializes
 * This prevents redirect loops caused by invalid tokens from other apps on the same domain
 */
export const cleanupStaleToken = () => {
  const publicRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ];
  
  const currentPath = window.location.pathname;
  const isPublicRoute = publicRoutes.some((route) => currentPath.startsWith(route));
  
  // If we're on an auth page and there's a token, it's likely stale
  // Clear it BEFORE Redux initializes to prevent redirect loops
  if (isPublicRoute && localStorage.getItem("token")) {
    console.log("Clearing stale token on auth page before Redux initialization");
    localStorage.removeItem("token");
  }
  
  // CRITICAL: Also clear redux-persist storage for auth on auth pages
  // This prevents rehydration of old isAuthenticated state
  if (isPublicRoute) {
    // Redux-persist stores data under "persist:root" key
    const persistKey = "persist:root";
    const persistedData = localStorage.getItem(persistKey);
    
    if (persistedData) {
      try {
        const parsed = JSON.parse(persistedData);
        // Clear only the auth portion to avoid affecting other persisted state
        if (parsed.auth) {
          console.log("Clearing persisted auth state on auth page");
          delete parsed.auth;
          localStorage.setItem(persistKey, JSON.stringify(parsed));
        }
      } catch (e) {
        console.error("Error clearing persisted auth:", e);
      }
    }
  }
};
