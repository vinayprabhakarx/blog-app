import User from "../models/user.model.js";
import Blog from "../models/blog.model.js";
import Comment from "../models/comment.model.js";
import Category from "../models/category.model.js";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import {
  handleError,
  databaseError,
  notFoundError,
  forbiddenError,
  conflictError,
  authError,
  validationError,
} from "../utils/handleError.js";
import { uploadImage, deleteImage } from "../config/cloudinary.js";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";
import { buildVerifyNewEmail } from "../templates/email/verificationTemplates.js";

// Build verification link for email
const buildEmailVerificationLink = (token) => {
  const baseUrl =
    process.env.CLIENT_URL || process.env.APP_URL || "http://localhost:5173";
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

// @route   GET /api/users/public-profile/:username
// @desc    Get public user profile by username
// @access  Public
export const getPublicUserProfile = async (req, res, next) => {
  const { username } = req.params;
  if (!username) {
    return next(handleError(400, "Username is required"));
  }

  const user = await User.findOne({ "personal_info.username": username }).catch(
    (err) => {
      throw databaseError("finding user", err);
    }
  );

  if (!user) {
    return next(notFoundError("User"));
  }

  // Check if profile is public
  if (!user.personal_info.profile_is_public) {
    return next(forbiddenError("This user's profile is private."));
  }

  // Return user data with virtual fields and excluded sensitive information
  res.status(200).json({
    success: true,
    user: user.toJSON(),
  });
};

// @route   GET /api/users/:userid
// @desc    Get single user by ID (Admin only)
// @access  Private (Admin)
export const getUser = async (req, res, next) => {
  const { userid } = req.params;
  if (!userid) {
    return next(handleError(400, "User ID is required"));
  }

  const user = await User.findById(userid)
    .select("-personal_info.password") // Exclude password from response
    .catch((err) => {
      if (err.name === "CastError")
        throw handleError(400, "Invalid user ID format");
      throw databaseError("finding user", err);
    });

  if (!user) {
    return next(notFoundError("User"));
  }

  res.status(200).json({
    success: true,
    user,
  });
};

// @route   PUT /api/users/update/:userid
// @desc    Update user profile
// @access  Private
export const updateUser = async (req, res, next) => {
  const { userid } = req.params;
  const { name, username, bio, email, socialLinks, profile_is_public } =
    req.body;
  const { id: currentUserId, role: currentUserRole } = req.user;

  // Authorization check: users can only update their own profile, admins can update any
  if (currentUserId !== userid && currentUserRole !== "admin") {
    return next(forbiddenError("You can only update your own profile"));
  }

  const user = await User.findById(userid).catch((err) => {
    if (err.name === "CastError")
      throw handleError(400, "Invalid user ID format");
    throw databaseError("finding user to update", err);
  });

  if (!user) {
    return next(notFoundError("User"));
  }

  // Build update object with validated data
  const updateData = {};
  if (name && name.trim())
    updateData["personal_info.name"] = name.trim().toUpperCase();
  if (username && username.trim()) {
    // Username validation and uniqueness check
    if (username.trim().length < 3) {
      return next(
        handleError(400, "Username must be at least 3 characters long")
      );
    }
    if (username.trim().length > 20) {
      return next(handleError(400, "Username cannot exceed 20 characters"));
    }

    // Check if username is already taken by another user
    const existingUser = await User.findOne({
      "personal_info.username": username.trim().toLowerCase(),
      _id: { $ne: userid },
    }).catch((err) => {
      throw databaseError("checking username availability", err);
    });

    if (existingUser) {
      return next(conflictError("Username is already taken"));
    }

    updateData["personal_info.username"] = username.trim().toLowerCase();
  }
  if (bio !== undefined) updateData["personal_info.bio"] = bio.trim();
  if (profile_is_public !== undefined)
    updateData["personal_info.profile_is_public"] = profile_is_public;

  // Email validation and uniqueness check
  if (email && email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(handleError(400, "Invalid email format"));
    }
    const existingUser = await User.findOne({
      "personal_info.email": email.toLowerCase(),
      _id: { $ne: userid },
    }).catch((err) => {
      throw databaseError("checking email availability", err);
    });

    if (existingUser) {
      return next(conflictError("Email is already taken"));
    }
    updateData["personal_info.email"] = email.toLowerCase().trim();
  }

  // Update social media links with validation
  if (socialLinks) {
    let parsedSocialLinks;
    try {
      // If socialLinks is a string, parse it as JSON
      if (typeof socialLinks === "string") {
        parsedSocialLinks = JSON.parse(socialLinks);
      } else if (typeof socialLinks === "object") {
        parsedSocialLinks = socialLinks;
      }

      if (parsedSocialLinks && typeof parsedSocialLinks === "object") {
        const allowedLinks = [
          "youtube",
          "instagram",
          "facebook",
          "twitter",
          "github",
          "website",
          "linkedin",
        ];
        allowedLinks.forEach((link) => {
          if (parsedSocialLinks[link] !== undefined) {
            // Allow empty strings to clear the field, but trim non-empty values
            const value =
              parsedSocialLinks[link] === ""
                ? ""
                : parsedSocialLinks[link].trim();
            updateData[`social_links.${link}`] = value;
          }
        });
      }
    } catch (error) {
      console.error("Error parsing social links:", error);
      return next(handleError(400, "Invalid social links format"));
    }
  }

  // Handle profile image upload
  if (req.file) {
    try {
      const uploadResult = await uploadImage(req.file.path, {
        folder: "blog-app/avatars",
      });

      if (!uploadResult.success) {
        return next(
          handleError(500, "Image upload failed", uploadResult.error)
        );
      }

      updateData["personal_info.profile_img"] = uploadResult.url;

      // Clean up temporary file after successful upload
      const fs = await import("fs");
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    } catch (error) {
      console.error("Image upload error:", error);
      return next(handleError(500, "Image upload failed", error.message));
    }
  }

  // Detect if email changed
  const newEmail = updateData["personal_info.email"];
  const emailChanged = Boolean(
    newEmail && newEmail !== user.personal_info.email
  );

  // If email changed, mark unverified and prepare counters
  if (emailChanged) {
    updateData.emailVerified = false;
    updateData.verificationEmailSentCount =
      (user.verificationEmailSentCount || 0) + 1;
    updateData.lastVerificationEmailSentAt = new Date();
  }

  const updatedUser = await User.findByIdAndUpdate(
    userid,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .select("-personal_info.password")
    .catch((err) => {
      throw databaseError("updating user", err);
    });

  // If email changed for non-Google users, send verification email
  if (emailChanged && !(user.google_auth || user.authProvider === "google")) {
    // Only send verification email if user is not already verified
    if (!user.emailVerified) {
      try {
        const verifyToken = jwt.sign(
          { id: user._id, purpose: "verify_email" },
          process.env.JWT_SECRET,
          { expiresIn: "24h" }
        );
        const { linkForEmail } = buildEmailVerificationLink(verifyToken);
        const { subject, html, text } = buildVerifyNewEmail(
          updatedUser.personal_info?.name,
          linkForEmail
        );
        await sendEmail({
          to: updatedUser.personal_info.email,
          subject,
          html,
          text,
        });
      } catch (e) {
        return next(
          handleError(
            500,
            "Failed to send verification email for new address",
            e.message
          )
        );
      }
    }
  }

  res.status(200).json({
    success: true,
    message: emailChanged
      ? user.emailVerified
        ? "Profile updated. Your email has been changed successfully."
        : "Profile updated. We sent a verification link to your new email."
      : "Profile updated successfully",
    user: updatedUser,
    requireReauth: !!emailChanged,
  });
};

// @route   PUT /api/users/change-password
// @desc    Change user's password
// @access  Private
export const changePassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(validationError("Request body", errors.array()[0].msg));
  }

  const { oldPassword, newPassword } = req.body;
  const { id: userId } = req.user;

  const user = await User.findById(userId).catch((err) => {
    throw databaseError("finding user for password change", err);
  });

  if (!user) {
    return next(notFoundError("User"));
  }

  // Google auth users don't have passwords to change
  if (user.google_auth) {
    return next(
      forbiddenError(
        "Cannot change password for a Google-authenticated account."
      )
    );
  }

  const isMatch = await bcrypt.compare(
    oldPassword,
    user.personal_info.password
  );
  if (!isMatch) {
    return next(
      handleError(400, "Old password is incorrect. Please try again.")
    );
  }

  user.personal_info.password = newPassword;
  await user.save().catch((err) => {
    throw databaseError("saving new password", err);
  });

  res.json({ success: true, msg: "Password changed successfully" });
};

