import User from "../models/user.model.js";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { promisify } from "util";
import sendEmail from "../utils/sendEmail.js";
import { buildVerifyRegistrationEmail } from "../templates/email/verificationTemplates.js";
import {
  validationError,
  authError,
  conflictError,
  serverError,
  databaseError,
} from "../utils/handleError.js";

// Promisify the jwt.sign function to use it with async/await
const signJwt = promisify(jwt.sign);

// Enhanced helper function to generate and send a JWT response with cookies
const sendTokenResponse = async (
  res,
  user,
  statusCode,
  message = "Success"
) => {
  const payload = {
    id: user._id,
    name: user.personal_info?.name,
    email: user.personal_info?.email,
    username: user.personal_info?.username,
    avatar: user.personal_info?.profile_img || "",
    role: user.role,
  };

  try {
    const token = await signJwt(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    });

    // Set HTTP-only cookie
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Prepare safe user object
    const safeUser = user.toObject({ getters: true });
    if (safeUser.personal_info) {
      delete safeUser.personal_info.password;
    }
    delete safeUser.loginAttempts;
    delete safeUser.lockUntil;
    delete safeUser.bypassRoleValidation;

    res.status(statusCode).json({
      success: true,
      user: safeUser,
      token,
      message,
    });
  } catch (error) {
    throw serverError("Failed to sign the token", error);
  }
};

// Generate unique username from email
const generateUniqueUsername = async (email) => {
  let username = email.split("@")[0];
  const isUsernameExists = await User.exists({
    "personal_info.username": username,
  });

  if (isUsernameExists) {
    username = `${username}_${nanoid(5)}`;
  }
  return username;
};

// Build verification link for email
const buildEmailVerificationLink = (token) => {
  const baseUrl =
    process.env.CLIENT_URL || process.env.APP_URL || "http://localhost:5173";
  // Link goes to backend GET endpoint for one-click verification, then can redirect to client
  const apiBase =
    process.env.API_URL || process.env.SERVER_URL || "http://localhost:3000";
  return {
    linkForEmail: `${apiBase}/api/auth/verify-email?token=${encodeURIComponent(
      token
    )}`,
    clientTokenLink: `${baseUrl}/verify-email?token=${encodeURIComponent(
      token
    )}`,
  };
};

// @route   POST /api/auth/register
// @desc    Register a new user with email and password
// @access  Public
export const register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(validationError("Request body", errors.array()[0].msg));
  }

  const { name, email, password, username } = req.body;

  const existingUser = await User.findOne({
    $or: [
      { "personal_info.email": email },
      { "personal_info.username": username },
    ],
  }).catch((err) => {
    throw databaseError("finding user", err);
  });

  if (existingUser) {
    return next(
      conflictError("A user with this email or username already exists.")
    );
  }

  const userObject = {
    personal_info: { name, email, password, username },
  };
  const user = new User(userObject);

  await user.save().catch((err) => {
    throw databaseError("creating user", err);
  });

  // Generate email verification token (24h validity)
  const verifyToken = jwt.sign(
    { id: user._id, purpose: "verify_email" },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  // Track verification email send count
  user.verificationEmailSentCount = (user.verificationEmailSentCount || 0) + 1;
  user.lastVerificationEmailSentAt = new Date();
  await user.save();

  // Send verification email (fail if send fails)
  try {
    const { linkForEmail } = buildEmailVerificationLink(verifyToken);
    const { subject, html, text } = buildVerifyRegistrationEmail(
      user.personal_info?.name,
      linkForEmail
    );
    await sendEmail({ to: user.personal_info.email, subject, html, text });
  } catch (e) {
    return next(serverError("Failed to send verification email", e));
  }

  // For development, return token to facilitate testing
  res.status(201).json({
    success: true,
    message:
      "Registration successful. Please verify your email to activate your account.",
    ...(process.env.NODE_ENV === "development" && { verifyToken }),
  });
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
export const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(validationError("Request body", errors.array()[0].msg));
  }

  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return next(authError("Email and password are required"));
  }

  const user = await User.findOne({
    "personal_info.email": email.toLowerCase(),
  }).catch((err) => {
    throw databaseError("finding user", err);
  });

  if (!user) {
    return next(authError("Invalid login credentials."));
  }

  // Check if account is locked
  if (user.isLocked && user.isLocked()) {
    return next(
      authError(
        "Account temporarily locked due to multiple failed login attempts. Please try again later."
      )
    );
  }

  if (user.google_auth || user.authProvider === "google") {
    return next(
      authError(
        "This account was registered with Google. Please sign in with Google."
      )
    );
  }

  // Block login if email not verified for local accounts
  if (!user.emailVerified) {
    return next(
      authError(
        "Email not verified. Please check your inbox for the verification link."
      )
    );
  }

  const isMatch = await bcrypt.compare(password, user.personal_info.password);
  if (!isMatch) {
    // Increment login attempts on failed login
    if (user.incLoginAttempts) {
      await user.incLoginAttempts();
    }
    return next(authError("Invalid login credentials."));
  }

  // Reset login attempts on successful login
  if (user.resetLoginAttempts) {
    await user.resetLoginAttempts();
  }

  await sendTokenResponse(res, user, 200, "Login successful.");
};

