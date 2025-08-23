import mongoose from "mongoose";
import Blog from "../models/blog.model.js";
import BlogLike from "../models/blogLike.model.js";
import User from "../models/user.model.js";
import {
  databaseError,
  notFoundError,
  validationError,
  forbiddenError,
} from "../utils/handleError.js";
import {
  createBlogLikeNotification,
  createAdminBlogLikeNotification,
} from "./notification.controller.js";

// @route   POST/DELETE /api/blogs/:blogId/like
// @desc    Toggle like/unlike a blog
// @access  Private
export const toggleBlogLike = async (req, res, next) => {
  const { blogId } = req.params;
  const { id: userId, personal_info } = req.user;

  // Handle both POST and DELETE requests
  const body = req.body || {};
  const {
    source = "web",
    is_public = true,
    utm_source,
    utm_medium,
    utm_campaign,
    referrer,
  } = body;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    return next(validationError("Invalid blog ID format"));
  }

  try {
    // Check if blog exists and get blog details
    const blog = await Blog.findById(blogId)
      .select("title author activity.total_likes draft")
      .populate({
        path: "author",
        select: "personal_info.name personal_info.username role",
      });

    if (!blog) {
      return next(notFoundError("Blog"));
    }

    // Check if blog is draft
    if (blog.draft) {
      return next(validationError("Cannot like draft blogs"));
    }

    // Check if user is trying to like their own blog
    if (blog.author._id.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot like your own blog",
      });
    }

    // Prepare metadata for analytics
    const metadata = {
      user_agent: req.headers["user-agent"],
      ip_address: req.ip || req.connection.remoteAddress,
      device_type: req.headers["x-device-type"] || "unknown",
      browser: req.headers["x-browser"] || "unknown",
      os: req.headers["x-os"] || "unknown",
      country: req.headers["x-country"] || null,
      city: req.headers["x-city"] || null,
    };

    const interactionContext = {
      referrer,
      utm_source,
      utm_medium,
      utm_campaign,
    };

    // Toggle like using the model method
    const result = await BlogLike.toggleLike(userId, blogId, {
      metadata,
      source,
      interactionContext,
      isPublic: is_public,
    });

    const { action, like } = result;

    // Calculate real-time like count instead of manually updating
    const totalLikes = await BlogLike.countDocuments({ blog_id: blogId });

    // Create notifications only for likes (not unlikes)
    if (action === "liked") {
      const likerUsername =
        personal_info?.username || personal_info?.name || "Unknown User";

      // 1. Notify blog author
      if (blog.author._id.toString() !== userId.toString()) {
        await createBlogLikeNotification(
          blog.author._id,
          likerUsername,
          blog.title,
          blogId,
          userId
        );
      }

      // 2. Notify admins (if the liker is not an admin)
      if (req.user.role !== "admin") {
        await createAdminBlogLikeNotification(
          likerUsername,
          blog.title,
          blogId,
          userId
        );
      }
    }



    res.status(200).json({
      success: true,
      message:
        action === "liked"
          ? "Blog liked successfully! ❤️"
          : "Blog unliked successfully",
      data: {
        action,
        blog_id: blogId,
        user_id: userId,
        total_likes: totalLikes,
        liked_at: like?.liked_at || null,
      },
    });
  } catch (error) {
    // Handle duplicate key error (shouldn't happen with our logic, but just in case)
    if (error.code === 11000) {
      return next(validationError("You have already liked this blog"));
    }
    return next(databaseError(`processing like action`, error));
  }
};

// @route   GET /api/blogs/:blogId/like-status
// @desc    Check if current user has liked a blog
// @access  Private
export const getBlogLikeStatus = async (req, res, next) => {
  const { blogId } = req.params;
  const { id: userId } = req.user;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    return next(validationError("Invalid blog ID format"));
  }

  try {
    // Check if blog exists
    const blog = await Blog.findById(blogId).select("_id title draft");
    if (!blog) {
      return next(notFoundError("Blog"));
    }

    if (blog.draft) {
      return next(validationError("Cannot access draft blog like status"));
    }

    // Check if user has liked the blog
    const hasLiked = await BlogLike.hasUserLiked(userId, blogId);

    res.status(200).json({
      success: true,
      data: {
        blog_id: blogId,
        user_id: userId,
        has_liked: hasLiked,
        blog_title: blog.title,
      },
    });
  } catch (error) {
    return next(databaseError("checking blog like status", error));
  }
};

