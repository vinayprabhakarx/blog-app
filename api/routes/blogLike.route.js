import { Router } from "express";
import {
  toggleBlogLike,
  getBlogLikeStatus,
  getBlogLikes,
  getUserLikedBlogs,
  getMyLikedBlogs,
  getTrendingBlogs,
  getBlogLikeAnalytics,
  getUserLikeStats,
  getMyLikeStats,
  getMostLikedBlogs,
  clearBlogLikes,
  bulkRemoveLikes,
  getBlogLikeInsights,
} from "../controllers/blogLike.controller.js";
import authenticate from "../middleware/authenticate.js";
import onlyAdmin from "../middleware/onlyAdmin.js";

const router = Router();

// ============= CORE LIKE OPERATIONS =============

// POST/DELETE /api/blogs/:blogId/like - Toggle like/unlike a blog (Private)
router.post("/blogs/:blogId/like", authenticate, toggleBlogLike);
router.delete("/blogs/:blogId/like", authenticate, toggleBlogLike);

// GET /api/blogs/:blogId/like-status - Check if current user has liked a blog (Private)
router.get("/blogs/:blogId/like-status", authenticate, getBlogLikeStatus);

// ============= BLOG LIKE INFORMATION =============

// GET /api/blogs/:blogId/likes - Get all likes for a blog with user details (Public)
router.get("/blogs/:blogId/likes", getBlogLikes);

// GET /api/blogs/:blogId/like-insights - Get quick insights about blog likes (Public)
router.get("/blogs/:blogId/like-insights", getBlogLikeInsights);

// GET /api/blogs/:blogId/analytics - Get detailed analytics for blog likes (Private - Author/Admin)
router.get(
  "/blogs/:blogId/analytics",
  authenticate,
  onlyAdmin,
  getBlogLikeAnalytics
);

// ============= USER LIKED BLOGS =============

// GET /api/users/:userId/liked-blogs - Get blogs liked by a user (Public with privacy check)
router.get("/users/:userId/liked-blogs", getUserLikedBlogs);

// GET /api/me/liked-blogs - Get current user's liked blogs (Private)
router.get("/me/liked-blogs", authenticate, getMyLikedBlogs);

// ============= USER STATISTICS =============

// GET /api/users/:userId/like-stats - Get user's like statistics (Public with privacy check)
router.get("/users/:userId/like-stats", getUserLikeStats);

// GET /api/me/like-stats - Get current user's like statistics (Private)
router.get("/me/like-stats", authenticate, getMyLikeStats);

// ============= DISCOVERY & TRENDING =============

// GET /api/blogs/trending - Get trending blogs based on recent likes (Public)
router.get("/blogs/trending", getTrendingBlogs);

// GET /api/blogs/most-liked - Get most liked blogs (Public)
router.get("/blogs/most-liked", getMostLikedBlogs);

// ============= ADMIN OPERATIONS =============

// DELETE /api/blogs/:blogId/likes/clear - Clear all likes for a blog (Admin only)
router.delete(
  "/blogs/:blogId/likes/clear",
  authenticate,
  onlyAdmin,
  clearBlogLikes
);

// POST /api/admin/likes/bulk-remove - Bulk remove likes (Admin only)
router.post(
  "/admin/likes/bulk-remove",
  authenticate,
  onlyAdmin,
  bulkRemoveLikes
);

export default router;
