import Comment from "../models/comment.model.js";
import Blog from "../models/blog.model.js";
import User from "../models/user.model.js";
import {
  handleError,
  databaseError,
  notFoundError,
  forbiddenError,
} from "../utils/handleError.js";
import {
  createCommentLikeNotification,
  createCommentReportNotification,
  createCommentDeletionNotification,
  createReportResolvedNotification,
  createBlogCommentNotification,
  createCommentReplyNotification,
  createUserTagNotification,
  createAdminCommentNotification,
  createAdminReplyNotification,
  createAdminReportNotification,
} from "./notification.controller.js";

// Helper function to build nested comment tree
const buildCommentTree = (comments) => {
  const commentMap = new Map();
  const rootComments = [];

  // First pass: create a map of all comments
  comments.forEach((comment) => {
    commentMap.set(comment._id.toString(), {
      ...comment.toObject(),
      children: [],
      replies: [], // Separate direct replies from tagged replies
    });
  });

  // Second pass: build the tree structure
  comments.forEach((comment) => {
    const commentObj = commentMap.get(comment._id.toString());

    if (comment.parent) {
      const parent = commentMap.get(comment.parent.toString());
      if (parent) {
        parent.children.push(commentObj);

        parent.replies.push(commentObj);
      } else {
        rootComments.push(commentObj);
      }
    } else {
      rootComments.push(commentObj);
    }
  });

  // Sort replies within each comment
  rootComments.forEach((comment) => {
    if (comment.children && comment.children.length > 0) {
      comment.children.sort(
        (a, b) => new Date(b.commented_at) - new Date(a.commented_at)
      );
      comment.replies = comment.children;
    }
  });

  return rootComments;
};

// Recursive function to count all comments in a tree
const countCommentsRecursively = (commentTree) => {
  let count = 0;

  const traverse = (comments) => {
    comments.forEach((comment) => {
      count++;
      if (comment.children && comment.children.length > 0) {
        traverse(comment.children);
      }
    });
  };

  traverse(commentTree);
  return count;
};