// @route   GET /api/users/all
// @desc    Get all users (Admin only)
// @access  Private (Admin)
export const getAllUser = async (req, res, next) => {
  const { page = 1, limit = 10, search = "", role = "" } = req.query;
  // Build search query with filters
  const query = {};
  if (search) {
    query.$or = [
      { "personal_info.name": { $regex: search, $options: "i" } },
      { "personal_info.email": { $regex: search, $options: "i" } },
      { "personal_info.username": { $regex: search, $options: "i" } },
    ];
  }
  if (role) query.role = role;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const users = await User.find(query)
    .select("-personal_info.password")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .catch((err) => {
      throw databaseError("fetching all users", err);
    });

  const totalUsers = await User.countDocuments(query).catch((err) => {
    throw databaseError("counting users", err);
  });

  const totalPages = Math.ceil(totalUsers / parseInt(limit));

  res.status(200).json({
    success: true,
    users,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalUsers,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1,
    },
  });
};

// @route   DELETE /api/users/:userid
// @desc    Delete user (Admin only)
// @access  Private (Admin)
export const deleteUser = async (req, res, next) => {
  const { userid } = req.params;
  const { id: currentUserId } = req.user;

  // Prevent self-deletion
  if (userid === currentUserId) {
    return next(handleError(400, "You cannot delete your own account"));
  }

  const user = await User.findById(userid).catch((err) => {
    if (err.name === "CastError")
      throw handleError(400, "Invalid user ID format");
    throw databaseError("finding user to delete", err);
  });

  if (!user) {
    return next(notFoundError("User"));
  }

  // Protect admin accounts from deletion
  if (user.role === "admin") {
    return next(forbiddenError("Cannot delete admin accounts"));
  }

  await User.findByIdAndDelete(userid).catch((err) => {
    throw databaseError("deleting user", err);
  });

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
};

