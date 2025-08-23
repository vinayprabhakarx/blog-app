import express from "express";
import { check, query } from "express-validator";
import {
  getAllBlogs,
  getBlogBySlug,
  getBlogById,
  getBlogsByAuthor,
  getAuthorBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogsByAuthorForAdmin,
  recalculateAllCommentCounts,
} from "../controllers/blog.controller.js";
import {
  createComment,
  getBlogComments,
} from "../controllers/comment.controller.js";
import authenticate from "../middleware/authenticate.js";
import onlyAdmin from "../middleware/onlyAdmin.js";
import authorize from "../middleware/authorize.js";
import asyncHandler from "../utils/asyncHandler.js";
import upload from "../config/multer.js";

const router = express.Router();

// --- Validation Rules ---
const blogValidation = [
  check("title", "Title is required and must be between 10 and 200 characters.")
    .not()
    .isEmpty()
    .isLength({ min: 5, max: 200 }),
  check(
    "content",
    "Content is required and must be at least 200 characters long."
  )
    .not()
    .isEmpty()
    .isLength({ min: 200 }),
  check("category", "Category is required.").not().isEmpty(),
  check("excerpt", "Excerpt must be less than 300 characters.")
    .optional()
    .isLength({ max: 300 }),
  check("tags", "Tags must be a comma-separated string.").optional().isString(),
  check("draft", "Draft status must be a boolean.").optional().isBoolean(),
];

const paginationValidation = [
  query("page", "Page must be a positive integer.")
    .optional()
    .isInt({ min: 1 })
    .toInt(),
  query("limit", "Limit must be between 1 and 50.")
    .optional()
    .isInt({ min: 1, max: 50 })
    .toInt(),
];

// --- Public Routes ---

// @route   GET /api/blogs OR /api/categories/:categoryId/blogs
// @desc    Get all published blogs (optionally filtered by category)
// @access  Public
router.get("/", asyncHandler(getAllBlogs));

// @route   GET /api/blogs/my-blogs
// @desc    Get blogs for the logged-in author
// @access  Private (Author, Admin)
router.get(
  "/my-blogs",
  authenticate,
  authorize("admin", "author"),
  asyncHandler(getAuthorBlogs)
);

// @route   GET /api/blogs/author/:username
// @desc    Get all published blogs by an author's username
// @access  Public
router.get("/author/:username", asyncHandler(getBlogsByAuthor));

// --- Admin-Only Routes (must come before /:slug) ---

// @route   GET /api/blogs/admin/author/:username
// @desc    Get all blogs by a specific author (admin view)
// @access  Private (Admin)
router.get(
  "/admin/author/:username",
  [authenticate, onlyAdmin, paginationValidation],
  asyncHandler(getBlogsByAuthorForAdmin)
);

// @route   GET /api/blogs/admin/recalculate-comment-counts
// @desc    Recalculate all blog comment counts (admin only)
// @access  Private (Admin)
router.get(
  "/admin/recalculate-comment-counts",
  [authenticate, onlyAdmin],
  asyncHandler(recalculateAllCommentCounts)
);

// @route   GET /api/blogs/edit/:id
// @desc    Get a single blog by ID for editing
// @access  Private (Author, Admin)
router.get(
  "/edit/:id",
  authenticate,
  authorize("admin", "author"),
  asyncHandler(getBlogById)
);

// @route   GET /api/blogs/:slug
// @desc    Get a single blog by slug (must be last among GET routes)
// @access  Public
router.get("/:slug", asyncHandler(getBlogBySlug));

// --- Private Routes (Author & Admin) ---

// @route   POST /api/blogs
// @desc    Create a new blog post
// @access  Private (Author, Admin)
router.post(
  "/",
  authenticate,
  authorize("admin", "author"),
  upload.single("banner"),
  blogValidation,
  asyncHandler(createBlog)
);

// @route   PUT /api/blogs/:id
// @desc    Update a blog post (ownership is checked in the controller)
// @access  Private (Author, Admin)
router.put(
  "/:id",
  authenticate,
  authorize("admin", "author"),
  upload.single("banner"),
  blogValidation,
  asyncHandler(updateBlog)
);

// @route   DELETE /api/blogs/:id
// @desc    Delete a blog post (ownership is checked in the controller)
// @access  Private (Author, Admin)
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "author"),
  asyncHandler(deleteBlog)
);

// --- Comment Routes ---

// @route   GET /api/blogs/:blogId/comments
// @desc    Get all comments for a specific blog (with nested structure)
// @access  Public
router.get("/:blogId/comments", asyncHandler(getBlogComments));

// @route   POST /api/blogs/:blogId/comments
// @desc    Create a new comment or reply
// @access  Private
router.post("/:blogId/comments", authenticate, asyncHandler(createComment));

export default router;
