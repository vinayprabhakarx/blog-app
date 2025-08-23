import { databaseError, notFoundError } from "../utils/handleError.js";

// Configuration for notification types
const NOTIFICATION_CONFIG = {
  types: {
    BLOG_COMMENT: "blog_comment",
    COMMENT_REPLY: "comment_reply",
    USER_TAG: "user_tag",
    BLOG_LIKE: "blog_like",
    COMMENT_LIKE: "comment_like",
    COMMENT_REPORT: "comment_report",
    COMMENT_DELETED: "comment_deleted",
    REPORT_RESOLVED: "report_resolved",
    ADMIN_NOTIFICATION: "admin_notification",
  },
};

// Helper function to create notifications
export const createNotification = async (notificationData) => {
  try {
    const { default: Notification } = await import(
      "../models/notification.model.js"
    );
    const notification = new Notification(notificationData);
    return await notification.save();
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

// Helper function to format blog title
const formatBlogTitle = (title, maxLength = 50) => {
  if (!title) return "a post";
  return title.length <= maxLength
    ? `"${title}"`
    : `"${title.substring(0, maxLength)}..."`;
};

// Helper function to get admin users
const getFirstAdmin = async (excludeUserId) => {
  try {
    const { default: User } = await import("../models/user.model.js");
    const admin = await User.findOne({
      role: "admin",
      _id: { $ne: excludeUserId },
    }).select("_id");
    return admin;
  } catch (error) {
    return null;
  }
};

// Create notification for blog comment
export const createBlogCommentNotification = async (
  blogAuthorId,
  commenterUsername,
  blogTitle,
  blogId,
  commentId,
  triggeredByUserId
) => {
  const formattedTitle = formatBlogTitle(blogTitle);
  return await createNotification({
    user_id: blogAuthorId,
    type: NOTIFICATION_CONFIG.types.BLOG_COMMENT,
    title: "New comment on your post",
    message: `${commenterUsername} commented on ${formattedTitle}`,
    blog_id: blogId,
    comment_id: commentId,
    triggered_by: triggeredByUserId,
    metadata: {
      action: "blog_comment",
      commenter: commenterUsername,
      blog_title: blogTitle,
    },
  });
};

// Create notification for comment reply
export const createCommentReplyNotification = async (
  parentCommentAuthorId,
  replierUsername,
  blogTitle,
  blogId,
  commentId,
  triggeredByUserId
) => {
  const formattedTitle = formatBlogTitle(blogTitle);
  return await createNotification({
    user_id: parentCommentAuthorId,
    type: NOTIFICATION_CONFIG.types.COMMENT_REPLY,
    title: "New reply to your comment",
    message: `${replierUsername} replied to your comment on ${formattedTitle}`,
    blog_id: blogId,
    comment_id: commentId,
    triggered_by: triggeredByUserId,
    metadata: {
      action: "comment_reply",
      replier: replierUsername,
      blog_title: blogTitle,
    },
  });
};

// Create notification for user tag
export const createUserTagNotification = async (
  taggedUserId,
  taggerUsername,
  blogTitle,
  blogId,
  commentId,
  triggeredByUserId
) => {
  const formattedTitle = formatBlogTitle(blogTitle);
  return await createNotification({
    user_id: taggedUserId,
    type: NOTIFICATION_CONFIG.types.USER_TAG,
    title: "You were mentioned",
    message: `${taggerUsername} mentioned you in a comment on ${formattedTitle}`,
    blog_id: blogId,
    comment_id: commentId,
    triggered_by: triggeredByUserId,
    metadata: {
      action: "user_tagged",
      tagger: taggerUsername,
      blog_title: blogTitle,
    },
  });
};

// Create notification for blog like
export const createBlogLikeNotification = async (
  blogAuthorId,
  likerUsername,
  blogTitle,
  blogId,
  triggeredByUserId
) => {
  const formattedTitle = formatBlogTitle(blogTitle);
  return await createNotification({
    user_id: blogAuthorId,
    type: NOTIFICATION_CONFIG.types.BLOG_LIKE,
    title: "Someone liked your post",
    message: `${likerUsername} liked ${formattedTitle}`,
    blog_id: blogId,
    triggered_by: triggeredByUserId,
    metadata: {
      action: "blog_liked",
      liker: likerUsername,
      blog_title: blogTitle,
    },
  });
};

// Create notification for comment like
export const createCommentLikeNotification = async (
  commentAuthorId,
  likerUsername,
  blogTitle,
  blogId,
  commentId,
  triggeredByUserId
) => {
  const formattedTitle = formatBlogTitle(blogTitle);
  return await createNotification({
    user_id: commentAuthorId,
    type: NOTIFICATION_CONFIG.types.COMMENT_LIKE,
    title: "Someone liked your comment",
    message: `${likerUsername} liked your comment on ${formattedTitle}`,
    blog_id: blogId,
    comment_id: commentId,
    triggered_by: triggeredByUserId,
    metadata: {
      action: "comment_liked",
      liker: likerUsername,
      blog_title: blogTitle,
    },
  });
};

// Create notification for comment report
export const createCommentReportNotification = async (
  commentAuthorId,
  blogTitle,
  blogId,
  commentId,
  triggeredByUserId,
  reason
) => {
  const formattedTitle = formatBlogTitle(blogTitle);
  return await createNotification({
    user_id: commentAuthorId,
    type: NOTIFICATION_CONFIG.types.COMMENT_REPORT,
    title: "Comment under review",
    message: `Your comment on ${formattedTitle} is being reviewed`,
    blog_id: blogId,
    comment_id: commentId,
    triggered_by: triggeredByUserId,
    metadata: {
      reason: reason?.trim() || "No reason provided",
      action: "comment_reported",
      blog_title: blogTitle,
    },
  });
};

// Create notification for comment deletion
export const createCommentDeletionNotification = async (
  commentAuthorId,
  blogTitle,
  blogId,
  commentId,
  triggeredByUserId,
  userRole
) => {
  const formattedTitle = formatBlogTitle(blogTitle);
  const isAdmin = userRole === "admin";

  return await createNotification({
    user_id: commentAuthorId,
    type: NOTIFICATION_CONFIG.types.COMMENT_DELETED,
    title: "Comment removed",
    message: `Your comment on ${formattedTitle} was removed by ${
      isAdmin ? "an admin" : "the author"
    }`,
    blog_id: blogId,
    comment_id: commentId,
    triggered_by: triggeredByUserId,
    metadata: {
      action: "comment_deleted",
      deleter_role: userRole,
      blog_title: blogTitle,
    },
  });
};

// Create notification for report resolution
export const createReportResolvedNotification = async (
  reporterId,
  blogTitle,
  commentId,
  triggeredByUserId
) => {
  const formattedTitle = formatBlogTitle(blogTitle);
  return await createNotification({
    user_id: reporterId,
    type: NOTIFICATION_CONFIG.types.REPORT_RESOLVED,
    title: "Report resolved",
    message: `The comment you reported on ${formattedTitle} has been removed`,
    comment_id: commentId,
    triggered_by: triggeredByUserId,
    metadata: {
      action: "report_resolved",
      blog_title: blogTitle,
    },
  });
};

// Simplified admin notification creator
const createAdminNotification = async (
  title,
  message,
  metadata,
  blogId,
  commentId,
  triggeredByUserId
) => {
  const admin = await getFirstAdmin(triggeredByUserId);
  if (!admin) return [];

  const notification = await createNotification({
    user_id: admin._id,
    type: NOTIFICATION_CONFIG.types.ADMIN_NOTIFICATION,
    title,
    message,
    blog_id: blogId,
    comment_id: commentId,
    triggered_by: triggeredByUserId,
    metadata,
  });

  return notification ? [notification] : [];
};

// Admin notification for reported comments only
export const createAdminReportNotification = async (
  reporterUsername,
  commentAuthorUsername,
  blogTitle,
  blogId,
  commentId,
  triggeredByUserId,
  reason
) => {
  const formattedTitle = formatBlogTitle(blogTitle);
  return await createAdminNotification(
    "Comment reported",
    `Comment by ${commentAuthorUsername} on ${formattedTitle} was reported`,
    {
      action: "comment_reported",
      reporter: reporterUsername,
      comment_author: commentAuthorUsername,
      blog_title: blogTitle,
      reason: reason,
    },
    blogId,
    commentId,
    triggeredByUserId
  );
};

// Helper function to check if user is admin and create regular notifications
export const createAdminUserNotifications = async (
  adminId,
  type,
  title,
  message,
  blogId,
  commentId,
  triggeredByUserId,
  metadata
) => {
  // Check if the admin user exists and is actually an admin
  try {
    const { default: User } = await import("../models/user.model.js");
    const admin = await User.findOne({ _id: adminId, role: "admin" });

    if (!admin || adminId.toString() === triggeredByUserId?.toString()) {
      return null;
    }

    return await createNotification({
      user_id: adminId,
      type: type,
      title: title,
      message: message,
      blog_id: blogId,
      comment_id: commentId,
      triggered_by: triggeredByUserId,
      metadata: metadata,
    });
  } catch (error) {
    return null;
  }
};

// Placeholder functions to prevent import errors (these won't create notifications)
export const createAdminCommentNotification = async () => [];
export const createAdminReplyNotification = async () => [];
export const createAdminBlogLikeNotification = async () => [];
export const createAdminCommentLikeNotification = async () => [];

// API Controllers
export const getUserNotifications = async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;
  const { id: userId } = req.user;

  try {
    const { default: Notification } = await import(
      "../models/notification.model.js"
    );

    const notifications = await Notification.find({
      user_id: userId,
      expires_at: { $gt: new Date() },
    })
      .populate("blog_id", "title slug")
      .populate("comment_id", "content")
      .populate(
        "triggered_by",
        "personal_info.username personal_info.profile_img"
      )
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const enhancedNotifications = notifications.map((notification) => ({
      ...notification,
      timeAgo: getTimeAgo(notification.created_at),
      isRecent: isWithinLast24Hours(notification.created_at),
      actionUrl: generateActionUrl(notification),
    }));

    const totalNotifications = await Notification.countDocuments({
      user_id: userId,
      expires_at: { $gt: new Date() },
    });

    const unreadCount = await Notification.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      notifications: enhancedNotifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalNotifications / limit),
        total: totalNotifications,
        hasNextPage: page < Math.ceil(totalNotifications / limit),
        hasPrevPage: page > 1,
      },
      unreadCount,
      summary: {
        hasUnread: unreadCount > 0,
        recentCount: enhancedNotifications.filter((n) => n.isRecent).length,
      },
    });
  } catch (error) {
    return next(databaseError("fetching notifications", error));
  }
};

