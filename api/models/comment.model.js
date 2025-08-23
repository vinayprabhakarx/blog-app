import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    blog_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Blog",
      index: true,
    },
    commented_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    // Parent comment reference for replies
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
    // Tagged users in replies
    tagged_users: [
      {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        username: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    // Flag to distinguish between direct replies and tagged replies
    is_tagged_reply: {
      type: Boolean,
      default: false,
    },

    comment_likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    reports: [
      {
        reported_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        reason: {
          type: String,
          required: true,
          trim: true,
          maxlength: 500,
        },
        reported_at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Soft delete fields
    is_deleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: "commented_at",
      updatedAt: "updated_at",
    },
  }
);

// Performance indexes
commentSchema.index({ blog_id: 1, parent: 1, commented_at: -1 });
commentSchema.index({ blog_id: 1, is_deleted: 1, commented_at: -1 });
commentSchema.index({
  blog_id: 1,
  parent: 1,
  is_tagged_reply: 1,
  commented_at: -1,
});

// Virtual for checking if it's a reply
commentSchema.virtual("is_reply").get(function () {
  return this.parent != null;
});

// Virtual for like count
commentSchema.virtual("likeCount").get(function () {
  return this.comment_likes ? this.comment_likes.length : 0;
});

// Virtual for reply count (will be calculated in aggregation)
commentSchema.virtual("replyCount").get(function () {
  return this.children ? this.children.length : 0;
});

// Virtual for report count
commentSchema.virtual("reportCount").get(function () {
  return this.reports ? this.reports.length : 0;
});

// Method to check if a user has liked this comment
commentSchema.methods.isLikedBy = function (userId) {
  return (
    this.comment_likes &&
    this.comment_likes.some((likeId) => likeId.toString() === userId.toString())
  );
};

// Method to add a like
commentSchema.methods.addLike = function (userId) {
  if (!this.comment_likes) {
    this.comment_likes = [];
  }
  if (!this.comment_likes.includes(userId)) {
    this.comment_likes.push(userId);
  }
  return this.save();
};

// Method to remove a like
commentSchema.methods.removeLike = function (userId) {
  if (!this.comment_likes) {
    this.comment_likes = [];
  }
  this.comment_likes = this.comment_likes.filter(
    (likeId) => likeId.toString() !== userId.toString()
  );
  return this.save();
};

// Static method to toggle like
commentSchema.statics.toggleLike = async function (commentId, userId) {
  const comment = await this.findById(commentId);
  if (!comment) {
    throw new Error("Comment not found");
  }

  const isLiked = comment.isLikedBy(userId);

  if (isLiked) {
    await comment.removeLike(userId);
    // Refresh the document to get updated like count
    const updatedComment = await this.findById(commentId);
    return { liked: false, totalLikes: updatedComment.likeCount };
  } else {
    await comment.addLike(userId);
    // Refresh the document to get updated like count
    const updatedComment = await this.findById(commentId);
    return { liked: true, totalLikes: updatedComment.likeCount };
  }
};

// Method to add tagged users
commentSchema.methods.addTaggedUsers = function (users) {
  if (!this.tagged_users) {
    this.tagged_users = [];
  }

  users.forEach((user) => {
    // Avoid duplicate tags
    const exists = this.tagged_users.some(
      (tag) => tag.user_id.toString() === user.user_id.toString()
    );
    if (!exists) {
      this.tagged_users.push({
        user_id: user.user_id,
        username: user.username,
      });
    }
  });

  if (this.tagged_users.length > 0) {
    this.is_tagged_reply = true;
  }
};

// Method to extract @mentions from content
commentSchema.methods.extractMentions = function () {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(this.content)) !== null) {
    if (!mentions.includes(match[1])) {
      mentions.push(match[1]);
    }
  }

  return mentions;
};

// Set is_reply flag based on parent
commentSchema.pre("save", function (next) {
  if (this.isModified("parent")) {
    this.is_reply = this.parent != null;
  }
  next();
});

export default mongoose.model("Comment", commentSchema);
