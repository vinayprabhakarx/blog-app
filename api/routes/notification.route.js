import express from "express";
import authenticate from "../middleware/authenticate.js";
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearAllNotifications,
  getUnreadNotificationCount,
} from "../controllers/notification.controller.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

// @route   GET /api/notifications
// @desc    Get user's notifications with enhanced formatting and filtering
// @access  Private
router.get("/", asyncHandler(getUserNotifications));

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count for current user
// @access  Private
router.get("/unread-count", asyncHandler(getUnreadNotificationCount));

// @route   GET /api/notifications/summary
// @desc    Get notification summary for dashboard
// @access  Private
router.get(
  "/summary",
  asyncHandler(async (req, res, next) => {
    const { id: userId } = req.user;

    try {
      const { default: Notification } = await import(
        "../models/notification.model.js"
      );

      // Get counts by type
      const typeCounts = await Notification.aggregate([
        {
          $match: {
            user_id: userId,
            expires_at: { $gt: new Date() },
          },
        },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
            unreadCount: {
              $sum: { $cond: [{ $eq: ["$is_read", false] }, 1, 0] },
            },
          },
        },
      ]);

      // Get priority counts
      const priorityCounts = await Notification.aggregate([
        {
          $match: {
            user_id: userId,
            is_read: false,
            expires_at: { $gt: new Date() },
          },
        },
        {
          $group: {
            _id: "$priority",
            count: { $sum: 1 },
          },
        },
      ]);

      // Get recent activity (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const recentActivity = await Notification.countDocuments({
        user_id: userId,
        created_at: { $gte: yesterday },
        expires_at: { $gt: new Date() },
      });

      // Total unread count
      const totalUnread = await Notification.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        summary: {
          totalUnread,
          recentActivity,
          typeCounts: typeCounts.reduce((acc, item) => {
            acc[item._id] = {
              total: item.count,
              unread: item.unreadCount,
            };
            return acc;
          }, {}),
          priorityCounts: priorityCounts.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          hasUrgent: priorityCounts.some(
            (p) => p._id === "high" && p.count > 0
          ),
        },
      });
    } catch (error) {
      return next(error);
    }
  })
);

// @route   GET /api/notifications/by-type/:type
// @desc    Get notifications filtered by type
// @access  Private
router.get(
  "/by-type/:type",
  asyncHandler(async (req, res, next) => {
    const { type } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const { id: userId } = req.user;
    const skip = (page - 1) * limit;

    const validTypes = [
      "comment_reply",
      "comment_like",
      "comment_tag",
      "comment_report",
      "blog_comment",
      "blog_like",
      "report_resolved",
      "admin_notification",
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification type",
      });
    }

    try {
      const { default: Notification } = await import(
        "../models/notification.model.js"
      );

      const notifications = await Notification.find({
        user_id: userId,
        type: type,
        expires_at: { $gt: new Date() },
      })
        .populate({
          path: "blog_id",
          select: "title slug",
        })
        .populate({
          path: "comment_id",
          select: "content",
        })
        .populate({
          path: "triggered_by",
          select:
            "personal_info.username personal_info.name personal_info.profile_img",
        })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Notification.countDocuments({
        user_id: userId,
        type: type,
        expires_at: { $gt: new Date() },
      });

      res.status(200).json({
        success: true,
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
        type,
      });
    } catch (error) {
      return next(error);
    }
  })
);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read for the user
// @access  Private
router.put("/read-all", asyncHandler(markAllNotificationsRead));

// @route   PUT /api/notifications/read-by-type/:type
// @desc    Mark all notifications of a specific type as read
// @access  Private
router.put(
  "/read-by-type/:type",
  asyncHandler(async (req, res, next) => {
    const { type } = req.params;
    const { id: userId } = req.user;

    try {
      const { default: Notification } = await import(
        "../models/notification.model.js"
      );

      const result = await Notification.updateMany(
        {
          user_id: userId,
          type: type,
          is_read: false,
          expires_at: { $gt: new Date() },
        },
        {
          $set: {
            is_read: true,
            read_at: new Date(),
          },
        }
      );

      res.status(200).json({
        success: true,
        message: `All ${type} notifications marked as read`,
        markedCount: result.modifiedCount,
      });
    } catch (error) {
      return next(error);
    }
  })
);

// @route   PUT /api/notifications/:notificationId/read
// @desc    Mark a specific notification as read
// @access  Private
router.put("/:notificationId/read", asyncHandler(markNotificationRead));

