import express from "express";
import { check } from "express-validator";
import {
  register,
  login,
  googleAuth,
  logout,
  getCurrentUser,
  changePassword,
  forgotPassword,
  resetPassword,
  validateResetToken,
  verifyEmail,
  verifyEmailLink,
  resendVerification,
  refreshToken,
  linkGoogleAuth,
} from "../controllers/auth.controller.js";
import asyncHandler from "../utils/asyncHandler.js"; // Assuming you have this utility
import upload from "../config/multer.js"; // Assuming a multer setup for file uploads
import authenticate from "../middleware/authenticate.js"; // Middleware for auth

const router = express.Router();

// --- Validation Rules ---
const registerValidation = [
  check("name", "Name is required and must be between 3 and 20 characters.")
    .not()
    .isEmpty()
    .isLength({ min: 3, max: 50 }),
  check("email", "Please include a valid email (max 50 characters).").isEmail().isLength({ max: 50 }),
  check(
    "username",
    "Username is required and must be between 3 and 20 characters."
  )
    .not()
    .isEmpty()
    .isLength({ min: 3, max: 20 }),
  check("password", "Password must be between 8 and 20 characters, contain at least one uppercase, one lowercase, one number and one special character.")
    .isLength({ min: 8, max: 20 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).*$/),
];

const loginValidation = [
  check("email", "Please include a valid email.").isEmail().isLength({ max: 50 }),
  check("password", "Password is required.").exists().isLength({ max: 20 }),
];

const changePasswordValidation = [
  check("currentPassword", "Current password is required.").not().isEmpty().isLength({ max: 20 }),
  check(
    "newPassword",
    "New password must be between 8 and 20 characters, contain at least one uppercase, one lowercase, one number and one special character."
  ).isLength({ min: 8, max: 20 })
   .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).*$/),
];

const resetPasswordValidation = [
  check("token", "Reset token is required.").not().isEmpty(),
  check(
    "newPassword",
    "New password must be between 8 and 20 characters, contain at least one uppercase, one lowercase, one number and one special character."
  ).isLength({ min: 8, max: 20 })
   .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).*$/),
];

const forgotPasswordValidation = [
  check("email", "Please include a valid email.").isEmail().isLength({ max: 50 }),
];

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  "/register",
  upload.single("profileImage"), // Middleware to handle single file upload with field name 'profileImage'
  registerValidation,
  asyncHandler(register)
);

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post("/login", loginValidation, asyncHandler(login));

// @route   POST /api/auth/google
// @desc    Authenticate user with Google
// @access  Public
router.post("/google", asyncHandler(googleAuth));

// @route   POST /api/auth/link-google
// @desc    Link Google Auth to existing logged-in user
// @access  Private
router.post("/link-google", authenticate, asyncHandler(linkGoogleAuth));

// @route   POST /api/auth/logout
// @desc    Logout user and clear cookie
// @access  Public
router.post("/logout", asyncHandler(logout));

// @route   POST /api/auth/refresh
// @desc    Refresh JWT access token using HTTP-only cookie
// @access  Public
router.post("/refresh", asyncHandler(refreshToken));

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get("/me", authenticate, asyncHandler(getCurrentUser));

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put(
  "/change-password",
  authenticate,
  changePasswordValidation,
  asyncHandler(changePassword)
);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset token
// @access  Public
router.post("/forgot-password", forgotPasswordValidation, asyncHandler(forgotPassword));

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post("/reset-password", resetPasswordValidation, asyncHandler(resetPassword));

// @route   GET /api/auth/validate-reset-token/:token
// @desc    Validate reset token
// @access  Public
router.get("/validate-reset-token/:token", asyncHandler(validateResetToken));

// @route   POST /api/auth/verify-email
// @desc    Verify email with token
// @access  Public
router.post("/verify-email", asyncHandler(verifyEmail));

// @route   GET /api/auth/verify-email
// @desc    Verify email via link token (redirects to client)
// @access  Public
router.get("/verify-email", asyncHandler(verifyEmailLink));

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post("/resend-verification", asyncHandler(resendVerification));

export default router;