// @route   GET /api/blogs/trending
// @desc    Get trending blogs based on likes
// @access  Public
export const getTrendingBlogs = async (req, res, next) => {
  const { timeframe = "7d", limit = 10, min_likes = 5 } = req.query;

  try {
    const trendingData = await BlogLike.getTrendingBlogs({
      timeframe,
      limit: parseInt(limit),
      minLikes: parseInt(min_likes),
    });

    res.status(200).json({
      success: true,
      data: trendingData,
    });
  } catch (error) {
    return next(databaseError("fetching trending blogs", error));
  }
};

// @route   GET /api/blogs/:blogId/analytics
// @desc    Get detailed analytics for a blog's likes (Author/Admin only)
// @access  Private
export const getBlogLikeAnalytics = async (req, res, next) => {
  const { blogId } = req.params;
  const { timeframe = "30d", include_geographic = false } = req.query;
  const { id: userId, role } = req.user;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    return next(validationError("Invalid blog ID format"));
  }

  try {
    // Check if blog exists and verify ownership
    const blog = await Blog.findById(blogId)
      .select("title author draft")
      .populate("author", "personal_info.username");

    if (!blog) {
      return next(notFoundError("Blog"));
    }

    // Check if user can access analytics (author or admin)
    if (blog.author._id.toString() !== userId.toString() && role !== "admin") {
      return next(
        forbiddenError("You can only view analytics for your own blogs")
      );
    }

    if (blog.draft && role !== "admin") {
      return next(validationError("Cannot view analytics for draft blogs"));
    }

    // Get analytics data
    const analytics = await BlogLike.getBlogLikeAnalytics(blogId, {
      timeframe,
      includeGeographic: include_geographic === "true",
    });

    res.status(200).json({
      success: true,
      data: {
        blog_id: blogId,
        blog_title: blog.title,
        author: blog.author.personal_info.username,
        ...analytics,
      },
    });
  } catch (error) {
    return next(databaseError("fetching blog analytics", error));
  }
};

// @route   GET /api/users/:userId/like-stats
// @desc    Get user's like statistics
// @access  Public (with privacy check)
export const getUserLikeStats = async (req, res, next) => {
  const { userId } = req.params;
  const { timeframe = "30d" } = req.query;
  const currentUserId = req.user?.id;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return next(validationError("Invalid user ID format"));
  }

  try {
    // Check if user exists and privacy settings
    const user = await User.findById(userId).select(
      "personal_info.name personal_info.username preferences.profileVisibility"
    );

    if (!user) {
      return next(notFoundError("User"));
    }

    // Check privacy settings
    if (
      user.preferences?.profileVisibility === "private" &&
      currentUserId !== userId
    ) {
      return next(forbiddenError("This user's statistics are private"));
    }

    // Get user's like statistics
    const stats = await BlogLike.getUserLikeStats(userId, { timeframe });

    res.status(200).json({
      success: true,
      data: {
        user_id: userId,
        user_name: user.personal_info?.name,
        username: user.personal_info?.username,
        ...stats,
      },
    });
  } catch (error) {
    return next(databaseError("fetching user statistics", error));
  }
};

// @route   GET /api/me/like-stats
// @desc    Get current user's like statistics
// @access  Private
export const getMyLikeStats = async (req, res, next) => {
  const { id: userId } = req.user;
  const { timeframe = "30d" } = req.query;

  try {
    // Get user's like statistics
    const stats = await BlogLike.getUserLikeStats(userId, { timeframe });

    res.status(200).json({
      success: true,
      data: {
        user_id: userId,
        ...stats,
      },
    });
  } catch (error) {
    return next(databaseError("fetching your statistics", error));
  }
};