// @route   POST /api/blog/:blogId/comments
// @desc    Create a new comment or reply
// @access  Private
export const createComment = async (req, res, next) => {
  const { content, parent } = req.body;
  const { blogId } = req.params;
  const { id: userId } = req.user;

  // Validate blogId parameter
  if (!blogId || blogId === "undefined") {
    return next(handleError(400, "Blog ID is required and must be valid."));
  }

  if (!content?.trim()) {
    return next(handleError(400, "Comment content is required."));
  }

  if (content.length > 1000) {
    return next(
      handleError(400, "Comment content cannot exceed 1000 characters.")
    );
  }

  // Verify blog exists
  const blog = await Blog.findById(blogId)
    .populate("author", "personal_info.username personal_info.name")
    .catch((err) => {
      if (err.name === "CastError") {
        return next(handleError(400, "Invalid blog ID format."));
      }
      throw databaseError("finding blog", err);
    });

  if (!blog) {
    return next(notFoundError("Blog"));
  }

  // Only allow one level of nesting
  let parentCommentId = null;
  let isTaggedReply = false;
  let taggedUsers = [];

  if (parent) {
    const parentComment = await Comment.findOne({
      _id: parent,
      blog_id: blogId,
      is_deleted: false,
    }).catch((err) => {
      throw databaseError("finding parent comment", err);
    });

    if (!parentComment) {
      return next(handleError(400, "Invalid parent comment."));
    }

    // If the parent already has a parent, this becomes a tagged reply
    if (parentComment.parent) {
      // This is a tagged reply - link to the top-level comment
      parentCommentId = parentComment.parent;
      isTaggedReply = true;

      // Add the original commenter as a tagged user
      const originalCommenter = await User.findById(parentComment.commented_by)
        .select("personal_info.username")
        .catch((err) => {
          throw databaseError("finding original commenter", err);
        });

      if (originalCommenter?.personal_info?.username) {
        taggedUsers.push({
          user_id: parentComment.commented_by,
          username: originalCommenter.personal_info.username,
        });
      }
    } else {
      // This is a direct reply to a top-level comment
      parentCommentId = parent;
      isTaggedReply = false;
    }
  }

  // Extract @mentions from content and resolve them to user IDs
  const mentionRegex = /@(\w+)/g;
  let match;
  const mentionedUsernames = [];

  while ((match = mentionRegex.exec(content)) !== null) {
    if (!mentionedUsernames.includes(match[1])) {
      mentionedUsernames.push(match[1]);
    }
  }

  // Resolve mentioned usernames to user objects
  if (mentionedUsernames.length > 0) {
    const mentionedUsers = await User.find({
      "personal_info.username": { $in: mentionedUsernames },
    })
      .select("personal_info.username")
      .catch((err) => {
        throw databaseError("finding mentioned users", err);
      });

    // Add mentioned users to taggedUsers (avoid duplicates)
    mentionedUsers.forEach((user) => {
      const exists = taggedUsers.some(
        (tag) => tag.user_id.toString() === user._id.toString()
      );
      if (!exists) {
        taggedUsers.push({
          user_id: user._id,
          username: user.personal_info.username,
        });
      }
    });

    if (taggedUsers.length > 0) {
      isTaggedReply = true;
    }
  }

  const commentData = {
    blog_id: blogId,
    content: content.trim(),
    commented_by: userId,
    parent: parentCommentId,
    tagged_users: taggedUsers,
    is_tagged_reply: isTaggedReply,
  };

  const newComment = new Comment(commentData);
  await newComment.save().catch((err) => {
    throw databaseError("saving new comment", err);
  });

  // Create notifications for blog author and tagged users
  try {
    if (blog.author._id.toString() !== userId.toString()) {
      const username =
        req.user.personal_info?.username ||
        req.user.personal_info?.name ||
        "Unknown User";

      await createBlogCommentNotification(
        blog.author._id,
        username,
        blog.title,
        blogId,
        newComment._id,
        userId
      );
    }

    // If this is a reply, notify the parent comment author
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId)
        .populate("commented_by", "personal_info.username")
        .catch(() => null);

      if (
        parentComment &&
        parentComment.commented_by._id.toString() !== userId.toString()
      ) {
        const username =
          req.user.personal_info?.username ||
          req.user.personal_info?.name ||
          "Unknown User";
        await createCommentReplyNotification(
          parentComment.commented_by._id,
          username,
          blog.title,
          blogId,
          newComment._id,
          userId
        );
      }
    }

    // Notify tagged users
    for (const taggedUser of taggedUsers) {
      if (taggedUser.user_id.toString() !== userId.toString()) {
        const username =
          req.user.personal_info?.username ||
          req.user.personal_info?.name ||
          "Unknown User";
        await createUserTagNotification(
          taggedUser.user_id,
          username,
          blog.title,
          blogId,
          newComment._id,
          userId
        );
      }
    }

    // Notify admins about new comment activity
    if (parentCommentId) {
      // This is a reply
      const username =
        req.user.personal_info?.username ||
        req.user.personal_info?.name ||
        "Unknown User";
      await createAdminReplyNotification(
        username,
        blog.title,
        blogId,
        newComment._id,
        userId
      );
    } else {
      // This is a new comment
      const username =
        req.user.personal_info?.username ||
        req.user.personal_info?.name ||
        "Unknown User";
      await createAdminCommentNotification(
        username,
        blog.title,
        blogId,
        newComment._id,
        userId
      );
    }
  } catch (notificationError) {
    console.error("Error creating notifications:", notificationError);
  }

  // Populate the comment with user data and tagged users
  await newComment.populate([
    {
      path: "commented_by",
      select:
        "personal_info.name personal_info.username personal_info.profile_img",
    },
    {
      path: "tagged_users.user_id",
      select:
        "personal_info.name personal_info.username personal_info.profile_img",
    },
  ]);

  res.status(201).json({
    success: true,
    comment: newComment,
  });
};

