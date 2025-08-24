import express from "express";
import { check } from "express-validator";
import {
  getPublicUserProfile,
  getUser,
  updateUser,
  changePassword,
  getAllUser,
  deleteUser,
  getAdminStats,
  getRecentActivities,
  getMonthlyPerformance,
  getCurrentUserProfile,
  changeUserRole,
  getAuthorStats,
  getAuthorRecentBlogs,
  removeProfileImage,
} from "../controllers/user.controller.js";
import authenticate from "../middleware/authenticate.js";
import onlyAdmin from "../middleware/onlyAdmin.js";
import onlyAuthor from "../middleware/onlyAuthor.js";
import asyncHandler from "../utils/asyncHandler.js";
import upload, { handleMulterError } from "../config/multer.js";

const router = express.Router();

// --- Validation Rules ---
const updateProfileValidation = [
  check("name", "Name must be at least 3 characters long.")
    .optional()
    .isString()
    .isLength({ min: 3 }),
  check("username", "Username must be at least 3 characters long.")
    .optional()
    .isString()
    .isLength({ min: 3, max: 20 }),
  check("email", "Please include a valid email.").optional().isEmail(),
  check("bio", "Bio must be less than 200 characters.")
    .optional()
    .isString()
    .isLength({ max: 200 }),
  check("profile_is_public", "Profile visibility must be a boolean.")
    .optional()
    .isBoolean(),
  check("socialLinks.youtube", "YouTube username must be a string.")
    .optional({ checkFalsy: true })
    .isString(),
  check("socialLinks.instagram", "Instagram username must be a string.")
    .optional({ checkFalsy: true })
    .isString(),
  check("socialLinks.facebook", "Facebook username must be a string.")
    .optional({ checkFalsy: true })
    .isString(),
  check("socialLinks.twitter", "Twitter username must be a string.")
    .optional({ checkFalsy: true })
    .isString(),
  check("socialLinks.github", "GitHub username must be a string.")
    .optional({ checkFalsy: true })
    .isString(),
  check("socialLinks.linkedin", "LinkedIn username must be a string.")
    .optional({ checkFalsy: true })
    .isString(),
  check("socialLinks.website", "Website must be a valid URL.")
    .optional({ checkFalsy: true })
    .isURL(),
];

const changePasswordValidation = [
  check("oldPassword", "Old password is required.").not().isEmpty(),
  check(
    "newPassword",
    "New password must be at least 6 characters long."
  ).isLength({ min: 6 }),
];

// --- Public Routes ---

// @route   GET /api/users/public-profile/:username
// @desc    Get a user's public profile
// @access  Public
router.get("/public-profile/:username", asyncHandler(getPublicUserProfile));

// --- Private Routes (All Authenticated Users) ---

// @route   GET /api/users/me
// @desc    Get current user's profile
// @access  Private
router.get("/me", authenticate, asyncHandler(getCurrentUserProfile));

// @route   PUT /api/users/update/:userid
// @desc    Update a user's profile (own or by admin)
// @access  Private
router.put(
  "/update/:userid",
  authenticate,
  upload.single("profileImage"),
  handleMulterError,
  updateProfileValidation,
  asyncHandler(updateUser)
);

// @route   DELETE /api/users/remove-profile-image/:userid
// @desc    Remove user's profile image
// @access  Private
router.delete(
  "/remove-profile-image/:userid",
  authenticate,
  asyncHandler(removeProfileImage)
);

// @route   PUT /api/users/change-password
// @desc    Change the current user's password
// @access  Private
router.put(
  "/change-password",
  authenticate,
  changePasswordValidation,
  asyncHandler(changePassword)
);

// --- Author-Only Routes ---

// @route   GET /api/users/author/stats
// @desc    Get dashboard statistics for authors
// @access  Private (Author/Admin)
router.get(
  "/author/stats",
  authenticate,
  onlyAuthor,
  asyncHandler(getAuthorStats)
);

// @route   GET /api/users/author/recent-blogs
// @desc    Get recent blogs for the author
// @access  Private (Author/Admin)
router.get(
  "/author/recent-blogs",
  authenticate,
  onlyAuthor,
  asyncHandler(getAuthorRecentBlogs)
);

// --- Admin-Only Routes ---

// @route   GET /api/users/all
// @desc    Get all users with pagination and search
// @access  Private (Admin)
router.get("/all", authenticate, onlyAdmin, asyncHandler(getAllUser));

// @route   GET /api/users/admin/stats
// @desc    Get dashboard statistics for the admin panel
// @access  Private (Admin)
router.get(
  "/admin/stats",
  authenticate,
  onlyAdmin,
  asyncHandler(getAdminStats)
);

// @route   GET /api/users/admin/recent-activities
// @desc    Get recent activities for the admin panel
// @access  Private (Admin)
router.get(
  "/admin/recent-activities",
  authenticate,
  onlyAdmin,
  asyncHandler(getRecentActivities)
);

// @route   GET /api/users/admin/monthly-performance
// @desc    Get monthly performance metrics for admin dashboard
// @access  Private (Admin)
router.get(
  "/admin/monthly-performance",
  authenticate,
  onlyAdmin,
  asyncHandler(getMonthlyPerformance)
);

// @route   GET /api/users/:userid
// @desc    Get a single user's full details by ID
// @access  Private (Admin)
router.get("/:userid", authenticate, onlyAdmin, asyncHandler(getUser));

// @route   DELETE /api/users/:userid
// @desc    Delete a user by ID
// @access  Private (Admin)
router.delete("/:userid", authenticate, onlyAdmin, asyncHandler(deleteUser));

// @route   PUT /api/users/admin/change-role/:userId
// @desc    Change user role
// @access  Private (Admin)
router.put(
  "/admin/change-role/:userId",
  authenticate,
  onlyAdmin,
  asyncHandler(changeUserRole)
);

export default router;