// @route   GET /api/blogs/most-liked
// @desc    Get most liked blogs of all time or by timeframe
// @access  Public
export const getMostLikedBlogs = async (req, res, next) => {
  const { page = 1, limit = 10, timeframe = "all" } = req.query;
  const skip = (page - 1) * limit;

  try {
    let matchStage = {};

    // Add time filter if specified
    if (timeframe !== "all") {
      const now = new Date();
      let startDate;

      switch (timeframe) {
        case "today":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        matchStage.liked_at = { $gte: startDate };
      }
    }

    // Aggregate to get most liked blogs
    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: "$blog_id",
          like_count: { $sum: 1 },
          latest_like: { $max: "$liked_at" },
          unique_users: { $addToSet: "$user_id" },
        },
      },
      { $sort: { like_count: -1, latest_like: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: "blogs",
          localField: "_id",
          foreignField: "_id",
          as: "blog",
        },
      },
      { $unwind: "$blog" },
      {
        $match: {
          "blog.draft": { $ne: true },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "blog.author",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      {
        $project: {
          _id: 1,
          like_count: 1,
          latest_like: 1,
          unique_users: { $size: "$unique_users" },
          blog: {
            _id: 1,
            title: 1,
            slug: 1,
            banner: 1,
            excerpt: 1,
            createdAt: 1,
            "activity.total_likes": 1,
            "activity.total_comments": 1,
            "activity.total_reads": 1,
          },
          author: {
            _id: 1,
            "personal_info.name": 1,
            "personal_info.username": 1,
            "personal_info.profile_img": 1,
          },
        },
      },
    ];

    const results = await BlogLike.aggregate(pipeline);

    // Get total count for pagination
    const totalPipeline = [
      { $match: matchStage },
      { $group: { _id: "$blog_id" } },
      { $count: "total" },
    ];
    const totalResult = await BlogLike.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        blogs: results,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
        timeframe,
      },
    });
  } catch (error) {
    return next(databaseError("fetching most liked blogs", error));
  }
};

// @route   DELETE /api/blogs/:blogId/likes/clear
// @desc    Clear all likes for a blog (Admin only)
// @access  Private (Admin)
export const clearBlogLikes = async (req, res, next) => {
  const { blogId } = req.params;
  const { role } = req.user;

  // Check if user is admin
  if (role !== "admin") {
    return next(forbiddenError("Only admins can clear blog likes"));
  }

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    return next(validationError("Invalid blog ID format"));
  }

  try {
    // Check if blog exists
    const blog = await Blog.findById(blogId).select("_id title");
    if (!blog) {
      return next(notFoundError("Blog"));
    }

    // Delete all likes for the blog
    const deleteResult = await BlogLike.deleteMany({ blog_id: blogId });



    res.status(200).json({
      success: true,
      message: `All likes cleared for blog: ${blog.title}`,
      data: {
        blog_id: blogId,
        cleared_likes: deleteResult.deletedCount,
      },
    });
  } catch (error) {
    return next(databaseError("clearing blog likes", error));
  }
};

// @route   POST /api/admin/likes/bulk-remove
// @desc    Bulk remove likes (Admin only)
// @access  Private (Admin)
export const bulkRemoveLikes = async (req, res, next) => {
  const { role } = req.user;
  const { user_ids = [], blog_ids = [], action } = req.body;

  // Check if user is admin
  if (role !== "admin") {
    return next(forbiddenError("Only admins can perform bulk operations"));
  }

  if (!action || !["remove_user_likes", "remove_blog_likes"].includes(action)) {
    return next(
      validationError(
        "Invalid action. Use 'remove_user_likes' or 'remove_blog_likes'"
      )
    );
  }

  try {
    let result;

    switch (action) {
      case "remove_user_likes":
        if (!user_ids.length) {
          return next(
            validationError(
              "User IDs are required for remove_user_likes action"
            )
          );
        }
        result = await BlogLike.removeUserLikes(user_ids);
        break;

      case "remove_blog_likes":
        if (!blog_ids.length) {
          return next(
            validationError(
              "Blog IDs are required for remove_blog_likes action"
            )
          );
        }
        result = await BlogLike.removeBlogLikes(blog_ids);
        break;

      default:
        return next(validationError("Invalid action"));
    }

    res.status(200).json({
      success: true,
      message: `Bulk operation '${action}' completed successfully`,
      data: result,
    });
  } catch (error) {
    return next(databaseError("performing bulk like removal", error));
  }
};

