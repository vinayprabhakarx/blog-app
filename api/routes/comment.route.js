import express from "express";
import { check, query, param } from "express-validator";
import User from "../models/user.model.js";
import { databaseError } from "../utils/handleError.js";
import {
  getComment,
  updateComment,
  deleteComment,
  getUserComments,
  getCommentReplies,
  reportComment,
  getAllCommentsForAdmin,
  getReportedComments,
  getAllCommentsForAuthor,
  getReportedCommentsForAuthor,
  forceDeleteComment,
  toggleCommentLike,
  getAdminOwnBlogComments,
  dismissReport,
  getCommentStats,
  updateCommentStatus,
} from "../controllers/comment.controller.js";
import authenticate from "../middleware/authenticate.js";
import onlyAdmin from "../middleware/onlyAdmin.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

// --- Validation Rules ---
const commentValidation = [
  check(
    "content",
    "Comment content cannot be empty and must be between 1-1000 characters."
  )
    .trim()
    .notEmpty()
    .isLength({ min: 1, max: 1000 }),
  check("parent", "Parent comment ID must be a valid MongoDB ObjectId.")
    .optional()
    .isMongoId(),
];

const updateCommentValidation = [
  check(
    "content",
    "Comment content cannot be empty and must be between 1-1000 characters."
  )
    .trim()
    .notEmpty()
    .isLength({ min: 1, max: 1000 }),
];

const commentIdValidation = [
  param(
    "commentId",
    "Comment ID must be a valid MongoDB ObjectId."
  ).isMongoId(),
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

const sortValidation = [
  query("sort", "Sort must be 'newest' or 'oldest'")
    .optional()
    .isIn(["newest", "oldest"]),
];

// --- Public Routes ---

// @route   GET /api/comments/:commentId
// @desc    Get a single comment by ID
// @access  Public
router.get("/:commentId", commentIdValidation, asyncHandler(getComment));

// @route   GET /api/comments/:commentId/replies
// @desc    Get direct replies to a comment (paginated)
// @access  Public
router.get(
  "/:commentId/replies",
  [commentIdValidation, paginationValidation],
  asyncHandler(getCommentReplies)
);

// --- Private Routes ---

// @route   PUT /api/comments/:commentId
// @desc    Update a comment (ownership checked in controller)
// @access  Private
router.put(
  "/:commentId",
  [authenticate, commentIdValidation, updateCommentValidation],
  asyncHandler(updateComment)
);

// @route   DELETE /api/comments/:commentId
// @desc    Delete a comment and all its replies (ownership checked in controller)
// @access  Private
router.delete(
  "/:commentId",
  [authenticate, commentIdValidation],
  asyncHandler(deleteComment)
);

// @route   POST /api/comments/:commentId/report
// @desc    Report a comment for inappropriate content
// @access  Private
router.post(
  "/:commentId/report",
  [
    authenticate,
    commentIdValidation,
    check(
      "reason",
      "Report reason is required and must be between 10-500 characters."
    )
      .trim()
      .notEmpty()
      .isLength({ min: 10, max: 500 }),
  ],
  asyncHandler(reportComment)
);

// @route   POST /api/comments/:commentId/like
// @desc    Toggle like for a comment
// @access  Private
router.post(
  "/:commentId/like",
  [authenticate, commentIdValidation],
  asyncHandler(toggleCommentLike)
);

// @route   GET /api/comments/user/my-comments
// @desc    Get current user's comments with pagination
// @access  Private
router.get(
  "/user/my-comments",
  [authenticate, paginationValidation],
  asyncHandler(getUserComments)
);

// --- Admin-Only Routes ---

// @route   GET /api/comments/admin/all
// @desc    Get all comments across all blogs (for admin management)
// @access  Private (Admin)
router.get(
  "/admin/all",
  [authenticate, onlyAdmin, paginationValidation],
  asyncHandler(getAllCommentsForAdmin)
);

// @route   GET /api/comments/admin/reported
// @desc    Get all reported comments for admin review
// @access  Private (Admin)
router.get(
  "/admin/reported",
  [authenticate, onlyAdmin, paginationValidation],
  asyncHandler(getReportedComments)
);

// @route   DELETE /api/comments/admin/:commentId/force-delete
// @desc    Force delete any comment (admin override)
// @access  Private (Admin)
router.delete(
  "/admin/:commentId/force-delete",
  [authenticate, onlyAdmin, commentIdValidation],
  asyncHandler(forceDeleteComment)
);

// @route   PUT /api/comments/:commentId/dismiss-report
// @desc    Dismiss reports on a comment (for authors/admins)
// @access  Private (Author/Admin)
router.put(
  "/:commentId/dismiss-report",
  [authenticate, commentIdValidation],
  asyncHandler(dismissReport)
);

// --- Author Routes ---

// @route   GET /api/comments/author/all
// @desc    Get all comments across blogs owned by the author
// @access  Private (Author/Admin)
router.get(
  "/author/all",
  [authenticate, paginationValidation],
  asyncHandler(getAllCommentsForAuthor)
);

// @route   GET /api/comments/author/reported
// @desc    Get reported comments across author's blogs
// @access  Private (Author/Admin)
router.get(
  "/author/reported",
  [authenticate, paginationValidation],
  asyncHandler(getReportedCommentsForAuthor)
);

// @route   GET /api/comments/admin/my-blogs
// @desc    Get all comments across admin's own blogs (separate from admin/all)
// @access  Private (Admin)
router.get(
  "/admin/my-blogs",
  [authenticate, onlyAdmin, paginationValidation],
  asyncHandler(getAdminOwnBlogComments)
);

// @route   GET /api/comments/admin/stats
// @desc    Get overall comment statistics
// @access  Private (Admin)
router.get(
  "/admin/stats",
  [authenticate, onlyAdmin],
  asyncHandler(getCommentStats)
);

// @route   GET /api/comments/search-users/:query
// @desc    Search users by username for tagging functionality
// @access  Private
router.get(
  "/search-users/:query",
  [
    authenticate,
    param("query", "Search query must be at least 1 character.")
      .trim()
      .isLength({ min: 1, max: 50 }),
  ],
  asyncHandler(async (req, res, next) => {
    const { query } = req.params;

    const users = await User.find({
      "personal_info.username": { $regex: query, $options: "i" },
    })
      .select(
        "personal_info.username personal_info.name personal_info.profile_img"
      )
      .limit(10)
      .catch((err) => {
        throw databaseError("searching users", err);
      });

    res.status(200).json({
      success: true,
      users,
    });
  })
);

// @route   PUT /api/comments/:commentId/status
// @desc    Update comment status (approve/reject) - for admins and authors
// @access  Private (Admin/Author)
router.put(
  "/:commentId/status",
  [
    authenticate,
    commentIdValidation,
    check("status", "Status must be 'approved', 'rejected', or 'pending'").isIn(
      ["approved", "rejected", "pending"]
    ),
  ],
  asyncHandler(updateCommentStatus)
);

export default router;