// @route   GET /api/blog/:blogId/comments
// @desc    Get all comments for a blog in nested structure
// @access  Public
export const getBlogComments = async (req, res, next) => {
  const { blogId } = req.params;
  const { page = 1, limit = 20, sort = "newest" } = req.query;

  // Validate blogId parameter
  if (!blogId || blogId === "undefined") {
    return next(handleError(400, "Blog ID is required and must be valid."));
  }

  // Validate blog exists
  const blog = await Blog.findById(blogId).catch((err) => {
    if (err.name === "CastError") {
      return next(handleError(400, "Invalid blog ID format."));
    }
    throw databaseError("finding blog", err);
  });

  if (!blog) {
    return next(notFoundError("Blog"));
  }

  // Determine sort order
  const sortOrder = sort === "oldest" ? 1 : -1;

  // Get all comments for the blog (we need all to build the tree structure)
  const allComments = await Comment.find({
    blog_id: blogId,
    is_deleted: false,
  })
    .populate({
      path: "commented_by",
      select:
        "personal_info.name personal_info.username personal_info.profile_img",
    })
    .populate({
      path: "comment_likes",
      select: "_id",
    })
    .populate({
      path: "tagged_users.user_id",
      select:
        "personal_info.name personal_info.username personal_info.profile_img",
    })
    .select(
      "content commented_by parent comment_likes commented_at updated_at tagged_users is_tagged_reply"
    )
    .sort({ commented_at: sortOrder })
    .catch((err) => {
      throw databaseError("fetching comments", err);
    });

  // Build nested comment tree
  const nestedComments = buildCommentTree(allComments);

  // For pagination, we paginate top-level comments only
  const skip = (page - 1) * limit;
  const paginatedComments = nestedComments.slice(skip, skip + parseInt(limit));

  const totalTopLevel = nestedComments.length;
  const totalPages = Math.ceil(totalTopLevel / limit);

  res.status(200).json({
    success: true,
    comments: paginatedComments,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalComments: allComments.length,
      totalTopLevel,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

// @route   DELETE /api/comments/:commentId
// @desc    Delete a comment and all its replies
// @access  Private
export const deleteComment = async (req, res, next) => {
  const { commentId } = req.params;
  const { id: userId, role: userRole } = req.user;

  const comment = await Comment.findById(commentId)
    .populate("blog_id", "author")
    .catch((err) => {
      if (err.name === "CastError")
        throw handleError(400, "Invalid comment ID format");
      throw databaseError("finding comment to delete", err);
    });

  if (!comment || comment.is_deleted) {
    return next(notFoundError("Comment"));
  }

  const blogAuthorId = comment.blog_id.author.toString();
  const commentAuthorId = comment.commented_by.toString();

  // Authorization check
  if (
    userRole !== "admin" &&
    userId !== blogAuthorId &&
    userId !== commentAuthorId
  ) {
    return next(
      forbiddenError("You are not authorized to delete this comment.")
    );
  }

  // Get all descendant comments recursively
  const getAllDescendants = async (parentId) => {
    const children = await Comment.find({
      parent: parentId,
      is_deleted: false,
    });

    let allDescendants = [...children];

    for (const child of children) {
      const grandChildren = await getAllDescendants(child._id);
      allDescendants = allDescendants.concat(grandChildren);
    }

    return allDescendants;
  };

  const descendants = await getAllDescendants(commentId);
  const allCommentsToDelete = [comment, ...descendants];

  // Soft delete all comments
  const commentIds = allCommentsToDelete.map((c) => c._id);
  await Comment.updateMany(
    { _id: { $in: commentIds } },
    {
      is_deleted: true,
      deleted_at: new Date(),
      content: "[This comment has been deleted]", // Optional: replace content
    }
  ).catch((err) => {
    throw databaseError("soft deleting comments", err);
  });

  // Create notification for comment author about deletion
  try {
    // Only notify if the comment author is different from the deleter
    if (commentAuthorId !== userId) {
      await createCommentDeletionNotification(
        comment.commented_by,
        req.user.personal_info?.username || "Unknown User",
        comment.blog_id.title,
        comment.blog_id._id,
        comment._id,
        userId,
        userRole
      );
    }
  } catch (notificationError) {
    // Log notification errors but don't fail the deletion
    console.error("Error creating deletion notification:", notificationError);
  }

  // Notify all users who reported this comment that their report has been resolved
  try {
    if (comment.reports && comment.reports.length > 0) {
      const reportPromises = comment.reports.map(async (report) => {
        // Only notify if the reporter is different from the deleter
        if (report.reported_by.toString() !== userId) {
          await createReportResolvedNotification(
            report.reported_by,
            comment.blog_id.title,
            comment._id,
            userId
          );
        }
      });
      await Promise.all(reportPromises);
    }
  } catch (notificationError) {
    console.error(
      "Error creating report resolution notifications:",
      notificationError
    );
  }

  res.status(200).json({
    success: true,
    message: "Comment and all replies deleted successfully.",
    deletedCount: allCommentsToDelete.length,
  });
};

// @route   GET /api/comments/:commentId/replies
// @desc    Get direct replies to a comment with pagination
// @access  Public
export const getCommentReplies = async (req, res, next) => {
  const { commentId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  // Check if parent comment exists
  const parentComment = await Comment.findOne({
    _id: commentId,
    is_deleted: false,
  }).catch((err) => {
    if (err.name === "CastError")
      throw handleError(400, "Invalid comment ID format");
    throw databaseError("finding parent comment", err);
  });

  if (!parentComment) {
    return next(notFoundError("Comment"));
  }

  // Get direct replies only
  const replies = await Comment.find({
    parent: commentId,
    is_deleted: false,
  })
    .populate({
      path: "commented_by",
      select:
        "personal_info.name personal_info.username personal_info.profile_img",
    })
    .sort({ commented_at: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .catch((err) => {
      throw databaseError("fetching comment replies", err);
    });

  const totalReplies = await Comment.countDocuments({
    parent: commentId,
    is_deleted: false,
  }).catch((err) => {
    throw databaseError("counting comment replies", err);
  });

  const totalPages = Math.ceil(totalReplies / limit);

  res.status(200).json({
    success: true,
    replies,
    parentComment: {
      id: parentComment._id,
      content: parentComment.content,
      commented_at: parentComment.commented_at,
    },
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalReplies,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

// @route   GET /api/comments/:commentId
// @desc    Get a single comment by ID
// @access  Public
export const getComment = async (req, res, next) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId)
    .populate({
      path: "commented_by",
      select:
        "personal_info.name personal_info.username personal_info.profile_img",
    })
    .populate({
      path: "parent",
      select: "content commented_by commented_at",
      populate: {
        path: "commented_by",
        select:
          "personal_info.name personal_info.username personal_info.profile_img",
      },
    })
    .catch((err) => {
      if (err.name === "CastError")
        throw handleError(400, "Invalid comment ID format");
      throw databaseError("finding comment", err);
    });

  if (!comment || comment.is_deleted) {
    return next(notFoundError("Comment"));
  }

  res.status(200).json({
    success: true,
    comment,
  });
};

// @route   PUT /api/comments/:commentId
// @desc    Update a comment (ownership checked in controller)
// @access  Private
export const updateComment = async (req, res, next) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const { id: userId } = req.user;

  if (!content?.trim()) {
    return next(handleError(400, "Comment content is required."));
  }

  if (content.length > 1000) {
    return next(
      handleError(400, "Comment content cannot exceed 1000 characters.")
    );
  }

  const comment = await Comment.findById(commentId).catch((err) => {
    if (err.name === "CastError")
      throw handleError(400, "Invalid comment ID format");
    throw databaseError("finding comment to update", err);
  });

  if (!comment || comment.is_deleted) {
    return next(notFoundError("Comment"));
  }

  // Check ownership
  if (comment.commented_by.toString() !== userId) {
    return next(
      forbiddenError("You are not authorized to update this comment.")
    );
  }

  comment.content = content.trim();
  comment.updated_at = new Date();

  await comment.save().catch((err) => {
    throw databaseError("updating comment", err);
  });

  // Populate user data for response
  await comment.populate({
    path: "commented_by",
    select:
      "personal_info.name personal_info.username personal_info.profile_img",
  });

  res.status(200).json({
    success: true,
    comment,
  });
};

// @route   GET /api/comments/user/my-comments
// @desc    Get current user's comments with pagination
// @access  Private
export const getUserComments = async (req, res, next) => {
  const { id: userId } = req.user;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const comments = await Comment.find({
    commented_by: userId,
    is_deleted: false,
  })
    .populate({
      path: "blog_id",
      select: "title slug",
    })
    .populate({
      path: "parent",
      select: "content",
    })
    .sort({ commented_at: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .catch((err) => {
      throw databaseError("fetching user comments", err);
    });

  const totalComments = await Comment.countDocuments({
    commented_by: userId,
    is_deleted: false,
  }).catch((err) => {
    throw databaseError("counting user comments", err);
  });

  const totalPages = Math.ceil(totalComments / limit);

  res.status(200).json({
    success: true,
    comments,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalComments,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

// @route   POST /api/comments/:commentId/report
// @desc    Report a comment for inappropriate content
// @access  Private
export const reportComment = async (req, res, next) => {
  const { commentId } = req.params;
  const { reason } = req.body;
  const { id: userId } = req.user;

  const comment = await Comment.findById(commentId)
    .populate({
      path: "commented_by",
      select: "personal_info.username personal_info.name",
    })
    .populate({
      path: "blog_id",
      select: "title _id",
    })
    .catch((err) => {
      if (err.name === "CastError")
        throw handleError(400, "Invalid comment ID format");
      throw databaseError("finding comment to report", err);
    });

  // Store the original ObjectId before population for notification calls
  const commentAuthorId = comment.commented_by._id || comment.commented_by;

  // Validate that required fields are populated
  if (!comment.commented_by || !comment.blog_id) {
    return next(
      handleError(500, "Failed to load comment data. Please try again.")
    );
  }

  // Additional validation for user data
  if (!req.user) {
    console.error("User data validation failed:", {
      user: req.user,
    });
    return next(
      handleError(500, "User data is incomplete. Please log in again.")
    );
  }

  // Get username from JWT or fetch from database if needed
  let reporterUsername = req.user.personal_info?.username;
  if (!reporterUsername) {
    try {
      // Fetch username from database if not in JWT
      const user = await User.findById(req.user.id).select(
        "personal_info.username"
      );
      if (user && user.personal_info?.username) {
        reporterUsername = user.personal_info.username;
      } else {
        return next(
          handleError(
            500,
            "Could not retrieve user information. Please log in again."
          )
        );
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      return next(
        handleError(
          500,
          "Could not retrieve user information. Please log in again."
        )
      );
    }
  }

  if (
    !comment.commented_by.personal_info ||
    !comment.commented_by.personal_info.username
  ) {
    console.error("Comment author data validation failed:", {
      commented_by: comment.commented_by,
      personal_info: comment.commented_by?.personal_info,
      username: comment.commented_by?.personal_info?.username,
    });
    return next(handleError(500, "Comment author data is incomplete."));
  }

  if (!comment || comment.is_deleted) {
    return next(notFoundError("Comment"));
  }

  // Check if user already reported this comment
  const existingReport = comment.reports.find(
    (report) => report.reported_by.toString() === userId
  );

  if (existingReport) {
    return next(handleError(400, "You have already reported this comment."));
  }

  // Add report
  comment.reports.push({
    reported_by: userId,
    reason: reason.trim(),
    reported_at: new Date(),
  });

  await comment.save().catch((err) => {
    throw databaseError("saving comment report", err);
  });

  // Create notification for comment author about the report
  try {
    await createCommentReportNotification(
      commentAuthorId,
      reporterUsername,
      comment.blog_id.title,
      comment.blog_id._id,
      comment._id,
      userId,
      reason
    );
  } catch (notificationError) {
    // Log notification errors but don't fail the report
    console.error("Error creating report notification:", notificationError);
  }

  // Also notify admins about the reported comment
  try {
    await createAdminReportNotification(
      reporterUsername,
      comment.commented_by.personal_info.username,
      comment.blog_id.title,
      comment.blog_id._id,
      comment._id,
      userId,
      reason
    );
  } catch (adminNotificationError) {
    // Log admin notification errors but don't fail the report
    console.error(
      "Error creating admin report notification:",
      adminNotificationError
    );
  }

  res.status(200).json({
    success: true,
    message: "Comment reported successfully.",
  });
};

// @route   GET /api/comments/admin/all
// @desc    Get all comments across all blogs (for admin management)
// @access  Private (Admin)
export const getAllCommentsForAdmin = async (req, res, next) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const comments = await Comment.find({ is_deleted: false })
    .populate({
      path: "commented_by",
      select:
        "personal_info.name personal_info.username personal_info.profile_img",
    })
    .populate({
      path: "blog_id",
      select: "title slug",
    })
    .populate({
      path: "parent",
      select: "content",
    })
    .sort({ commented_at: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .catch((err) => {
      throw databaseError("fetching all comments", err);
    });

  const totalComments = await Comment.countDocuments({
    is_deleted: false,
  }).catch((err) => {
    throw databaseError("counting all comments", err);
  });

  const totalPages = Math.ceil(totalComments / limit);

  res.status(200).json({
    success: true,
    comments,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalComments,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

// @route   GET /api/comments/admin/reported
// @desc    Get all reported comments for admin review
// @access  Private (Admin)
export const getReportedComments = async (req, res, next) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const comments = await Comment.find({
    is_deleted: false,
    "reports.0": { $exists: true }, // Comments with at least one report
  })
    .populate({
      path: "commented_by",
      select:
        "personal_info.name personal_info.username personal_info.profile_img",
    })
    .populate({
      path: "blog_id",
      select: "title slug",
    })
    .populate({
      path: "parent",
      select: "content",
    })
    .sort({ "reports.reported_at": -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .catch((err) => {
      throw databaseError("fetching reported comments", err);
    });

  const totalReportedComments = await Comment.countDocuments({
    is_deleted: false,
    "reports.0": { $exists: true },
  }).catch((err) => {
    throw databaseError("counting reported comments", err);
  });

  const totalPages = Math.ceil(totalReportedComments / limit);

  res.status(200).json({
    success: true,
    comments,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalReportedComments,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

// @route   GET /api/comments/author/all
// @desc    Get all comments across blogs owned by the author (or admin)
// @access  Private (Author/Admin)
export const getAllCommentsForAuthor = async (req, res, next) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;
  const { id: userId, role } = req.user;

  if (role !== "author" && role !== "admin") {
    return next(
      forbiddenError("Only authors or admins can access author comments.")
    );
  }

  // Get blog ids owned by this author
  const blogIds = await Blog.find({ author: userId })
    .distinct("_id")
    .catch((err) => {
      throw databaseError("finding author's blogs", err);
    });

  const comments = await Comment.find({
    is_deleted: false,
    blog_id: { $in: blogIds },
  })
    .populate({
      path: "commented_by",
      select:
        "personal_info.name personal_info.username personal_info.profile_img",
    })
    .populate({ path: "blog_id", select: "title slug" })
    .populate({ path: "parent", select: "content" })
    .sort({ commented_at: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .catch((err) => {
      throw databaseError("fetching author's blog comments", err);
    });

  const totalComments = await Comment.countDocuments({
    is_deleted: false,
    blog_id: { $in: blogIds },
  }).catch((err) => {
    throw databaseError("counting author's blog comments", err);
  });

  const totalPages = Math.ceil(totalComments / limit);

  res.status(200).json({
    success: true,
    comments,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalComments,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

// @route   GET /api/comments/author/reported
// @desc    Get all reported comments across author's blogs (or admin viewing per-author scope)
// @access  Private (Author/Admin)
export const getReportedCommentsForAuthor = async (req, res, next) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;
  const { id: userId, role } = req.user;

  if (role !== "author" && role !== "admin") {
    return next(
      forbiddenError(
        "Only authors or admins can access reported comments for author scope."
      )
    );
  }

  // Get blog ids owned by this author
  const blogIds = await Blog.find({ author: userId })
    .distinct("_id")
    .catch((err) => {
      throw databaseError("finding author's blogs", err);
    });

  const comments = await Comment.find({
    is_deleted: false,
    blog_id: { $in: blogIds },
    "reports.0": { $exists: true },
  })
    .populate({
      path: "commented_by",
      select:
        "personal_info.name personal_info.username personal_info.profile_img",
    })
    .populate({ path: "blog_id", select: "title slug" })
    .populate({ path: "parent", select: "content" })
    .sort({ "reports.reported_at": -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .catch((err) => {
      throw databaseError("fetching reported comments for author's blogs", err);
    });

  const totalReportedComments = await Comment.countDocuments({
    is_deleted: false,
    blog_id: { $in: blogIds },
    "reports.0": { $exists: true },
  }).catch((err) => {
    throw databaseError("counting reported comments for author's blogs", err);
  });

  const totalPages = Math.ceil(totalReportedComments / limit);

  res.status(200).json({
    success: true,
    comments,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalReportedComments,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

// @route   DELETE /api/comments/admin/:commentId/force-delete
// @desc    Force delete any comment (admin override)
// @access  Private (Admin)
export const forceDeleteComment = async (req, res, next) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId).catch((err) => {
    if (err.name === "CastError")
      throw handleError(400, "Invalid comment ID format");
    throw databaseError("finding comment to force delete", err);
  });

  if (!comment) {
    return next(notFoundError("Comment"));
  }

  // Get all descendant comments recursively
  const getAllDescendants = async (parentId) => {
    const children = await Comment.find({
      parent: parentId,
      is_deleted: false,
    });

    let allDescendants = [...children];

    for (const child of children) {
      const grandChildren = await getAllDescendants(child._id);
      allDescendants = allDescendants.concat(grandChildren);
    }

    return allDescendants;
  };

  const descendants = await getAllDescendants(commentId);
  const allCommentsToDelete = [comment, ...descendants];

  // Hard delete all comments
  const commentIds = allCommentsToDelete.map((c) => c._id);
  await Comment.deleteMany({ _id: { $in: commentIds } }).catch((err) => {
    throw databaseError("force deleting comments", err);
  });

  // Update blog comment count
  await Blog.findByIdAndUpdate(comment.blog_id, {
    $inc: { "activity.total_comments": -allCommentsToDelete.length },
  }).catch((err) => {
    throw databaseError(
      "updating blog comment count after force deletion",
      err
    );
  });

  // Create notification for comment author about permanent deletion
  try {
    await createCommentDeletionNotification(
      comment.commented_by,
      req.user.personal_info?.username || "Unknown User",
      comment.blog_id.title,
      comment.blog_id._id,
      comment._id,
      req.user.id,
      "admin"
    );
  } catch (notificationError) {
    // Log notification errors but don't fail the deletion
    console.error(
      "Error creating force deletion notification:",
      notificationError
    );
  }

  res.status(200).json({
    success: true,
    message: `Comment and ${descendants.length} replies were permanently deleted.`,
    deletedCount: allCommentsToDelete.length,
  });
};

// @route   POST /api/categories/:categoryId/blogs/:blogId/comments/:commentId/likes
// @desc    Like or unlike a comment
// @access  Private
export const toggleCommentLike = async (req, res, next) => {
  const { commentId } = req.params;
  const { id: userId } = req.user;

  // Validate commentId parameter
  if (!commentId || commentId === "undefined") {
    return next(handleError(400, "Comment ID is required and must be valid."));
  }

  try {
    // Use the comment model's toggleLike method
    const result = await Comment.toggleLike(commentId, userId);

    // Create notification for comment like (only when liking, not unliking)
    if (result.liked) {
      try {
        const comment = await Comment.findById(commentId)
          .populate("blog_id", "title")
          .populate("commented_by", "personal_info.username");

        if (
          comment &&
          comment.commented_by._id.toString() !== userId.toString()
        ) {
          await createCommentLikeNotification(
            comment.commented_by._id,
            req.user.personal_info?.username || "Unknown User",
            comment.blog_id.title,
            comment.blog_id._id,
            comment._id,
            userId
          );
        }

        // Also notify admins about comment like activity
        if (comment) {
          await createAdminCommentLikeNotification(
            req.user.personal_info?.username || "Unknown User",
            comment.commented_by.personal_info.username,
            comment.blog_id.title,
            comment.blog_id._id,
            comment._id,
            userId
          );
        }
      } catch (notificationError) {
        // Log error but don't fail the like operation
        console.error(
          "Error creating comment like notification:",
          notificationError
        );
      }
    }

    const message = result.liked
      ? "Comment liked successfully."
      : "Comment unliked successfully.";

    res.status(200).json({
      success: true,
      message,
      totalLikes: result.totalLikes,
    });
  } catch (error) {
    if (error.message === "Comment not found") {
      return next(notFoundError("Comment"));
    }
    throw databaseError("toggling comment like", error);
  }
};

// @route   GET /api/comments/admin/my-blogs
// @desc    Get all comments across admin's own blogs (separate from admin/all)
// @access  Private (Admin)
export const getAdminOwnBlogComments = async (req, res, next) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;
  const { id: userId } = req.user;

  // Get blog ids owned by this admin
  const blogIds = await Blog.find({ author: userId })
    .distinct("_id")
    .catch((err) => {
      throw databaseError("finding admin's own blogs", err);
    });

  const comments = await Comment.find({
    is_deleted: false,
    blog_id: { $in: blogIds },
  })
    .populate({
      path: "commented_by",
      select:
        "personal_info.name personal_info.username personal_info.profile_img",
    })
    .populate({ path: "blog_id", select: "title slug" })
    .populate({ path: "parent", select: "content" })
    .sort({ commented_at: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .catch((err) => {
      throw databaseError("fetching admin's own blog comments", err);
    });

  const totalComments = await Comment.countDocuments({
    is_deleted: false,
    blog_id: { $in: blogIds },
  }).catch((err) => {
    throw databaseError("counting admin's own blog comments", err);
  });

  const totalPages = Math.ceil(totalComments / limit);

  res.status(200).json({
    success: true,
    comments,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalComments,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

// @route   PUT /api/comments/:commentId/dismiss-report
// @desc    Dismiss a report on a comment (for authors/admins)
// @access  Private (Author/Admin)
export const dismissReport = async (req, res, next) => {
  const { commentId } = req.params;
  const { id: userId, role: userRole } = req.user;

  try {
    const comment = await Comment.findById(commentId)
      .populate("blog_id", "author title")
      .catch((err) => {
        if (err.name === "CastError") {
          throw handleError(400, "Invalid comment ID format");
        }
        throw databaseError("finding comment to dismiss report", err);
      });

    if (!comment || comment.is_deleted) {
      return next(notFoundError("Comment"));
    }

    // Authorization check - only blog author or admin can dismiss reports
    if (
      userRole !== "admin" &&
      comment.blog_id.author.toString() !== userId.toString()
    ) {
      return next(
        forbiddenError(
          "You are not authorized to dismiss reports on this comment."
        )
      );
    }

    // Get all users who reported this comment
    const reporters = comment.reports.map((report) => report.reported_by);

    // Clear all reports
    comment.reports = [];
    await comment.save().catch((err) => {
      throw databaseError("saving comment after dismissing reports", err);
    });

    // Notify all reporters that their report has been resolved
    for (const reporterId of reporters) {
      try {
        await createReportResolvedNotification(
          reporterId,
          comment.blog_id.title,
          comment.blog_id._id,
          comment._id,
          userId
        );
      } catch (notificationError) {
        console.error(
          "Error creating report resolved notification:",
          notificationError
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Comment reports dismissed successfully.",
      dismissedCount: reporters.length,
    });
  } catch (error) {
    if (error.status) {
      return next(error);
    }
    throw databaseError("dismissing comment reports", error);
  }
};

// @route   GET /api/comments/stats
// @desc    Get overall comment statistics
// @access  Private (Admin)
export const getCommentStats = async (req, res, next) => {
  try {
    const totalComments = await Comment.countDocuments({ is_deleted: false });
    const totalDeletedComments = await Comment.countDocuments({
      is_deleted: true,
    });
    const totalReportedComments = await Comment.countDocuments({
      "reports.0": { $exists: true },
      is_deleted: false,
    });

    // Get comments by type
    const topLevelComments = await Comment.countDocuments({
      parent: null,
      is_deleted: false,
    });

    const replyComments = await Comment.countDocuments({
      parent: { $ne: null },
      is_deleted: false,
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentComments = await Comment.countDocuments({
      commented_at: { $gte: sevenDaysAgo },
      is_deleted: false,
    });

    // Get comments with most reports
    const mostReportedComments = await Comment.aggregate([
      { $match: { is_deleted: false, "reports.0": { $exists: true } } },
      { $addFields: { reportCount: { $size: "$reports" } } },
      { $sort: { reportCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "blogs",
          localField: "blog_id",
          foreignField: "_id",
          as: "blog",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "commented_by",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $project: {
          _id: 1,
          content: 1,
          reportCount: 1,
          "blog.title": 1,
          "user.personal_info.username": 1,
          commented_at: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total: totalComments,
        deleted: totalDeletedComments,
        reported: totalReportedComments,
        topLevel: topLevelComments,
        replies: replyComments,
        recent: recentComments,
        mostReported: mostReportedComments,
      },
    });
  } catch (error) {
    throw databaseError("fetching comment statistics", error);
  }
};

// @route   PUT /api/comments/:commentId/status
// @desc    Update comment status (approve/reject) - for admins and authors
// @access  Private (Admin/Author)
export const updateCommentStatus = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { status } = req.body;
    const { id: userId, role } = req.user;

    // Find the comment
    const comment = await Comment.findById(commentId)
      .populate({
        path: "blog_id",
        select: "author title",
      })
      .catch((err) => {
        throw databaseError("finding comment", err);
      });

    if (!comment) {
      return next(notFoundError("Comment not found"));
    }

    // Check permissions
    const isCommentAuthor = comment.blog_id?.author?.toString() === userId;
    const canModify =
      role === "admin" || (role === "author" && isCommentAuthor);

    if (!canModify) {
      return next(
        forbiddenError("You don't have permission to modify this comment")
      );
    }

    // Update the comment status
    comment.status = status;
    comment.modified_at = new Date();

    await comment.save().catch((err) => {
      throw databaseError("updating comment status", err);
    });

    res.status(200).json({
      success: true,
      message: `Comment status updated to ${status} successfully.`,
      comment: {
        _id: comment._id,
        status: comment.status,
        modified_at: comment.modified_at,
      },
    });
  } catch (error) {
    if (error.status) {
      return next(error);
    }
    throw databaseError("updating comment status", error);
  }
};