// @route   GET /api/blogs/:blogId/like-insights
// @desc    Get quick insights about blog likes
// @access  Public
export const getBlogLikeInsights = async (req, res, next) => {
  const { blogId } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    return next(validationError("Invalid blog ID format"));
  }

  try {
    // Check if blog exists
    const blog = await Blog.findById(blogId).select(
      "_id title activity.total_likes createdAt draft"
    );
    if (!blog) {
      return next(notFoundError("Blog"));
    }

    if (blog.draft) {
      return next(validationError("Cannot access draft blog insights"));
    }

    // Get basic insights
    const totalLikes = await BlogLike.getLikeCount(blogId);

    // Get recent activity (last 7 days)
    const recentActivity = await BlogLike.aggregate([
      {
        $match: {
          blog_id: new mongoose.Types.ObjectId(blogId),
          liked_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$liked_at" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Calculate like rate (likes per day since publication)
    const daysSinceCreation = Math.max(
      1,
      Math.ceil((new Date() - blog.createdAt) / (1000 * 60 * 60 * 24))
    );
    const likeRate = (totalLikes / daysSinceCreation).toFixed(2);

    res.status(200).json({
      success: true,
      data: {
        blog_id: blogId,
        blog_title: blog.title,
        total_likes: totalLikes,
        like_rate_per_day: parseFloat(likeRate),
        recent_activity: recentActivity,
        days_since_creation: daysSinceCreation,
        blog_created: blog.createdAt,
      },
    });
  } catch (error) {
    return next(databaseError("fetching blog insights", error));
  }
};

// @route   GET /api/blogs/:blogId/likes
// @desc    Get all likes for a blog with user details
// @access  Public
export const getBlogLikes = async (req, res, next) => {
  const { blogId } = req.params;
  const {
    page = 1,
    limit = 20,
    sort_by = "liked_at",
    sort_order = "desc",
    include_metadata = false,
  } = req.query;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    return next(validationError("Invalid blog ID format"));
  }

  try {
    // Check if blog exists
    const blog = await Blog.findById(blogId).select("_id title draft");
    if (!blog) {
      return next(notFoundError("Blog"));
    }

    if (blog.draft) {
      return next(validationError("Cannot access draft blog likes"));
    }

    // Get likes with options
    const result = await BlogLike.getBlogLikes(blogId, {
      page,
      limit,
      publicOnly: true,
      sortBy: sort_by,
      sortOrder: sort_order === "desc" ? -1 : 1,
      includeMetadata: include_metadata === "true",
    });

    res.status(200).json({
      success: true,
      data: {
        blog_id: blogId,
        blog_title: blog.title,
        ...result,
      },
    });
  } catch (error) {
    return next(databaseError("fetching blog likes", error));
  }
};

// @route   GET /api/users/:userId/liked-blogs
// @desc    Get all blogs liked by a user
// @access  Public (with privacy check)
export const getUserLikedBlogs = async (req, res, next) => {
  const { userId } = req.params;
  const {
    page = 1,
    limit = 20,
    sort_by = "liked_at",
    sort_order = "desc",
  } = req.query;
  const currentUserId = req.user?.id;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return next(validationError("Invalid user ID format"));
  }

  try {
    // Check if user exists and get privacy settings
    const user = await User.findById(userId).select(
      "personal_info.name personal_info.username preferences.profileVisibility"
    );
    if (!user) {
      return next(notFoundError("User"));
    }

    // Check privacy settings (if user profile is private and not the same user)
    if (
      user.preferences?.profileVisibility === "private" &&
      currentUserId !== userId
    ) {
      return next(forbiddenError("This user's liked blogs are private"));
    }

    // Get user's liked blogs
    const result = await BlogLike.getUserLikedBlogs(userId, {
      page,
      limit,
      sortBy: sort_by,
      sortOrder: sort_order === "desc" ? -1 : 1,
    });

    res.status(200).json({
      success: true,
      data: {
        user_id: userId,
        user_name: user.personal_info?.name,
        username: user.personal_info?.username,
        ...result,
      },
    });
  } catch (error) {
    return next(databaseError("fetching user liked blogs", error));
  }
};

// @route   GET /api/me/liked-blogs
// @desc    Get current user's liked blogs
// @access  Private
export const getMyLikedBlogs = async (req, res, next) => {
  const { id: userId } = req.user;
  const {
    page = 1,
    limit = 20,
    sort_by = "liked_at",
    sort_order = "desc",
  } = req.query;

  try {
    // Get user's liked blogs (including private likes)
    const result = await BlogLike.getUserLikedBlogs(userId, {
      page,
      limit,
      includePrivate: true,
      sortBy: sort_by,
      sortOrder: sort_order === "desc" ? -1 : 1,
    });

    res.status(200).json({
      success: true,
      data: {
        user_id: userId,
        ...result,
      },
    });
  } catch (error) {
    return next(databaseError("fetching your liked blogs", error));
  }
};