// @route   GET /api/users/admin/stats
// @desc    Get admin statistics
// @access  Private (Admin)
export const getAdminStats = async (req, res, next) => {
  const totalUsers = await User.countDocuments().catch((err) => {
    throw databaseError("counting total users", err);
  });

  const totalBlogs = await Blog.countDocuments().catch((err) => {
    throw databaseError("counting total blogs", err);
  });

  const totalCategories = await Category.countDocuments().catch((err) => {
    throw databaseError("counting total categories", err);
  });

  const totalComments = await Comment.countDocuments().catch((err) => {
    throw databaseError("counting total comments", err);
  });

  const usersByRole = await User.aggregate([
    { $group: { _id: "$role", count: { $sum: 1 } } },
  ]).catch((err) => {
    throw databaseError("aggregating users by role", err);
  });

  // Calculate recent registrations (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentRegistrations = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  }).catch((err) => {
    throw databaseError("counting recent registrations", err);
  });

  // Get monthly registration trends (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const monthlyRegistrations = await User.aggregate([
    { $match: { createdAt: { $gte: twelveMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]).catch((err) => {
    throw databaseError("aggregating monthly registrations", err);
  });

  res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      totalBlogs,
      totalCategories,
      totalComments,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentRegistrations,
      monthlyRegistrations,
    },
  });
};

// @route   GET /api/users/admin/recent-activities
// @desc    Get recent user activities
// @access  Private (Admin)
export const getRecentActivities = async (req, res, next) => {
  const recentUsers = await User.find()
    .select("personal_info.name createdAt")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean()
    .catch((err) => {
      throw databaseError("fetching recent users", err);
    });
  const recentBlogs = await Blog.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("author", "personal_info.name")
    .select("title author createdAt")
    .lean()
    .catch((err) => {
      throw databaseError("fetching recent blogs", err);
    });
  const recentComments = await Comment.find()
    .sort({ commented_at: -1 })
    .limit(5)
    .populate("commented_by", "personal_info.name")
    .populate("blog_id", "title")
    .select("commented_by blog_id commented_at")
    .lean()
    .catch((err) => {
      throw databaseError("fetching recent comments", err);
    });

  const activities = [
    ...recentUsers
      .filter((user) => user && user.personal_info && user.personal_info.name)
      .map((user) => ({
        type: "user_registered",
        message: `New user registered: ${user.personal_info.name}`,
        createdAt: user.createdAt,
        color: "green",
      })),
    ...recentBlogs
      .filter(
        (blog) =>
          blog &&
          blog.author &&
          blog.author.personal_info &&
          blog.author.personal_info.name &&
          blog.title
      )
      .map((blog) => ({
        type: "blog_published",
        message: `New blog by ${blog.author.personal_info.name}: ${blog.title}`,
        createdAt: blog.createdAt,
        color: "blue",
      })),
    ...recentComments
      .filter(
        (comment) =>
          comment &&
          comment.commented_by &&
          comment.commented_by.personal_info &&
          comment.commented_by.personal_info.name
      )
      .map((comment) => ({
        type: "comment_added",
        message: `New comment by ${
          comment.commented_by.personal_info.name
        } on: ${comment.blog_id?.title || "a blog"}`,
        createdAt: comment.commented_at,
        color: "yellow",
      })),
  ];

  const sortedActivities = activities
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  res.status(200).json({
    success: true,
    activities: sortedActivities,
  });
};