export const getUnreadNotificationCount = async (req, res, next) => {
  const { id: userId } = req.user;

  try {
    const { default: Notification } = await import(
      "../models/notification.model.js"
    );
    const unreadCount = await Notification.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      unreadCount,
      hasUnread: unreadCount > 0,
      displayText: unreadCount > 99 ? "99+" : unreadCount.toString(),
    });
  } catch (error) {
    return next(databaseError("fetching unread count", error));
  }
};

export const markNotificationRead = async (req, res, next) => {
  const { notificationId } = req.params;
  const { id: userId } = req.user;

  try {
    const { default: Notification } = await import(
      "../models/notification.model.js"
    );
    const notification = await Notification.findOne({
      _id: notificationId,
      user_id: userId,
    });

    if (!notification) {
      return next(notFoundError("Notification"));
    }

    await notification.markAsRead();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    return next(databaseError("marking notification as read", error));
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  const { id: userId } = req.user;

  try {
    const { default: Notification } = await import(
      "../models/notification.model.js"
    );
    const result = await Notification.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      markedCount: result.modifiedCount,
    });
  } catch (error) {
    return next(databaseError("marking all notifications as read", error));
  }
};

export const clearAllNotifications = async (req, res, next) => {
  const { id: userId } = req.user;

  try {
    const { default: Notification } = await import(
      "../models/notification.model.js"
    );
    const result = await Notification.deleteMany({ user_id: userId });

    res.status(200).json({
      success: true,
      message: "All notifications cleared",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return next(databaseError("clearing notifications", error));
  }
};

// Helper functions
const getTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 604800)}w ago`;
};

const isWithinLast24Hours = (date) => {
  const diffInHours = (new Date() - new Date(date)) / (1000 * 60 * 60);
  return diffInHours <= 24;
};

const generateActionUrl = (notification) => {
  const blogSlug = notification.blog_id?.slug;
  if (!blogSlug) return null;

  const urlMap = {
    blog_comment: `/blog/${blogSlug}`,
    blog_like: `/blog/${blogSlug}`,
    comment_reply: `/blog/${blogSlug}#comment-${notification.comment_id}`,
    comment_like: `/blog/${blogSlug}#comment-${notification.comment_id}`,
    user_tag: `/blog/${blogSlug}#comment-${notification.comment_id}`,
  };

  return urlMap[notification.type] || `/blog/${blogSlug}`;
};