// @route   POST /api/auth/verify-email
// @desc    Verify email with token
// @access  Public
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return next(authError("Verification token is required"));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return next(authError("Invalid or expired verification token"));
    }

    if (decoded.purpose !== "verify_email" || !decoded.id) {
      return next(authError("Invalid verification token"));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(authError("User not found"));
    }

    if (user.emailVerified) {
      return res
        .status(200)
        .json({ success: true, message: "Email already verified" });
    }

    user.emailVerified = true;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    next(serverError("Failed to verify email", error));
  }
};

// @route   GET /api/auth/verify-email
// @desc    Verify email via link click (query token) then redirect
// @access  Public
export const verifyEmailLink = async (req, res, next) => {
  try {
    const { token } = req.query;
    const clientBase = process.env.CLIENT_URL || "http://localhost:5173";
    if (!token) {
      return res.redirect(302, `${clientBase}/verify-email?status=invalid`);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      const isExpired = e?.name === "TokenExpiredError";
      const status = isExpired ? "expired" : "invalid";
      return res.redirect(302, `${clientBase}/verify-email?status=${status}`);
    }

    if (decoded.purpose !== "verify_email" || !decoded.id) {
      return res.redirect(302, `${clientBase}/verify-email?status=invalid`);
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.redirect(302, `${clientBase}/verify-email?status=invalid`);
    }

    if (user.emailVerified) {
      return res.redirect(302, `${clientBase}/verify-email?status=already`);
    }

    user.emailVerified = true;
    await user.save();

    return res.redirect(302, `${clientBase}/verify-email?status=success`);
  } catch (error) {
    next(serverError("Failed to verify email via link", error));
  }
};

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification link
// @access  Public
export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(authError("Email is required"));
    }

    const user = await User.findOne({
      "personal_info.email": email.toLowerCase(),
    });
    if (!user) {
      // Do not reveal whether the email exists
      return res.status(200).json({
        success: true,
        message: "If this email exists, a verification link has been sent",
      });
    }

    if (user.google_auth || user.authProvider === "google") {
      return res.status(200).json({
        success: true,
        message:
          "This account uses Google Sign-In and does not require verification",
      });
    }

    if (user.emailVerified) {
      return res
        .status(200)
        .json({ success: true, message: "Email is already verified" });
    }

    // Enforce resend limit: max 5
    const sentCount = user.verificationEmailSentCount || 0;
    if (sentCount >= 5) {
      return res.status(429).json({
        success: false,
        message:
          "Verification email resend limit reached. Please try again later.",
      });
    }

    const verifyToken = jwt.sign(
      { id: user._id, purpose: "verify_email" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    user.verificationEmailSentCount = sentCount + 1;
    user.lastVerificationEmailSentAt = new Date();
    await user.save();

    // Send verification email (fail if send fails)
    try {
      const { linkForEmail } = buildEmailVerificationLink(verifyToken);
      const { subject, html, text } = buildVerifyRegistrationEmail(
        user.personal_info?.name,
        linkForEmail
      );
      await sendEmail({ to: user.personal_info.email, subject, html, text });
    } catch (e) {
      return next(serverError("Failed to send verification email", e));
    }

    return res.status(200).json({
      success: true,
      message: "Verification email sent",
      ...(process.env.NODE_ENV === "development" && { verifyToken }),
    });
  } catch (error) {
    next(serverError("Failed to resend verification email", error));
  }
};