// @route   PUT /api/notifications/:notificationId/unread
// @desc    Mark a specific notification as unread
// @access  Private
router.put(
  "/:notificationId/unread",
  asyncHandler(async (req, res, next) => {
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
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      await notification.markAsUnread();

      res.status(200).json({
        success: true,
        message: "Notification marked as unread",
        notification,
      });
    } catch (error) {
      return next(error);
    }
  })
);

// @route   DELETE /api/notifications/:notificationId
// @desc    Delete a specific notification
// @access  Private
router.delete(
  "/:notificationId",
  asyncHandler(async (req, res, next) => {
    const { notificationId } = req.params;
    const { id: userId } = req.user;

    try {
      const { default: Notification } = await import(
        "../models/notification.model.js"
      );

      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        user_id: userId,
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Notification deleted successfully",
      });
    } catch (error) {
      return next(error);
    }
  })
);

// @route   DELETE /api/notifications/by-type/:type
// @desc    Delete all notifications of a specific type
// @access  Private
router.delete(
  "/by-type/:type",
  asyncHandler(async (req, res, next) => {
    const { type } = req.params;
    const { id: userId } = req.user;

    try {
      const { default: Notification } = await import(
        "../models/notification.model.js"
      );

      const result = await Notification.deleteMany({
        user_id: userId,
        type: type,
      });

      res.status(200).json({
        success: true,
        message: `All ${type} notifications deleted successfully`,
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      return next(error);
    }
  })
);

// @route   DELETE /api/notifications/read
// @desc    Delete all read notifications
// @access  Private
router.delete(
  "/read",
  asyncHandler(async (req, res, next) => {
    const { id: userId } = req.user;

    try {
      const { default: Notification } = await import(
        "../models/notification.model.js"
      );

      const result = await Notification.deleteMany({
        user_id: userId,
        is_read: true,
      });

      res.status(200).json({
        success: true,
        message: "All read notifications deleted successfully",
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      return next(error);
    }
  })
);

// @route   DELETE /api/notifications
// @desc    Clear all notifications for current user
// @access  Private
router.delete("/", asyncHandler(clearAllNotifications));

// @route   GET /api/notifications/preferences
// @desc    Get user notification preferences
// @access  Private
router.get(
  "/preferences",
  asyncHandler(async (req, res, next) => {
    const { id: userId } = req.user;

    try {
      const { default: User } = await import("../models/user.model.js");

      const user = await User.findById(userId).select("preferences");

      const defaultPreferences = {
        emailNotifications: true,
        pushNotifications: true,
        notificationTypes: {
          comment_reply: true,
          comment_like: true,
          comment_tag: true,
          blog_comment: true,
          blog_like: true,
          report_resolved: true,
          admin_notification: true,
        },
        frequency: "immediate", // immediate, hourly, daily
        quietHours: {
          enabled: false,
          start: "22:00",
          end: "08:00",
        },
      };

      const preferences = {
        ...defaultPreferences,
        ...user?.preferences?.notifications,
      };

      res.status(200).json({
        success: true,
        preferences,
      });
    } catch (error) {
      return next(error);
    }
  })
);

// @route   PUT /api/notifications/preferences
// @desc    Update user notification preferences
// @access  Private
router.put(
  "/preferences",
  asyncHandler(async (req, res, next) => {
    const { id: userId } = req.user;
    const { preferences } = req.body;

    try {
      const { default: User } = await import("../models/user.model.js");

      await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            "preferences.notifications": preferences,
          },
        },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: "Notification preferences updated successfully",
        preferences,
      });
    } catch (error) {
      return next(error);
    }
  })
);

// @route   POST /api/notifications/mark-seen
// @desc    Mark notifications as seen (for real-time updates)
// @access  Private
router.post(
  "/mark-seen",
  asyncHandler(async (req, res, next) => {
    const { id: userId } = req.user;
    const { notificationIds } = req.body;

    try {
      const { default: Notification } = await import(
        "../models/notification.model.js"
      );

      if (notificationIds && Array.isArray(notificationIds)) {
        await Notification.updateMany(
          {
            _id: { $in: notificationIds },
            user_id: userId,
          },
          {
            $set: {
              seen_at: new Date(),
              is_read: true,
              read_at: new Date(),
            },
          }
        );
      } else {
        // Mark all unseen notifications as seen
        await Notification.updateMany(
          {
            user_id: userId,
            seen_at: { $exists: false },
            expires_at: { $gt: new Date() },
          },
          {
            $set: { seen_at: new Date() },
          }
        );
      }

      res.status(200).json({
        success: true,
        message: "Notifications marked as seen",
      });
    } catch (error) {
      return next(error);
    }
  })
);

export default router;