// @route   GET /api/users/admin/monthly-performance
// @desc    Get monthly performance metrics for admin dashboard
// @access  Private (Admin)
export const getMonthlyPerformance = async (req, res, next) => {
  try {
    // Get current date and calculate 4 months ago
    const now = new Date();
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(now.getMonth() - 4);

    // Get monthly user registrations
    const monthlyRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: fourMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]).catch((err) => {
      throw databaseError("aggregating monthly registrations", err);
    });

    // Get monthly blog views (from blog activity)
    const monthlyBlogViews = await Blog.aggregate([
      { $match: { createdAt: { $gte: fourMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalViews: { $sum: { $ifNull: ["$activity.total_reads", 0] } },
          totalLikes: { $sum: { $ifNull: ["$likes", 0] } },
          blogCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]).catch((err) => {
      throw databaseError("aggregating monthly blog views", err);
    });

    // Get monthly comments
    const monthlyComments = await Comment.aggregate([
      { $match: { commented_at: { $gte: fourMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$commented_at" },
            month: { $month: "$commented_at" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]).catch((err) => {
      throw databaseError("aggregating monthly comments", err);
    });

    // Create month labels for the last 4 months
    const monthLabels = [];
    for (let i = 3; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      monthLabels.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        label: date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
      });
    }

    // Combine all data into monthly performance array
    const monthlyPerformance = monthLabels.map(({ year, month, label }) => {
      const registration = monthlyRegistrations.find(
        (item) => item._id.year === year && item._id.month === month
      );
      const blogData = monthlyBlogViews.find(
        (item) => item._id.year === year && item._id.month === month
      );
      const comments = monthlyComments.find(
        (item) => item._id.year === year && item._id.month === month
      );

      return {
        period: label,
        views: blogData?.totalViews || 0,
        users: registration?.count || 0,
        comments: comments?.count || 0,
        blogs: blogData?.blogCount || 0,
        likes: blogData?.totalLikes || 0,
      };
    });

    res.status(200).json({
      success: true,
      monthlyPerformance,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/users/me
// @desc    Get current user's own profile
// @access  Private
export const getCurrentUserProfile = async (req, res, next) => {
  const { id: userId } = req.user;

  const user = await User.findById(userId)
    .select("-personal_info.password")
    .catch((err) => {
      throw databaseError("finding current user profile", err);
    });

  if (!user) {
    return next(notFoundError("User"));
  }

  res.status(200).json({
    success: true,
    user,
  });
};

// @route   GET /api/users/author/stats
// @desc    Get author dashboard statistics
// @access  Private (Author/Admin)
export const getAuthorStats = async (req, res, next) => {
  const { id: authorId } = req.user;

  // Get total blogs by this author
  const totalMyBlogs = await Blog.countDocuments({ author: authorId }).catch(
    (err) => {
      throw databaseError("counting author blogs", err);
    }
  );

  // Get published vs draft blogs
  const publishedBlogs = await Blog.countDocuments({
    author: authorId,
    draft: false,
  }).catch((err) => {
    throw databaseError("counting published blogs", err);
  });

  const draftBlogs = await Blog.countDocuments({
    author: authorId,
    draft: true,
  }).catch((err) => {
    throw databaseError("counting draft blogs", err);
  });

  // Get total comments on author's blogs
  const authorBlogs = await Blog.find({ author: authorId })
    .select("_id")
    .catch((err) => {
      throw databaseError("finding author blogs for comments", err);
    });

  const blogIds = authorBlogs.map((blog) => blog._id);
  const totalCommentsOnMyBlogs = await Comment.countDocuments({
    blog_id: { $in: blogIds },
  }).catch((err) => {
    throw databaseError("counting comments on author blogs", err);
  });

  res.status(200).json({
    success: true,
    stats: {
      totalMyBlogs,
      publishedBlogs,
      draftBlogs,
      totalCommentsOnMyBlogs,
      totalViewsOnMyBlogs: 0, // Placeholder for future implementation
    },
  });
};

// @route   GET /api/users/author/recent-blogs
// @desc    Get recent blogs by the author
// @access  Private (Author/Admin)
export const getAuthorRecentBlogs = async (req, res, next) => {
  const { id: authorId } = req.user;

  const recentBlogs = await Blog.find({ author: authorId })
    .select("title createdAt draft")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean()
    .catch((err) => {
      throw databaseError("fetching recent author blogs", err);
    });

  res.status(200).json({
    success: true,
    blogs: recentBlogs,
  });
};

// @route   PUT /api/users/admin/change-role/:userId
// @desc    Change user role (Admin only)
// @access  Private (Admin)
export const changeUserRole = async (req, res, next) => {
  const { userId } = req.params;
  const { role } = req.body;
  const { id: adminId } = req.user;

  if (!role) {
    return next(handleError(400, "Role is required"));
  }

  if (!["user", "author"].includes(role)) {
    return next(
      handleError(
        400,
        "Invalid role. Allowed roles: user, author. Admin roles can only be assigned manually through database."
      )
    );
  }

  if (userId === adminId) {
    return next(handleError(400, "You cannot change your own role"));
  }

  const user = await User.findById(userId).catch((err) => {
    if (err.name === "CastError")
      throw handleError(400, "Invalid user ID format");
    throw databaseError("finding user to change role", err);
  });

  if (!user) {
    return next(notFoundError("User"));
  }

  try {
    const updatedUser = await User.changeUserRole(userId, role);

    res.status(200).json({
      success: true,
      message: `User role changed to ${role} successfully`,
      user: {
        id: updatedUser._id,
        name: updatedUser.personal_info.name,
        email: updatedUser.personal_info.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    return next(databaseError("changing user role", error));
  }
};

// @route   DELETE /api/users/remove-profile-image/:userid
// @desc    Remove user's profile image
// @access  Private
export const removeProfileImage = async (req, res, next) => {
  const { userid } = req.params;
  const { id: currentUserId, role: currentUserRole } = req.user;

  // Authorization check: users can only remove their own profile image, admins can remove any
  if (currentUserId !== userid && currentUserRole !== "admin") {
    return next(forbiddenError("You can only remove your own profile image"));
  }

  const user = await User.findById(userid).catch((err) => {
    if (err.name === "CastError")
      throw handleError(400, "Invalid user ID format");
    throw databaseError("finding user to remove profile image", err);
  });

  if (!user) {
    return next(notFoundError("User"));
  }

  // Check if user has a profile image
  if (!user.personal_info.profile_img) {
    return next(handleError(400, "No profile image to remove"));
  }

  try {
    // Extract public ID from Cloudinary URL for deletion
    const profileImgUrl = user.personal_info.profile_img;
    let publicId = null;

    // Extract public ID from Cloudinary URL
    if (profileImgUrl.includes("cloudinary.com")) {
      const urlParts = profileImgUrl.split("/");
      const uploadIndex = urlParts.findIndex((part) => part === "upload");
      if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
        const folderAndFile = urlParts.slice(uploadIndex + 2).join("/");
        publicId = folderAndFile.split(".")[0]; // Remove file extension
      }
    }

    // Delete image from Cloudinary if public ID was extracted
    if (publicId) {
      const deleteResult = await deleteImage(publicId);
      if (!deleteResult.success) {
        console.error(
          "Failed to delete image from Cloudinary:",
          deleteResult.error
        );
        // Continue with profile update even if Cloudinary deletion fails
      }
    }

    // Update user profile to remove profile image
    const updatedUser = await User.findByIdAndUpdate(
      userid,
      {
        $set: {
          "personal_info.profile_img": "",
          avatar: "", // Also clear the avatar field for consistency
        },
      },
      { new: true, runValidators: true }
    ).select("-personal_info.password");

    res.status(200).json({
      success: true,
      message: "Profile image removed successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error removing profile image:", error);
    return next(handleError(500, "Failed to remove profile image"));
  }
};
