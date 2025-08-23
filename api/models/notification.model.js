import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "comment_reply",
        "comment_like",
        "comment_tag",
        "comment_report",
        "blog_comment",
        "blog_like",
        "report_resolved",
        "admin_notification",
      ],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    // Related entities
    blog_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      index: true,
    },
    comment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      index: true,
    },
    // User who triggered the notification
    triggered_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    // Additional data for the notification
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Read status
    is_read: {
      type: Boolean,
      default: false,
      index: true,
    },
    read_at: {
      type: Date,
      default: null,
    },
    // Priority level
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },
    // Expiration for auto-cleanup
    expires_at: {
      type: Date,
      default: function () {
        // Default expiration: 30 days from creation
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      },
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Indexes for performance
notificationSchema.index({ user_id: 1, is_read: 1, created_at: -1 });
notificationSchema.index({ user_id: 1, type: 1, created_at: -1 });
notificationSchema.index({ created_at: 1 });

// Virtual for checking if notification is expired
notificationSchema.virtual("is_expired").get(function () {
  return this.expires_at < new Date();
});

// Instance method to mark notification as read
notificationSchema.methods.markAsRead = async function () {
  this.is_read = true;
  this.read_at = new Date();
  return await this.save();
};

// Instance method to mark notification as unread
notificationSchema.methods.markAsUnread = async function () {
  this.is_read = false;
  this.read_at = undefined;
  return await this.save();
};

// Static method to create a notification with automatic expiration
notificationSchema.statics.createNotification = async function (
  notificationData
) {
  try {
    // Set expiration to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const notification = new this({
      ...notificationData,
      expires_at: expiresAt,
    });

    const savedNotification = await notification.save();
    return savedNotification;
  } catch (error) {
    throw error;
  }
};

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = async function (userId) {
  try {
    const count = await this.countDocuments({
      user_id: userId,
      is_read: false,
      expires_at: { $gt: new Date() },
    });
    return count;
  } catch (error) {
    throw error;
  }
};

// Static method to mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = async function (userId) {
  try {
    const result = await this.updateMany(
      {
        user_id: userId,
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
    return result;
  } catch (error) {
    throw error;
  }
};

// Static method to cleanup expired notifications
notificationSchema.statics.cleanupExpired = async function () {
  try {
    const result = await this.deleteMany({
      expires_at: { $lt: new Date() },
    });
    return result;
  } catch (error) {
    throw error;
  }
};

export default mongoose.model("Notification", notificationSchema);