// @route   POST /api/auth/google
// @desc    Handle Google OAuth sign-in
// @access  Public
export const googleAuth = async (req, res, next) => {
  const { name, email, profile_img } = req.body;

  // Input validation
  if (!name || !email) {
    return next(authError("Name and email are required for Google login"));
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(authError("Invalid email format"));
  }

  let user = await User.findOne({
    "personal_info.email": email.toLowerCase(),
  }).catch((err) => {
    throw databaseError("finding user", err);
  });

  if (user) {
    if (!user.google_auth && user.authProvider !== "google") {
      return next(
        conflictError(
          "This email was registered with a password. Please log in with your password."
        )
      );
    }

    // Update existing user's avatar if provided and user logged in via Google
    if (
      profile_img &&
      (!user.personal_info.profile_img || user.authProvider === "google")
    ) {
      user.personal_info.profile_img = profile_img;
      await user.save();
    }
  } else {
    const username = await generateUniqueUsername(email);

    // Generate a random password for Google users (they won't use it)
    const randomPassword = Math.random().toString(36).slice(-8);

    const userObject = {
      personal_info: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        username,
        profile_img: profile_img || "",
        password: randomPassword,
      },
      google_auth: true,
      authProvider: "google",
      emailVerified: true, // Google accounts are pre-verified
    };
    user = new User(userObject);
    await user.save().catch((err) => {
      throw databaseError("creating user", err);
    });
  }

  await sendTokenResponse(res, user, 200, "Google login successful.");
};

// @route   POST /api/auth/logout
// @desc    Logout user and clear cookie
// @access  Public
export const logout = async (req, res, next) => {
  try {
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "strict",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    next(serverError("Logout failed", error));
  }
};

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
export const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-personal_info.password");

    if (!user) {
      return next(authError("User not found"));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(serverError("Failed to get user info", error));
  }
};

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Input validation
    if (!currentPassword || !newPassword) {
      return next(authError("Current password and new password are required"));
    }

    if (newPassword.length < 8) {
      return next(authError("New password must be at least 8 characters long"));
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return next(authError("User not found"));
    }

    // Check if user registered via Google
    if (user.authProvider === "google" || user.google_auth) {
      return next(
        authError("Cannot change password for Google authenticated accounts")
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.personal_info.password
    );
    if (!isCurrentPasswordValid) {
      return next(authError("Current password is incorrect"));
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.personal_info.password
    );
    if (isSamePassword) {
      return next(
        authError("New password must be different from current password")
      );
    }

    // Update password (will be hashed by pre-save hook)
    user.personal_info.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(serverError("Failed to change password", error));
  }
};

// @route   POST /api/auth/forgot-password
// @desc    Send password reset token
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(authError("Email is required"));
    }

    const user = await User.findOne({
      "personal_info.email": email.toLowerCase(),
    });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If this email exists, you will receive a password reset link",
      });
    }

    // Check if user registered via Google
    if (user.authProvider === "google" || user.google_auth) {
      return res.status(200).json({
        success: true,
        message: "Please use Google Sign-In for your account",
      });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { id: user._id, purpose: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      success: true,
      message: "If this email exists, you will receive a password reset link",
      ...(process.env.NODE_ENV === "development" && { resetToken }),
    });
  } catch (error) {
    next(serverError("Failed to process forgot password request", error));
  }
};
