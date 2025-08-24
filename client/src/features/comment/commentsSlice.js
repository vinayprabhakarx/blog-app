import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createSelector } from "@reduxjs/toolkit";
import commentService from "./commentsService";

// Utility functions for tree operations
const findCommentInTree = (comments, targetId) => {
  for (const comment of comments) {
    if (comment._id === targetId) {
      return comment;
    }
    if (comment.children && comment.children.length > 0) {
      const found = findCommentInTree(comment.children, targetId);
      if (found) return found;
    }
  }
  return null;
};

const updateCommentInTree = (comments, targetId, updater) => {
  return comments.map((comment) => {
    if (comment._id === targetId) {
      return typeof updater === "function"
        ? updater(comment)
        : { ...comment, ...updater };
    }

    if (comment.children && comment.children.length > 0) {
      return {
        ...comment,
        children: updateCommentInTree(comment.children, targetId, updater),
      };
    }

    return comment;
  });
};

const removeCommentFromTree = (comments, targetId) => {
  return comments
    .filter((comment) => {
      if (comment._id === targetId) {
        return false; // Remove this comment
      }

      if (comment.children && comment.children.length > 0) {
        return {
          ...comment,
          children: removeCommentFromTree(comment.children, targetId),
        };
      }

      return true; // Keep this comment
    })
    .map((comment) => {
      if (comment.children) {
        return {
          ...comment,
          children: removeCommentFromTree(comment.children, targetId),
        };
      }
      return comment;
    });
};

const addCommentToTree = (comments, newComment, parentId = null) => {
  if (!parentId) {
    // Add as top-level comment
    return [newComment, ...comments];
  }

  return comments.map((comment) => {
    if (comment._id === parentId) {
      return {
        ...comment,
        children: [...(comment.children || []), newComment],
      };
    }

    if (comment.children && comment.children.length > 0) {
      return {
        ...comment,
        children: addCommentToTree(comment.children, newComment, parentId),
      };
    }

    return comment;
  });
};

// Async thunks
export const fetchBlogComments = createAsyncThunk(
  "comments/fetchBlogComments",
  async ({ blogId, ...params }, { rejectWithValue, getState }) => {
    try {
      const data = await commentService.getByBlog(blogId, params);
      const currentUser = getState().auth.user;
      return { blogId, currentUser, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch comments"
      );
    }
  }
);

export const createComment = createAsyncThunk(
  "comments/createComment",
  async (commentData, { rejectWithValue }) => {
    try {
      const data = await commentService.create(commentData);
      return { ...data, blogId: commentData.blog_id };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create comment"
      );
    }
  }
);

export const updateComment = createAsyncThunk(
  "comments/updateComment",
  async ({ commentId, content }, { rejectWithValue }) => {
    try {
      const data = await commentService.update(commentId, { content });
      return data.comment || data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update comment"
      );
    }
  }
);

export const deleteComment = createAsyncThunk(
  "comments/deleteComment",
  async (commentId, { rejectWithValue }) => {
    try {
      const data = await commentService.delete(commentId);
      return { commentId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete comment"
      );
    }
  }
);

export const reportComment = createAsyncThunk(
  "comments/reportComment",
  async ({ commentId, reason }, { rejectWithValue }) => {
    try {
      const data = await commentService.report(commentId, reason);
      return { commentId, message: data.message };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to report comment"
      );
    }
  }
);

export const toggleCommentLike = createAsyncThunk(
  "comments/toggleCommentLike",
  async ({ commentId }, { rejectWithValue }) => {
    try {
      const data = await commentService.toggleLike(commentId);
      return { commentId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to toggle like"
      );
    }
  }
);

// Management views
export const fetchUserComments = createAsyncThunk(
  "comments/fetchUserComments",
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const data = await commentService.getUserComments(page, limit);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch your comments"
      );
    }
  }
);

export const fetchAdminComments = createAsyncThunk(
  "comments/fetchAdminComments",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await commentService.getAdminComments(params);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch comments"
      );
    }
  }
);

export const fetchAuthorComments = createAsyncThunk(
  "comments/fetchAuthorComments",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await commentService.getAuthorComments(params);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch comments"
      );
    }
  }
);

export const updateCommentStatus = createAsyncThunk(
  "comments/updateCommentStatus",
  async ({ commentId, status }, { rejectWithValue }) => {
    try {
      const data = await commentService.updateCommentStatus(commentId, status);
      return { commentId, status, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update comment status"
      );
    }
  }
);

export const fetchAdminOwnBlogComments = createAsyncThunk(
  "comments/fetchAdminOwnBlogComments",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await commentService.getAdminOwnBlogComments(params);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch admin's own blog comments"
      );
    }
  }
);

export const fetchReportedComments = createAsyncThunk(
  "comments/fetchReportedComments",
  async ({ scope = "admin", params = {} }, { rejectWithValue }) => {
    try {
      const data = await commentService.getReportedComments(scope, params);
      return { scope, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch reported comments"
      );
    }
  }
);

export const dismissReport = createAsyncThunk(
  "comments/dismissReport",
  async (commentId, { rejectWithValue }) => {
    try {
      const data = await commentService.dismissReport(commentId);
      return { commentId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to dismiss report"
      );
    }
  }
);

export const forceDeleteComment = createAsyncThunk(
  "comments/forceDeleteComment",
  async (commentId, { rejectWithValue }) => {
    try {
      const data = await commentService.forceDeleteComment(commentId);
      return { commentId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to force delete comment"
      );
    }
  }
);

export const fetchCommentStats = createAsyncThunk(
  "comments/fetchCommentStats",
  async (_, { rejectWithValue }) => {
    try {
      const data = await commentService.getCommentStats();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch comment statistics"
      );
    }
  }
);

const commentsSlice = createSlice({
  name: "comments",
  initialState: {
    // Comments organized by blog ID with tree structure preserved
    commentsByBlog: {}, // { blogId: { comments: [], pagination: {} } }

    // Loading states
    fetchLoading: {}, // { blogId: boolean }
    createLoading: false,
    updateLoading: {}, // { commentId: boolean }
    deleteLoading: {}, // { commentId: boolean }
    reportLoading: {}, // { commentId: boolean }

    // Like-related state
    likeLoading: {}, // { commentId: boolean }
    likeCounts: {}, // { commentId: count }
    userLikes: {}, // { commentId: boolean }

    // Errors
    fetchError: {},
    createError: null,
    updateError: {},
    deleteError: {},
    reportError: {},

    // UI state
    editingComment: null,
    replyingTo: null,

    // Management lists
    userList: [],
    userPagination: null,
    userLoading: false,
    userError: null,

    adminList: [],
    adminPagination: null,
    adminLoading: false,
    adminError: null,

    authorList: [],
    authorPagination: null,
    authorLoading: false,
    authorError: null,

    adminBlogsList: [],
    adminBlogsPagination: null,
    adminBlogsLoading: false,
    adminBlogsError: null,

    reportedAdminList: [],
    reportedAuthorList: [],
    reportedPagination: null,
    reportedLoading: false,
    reportedError: null,

    // New state for enhanced features
    stats: {
      totalComments: 0,
      totalReports: 0,
      activeReports: 0,
      resolvedReports: 0,
      dismissedReports: 0,
    },
    statsLoading: false,
    statsError: null,

    notifications: [],
    notificationsLoading: false,
    notificationsError: null,
    unreadCount: 0,

    // Loading states for new actions
    dismissLoading: {},
    forceDeleteLoading: {},
  },
  reducers: {
    // UI actions
    setEditingComment: (state, action) => {
      state.editingComment = action.payload;
    },
    setReplyingTo: (state, action) => {
      state.replyingTo = action.payload;
    },
    clearEditingComment: (state) => {
      state.editingComment = null;
    },
    clearReplyingTo: (state) => {
      state.replyingTo = null;
    },

    // Error clearing
    clearCreateError: (state) => {
      state.createError = null;
    },
    clearUpdateError: (state, action) => {
      if (action.payload) {
        delete state.updateError[action.payload];
      } else {
        state.updateError = {};
      }
    },
    clearDeleteError: (state, action) => {
      if (action.payload) {
        delete state.deleteError[action.payload];
      } else {
        state.deleteError = {};
      }
    },

    // Cache management
    invalidateCommentsCache: (state, action) => {
      const blogId = action.payload;
      if (blogId) {
        delete state.commentsByBlog[blogId];
        delete state.fetchLoading[blogId];
        delete state.fetchError[blogId];
      } else {
        // Clear all cache
        state.commentsByBlog = {};
        state.fetchLoading = {};
        state.fetchError = {};
      }
    },

    // Initialize comment like data
    initializeCommentLikes: (state, action) => {
      const { comments, userId } = action.payload;

      const processComments = (commentList) => {
        commentList.forEach((comment) => {
          if (comment._id) {
            // Set like count
            state.likeCounts[comment._id] = comment.comment_likes
              ? comment.comment_likes.length
              : 0;

            // Set user like status if user is logged in
            if (userId) {
              state.userLikes[comment._id] = comment.comment_likes
                ? comment.comment_likes.includes(userId)
                : false;
            }
          }

          // Process child comments
          if (comment.children && comment.children.length > 0) {
            processComments(comment.children);
          }
        });
      };

      processComments(comments);
    },

    // Real-time updates
    addCommentToCache: (state, action) => {
      const { blogId, comment, parentId = null } = action.payload;
      if (state.commentsByBlog[blogId]) {
        state.commentsByBlog[blogId].comments = addCommentToTree(
          state.commentsByBlog[blogId].comments,
          comment,
          parentId
        );
      }
    },

    updateCommentInCache: (state, action) => {
      const { blogId, comment } = action.payload;
      if (state.commentsByBlog[blogId]) {
        state.commentsByBlog[blogId].comments = updateCommentInTree(
          state.commentsByBlog[blogId].comments,
          comment._id,
          comment
        );
      }
    },

    removeCommentFromCache: (state, action) => {
      const { blogId, commentId } = action.payload;
      if (state.commentsByBlog[blogId]) {
        state.commentsByBlog[blogId].comments = removeCommentFromTree(
          state.commentsByBlog[blogId].comments,
          commentId
        );
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Blog Comments
    builder
      .addCase(fetchBlogComments.pending, (state, action) => {
        const blogId = action.meta.arg.blogId;
        state.fetchLoading[blogId] = true;
        delete state.fetchError[blogId];
      })
      .addCase(fetchBlogComments.fulfilled, (state, action) => {
        const { blogId, comments, pagination, currentUser } = action.payload;
        state.fetchLoading[blogId] = false;
        state.commentsByBlog[blogId] = {
          comments: comments || [],
          pagination: pagination || {},
        };

        // Initialize comment like data
        if (comments && comments.length > 0) {
          const processComments = (commentList) => {
            commentList.forEach((comment) => {
              if (comment._id) {
                // Set like count
                state.likeCounts[comment._id] = comment.comment_likes
                  ? comment.comment_likes.length
                  : 0;

                // Set user like status if user is logged in
                if (currentUser) {
                  state.userLikes[comment._id] = comment.comment_likes
                    ? comment.comment_likes.some(
                        (likeId) =>
                          likeId.toString() === currentUser._id.toString()
                      )
                    : false;
                }
              }

              // Process child comments
              if (comment.children && comment.children.length > 0) {
                processComments(comment.children);
              }
            });
          };

          processComments(comments);
        }
      })
      .addCase(fetchBlogComments.rejected, (state, action) => {
        const blogId = action.meta.arg.blogId;
        state.fetchLoading[blogId] = false;
        state.fetchError[blogId] = action.payload;
      });

    // Create Comment
    builder
      .addCase(createComment.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.createLoading = false;
        const { comment, blogId } = action.payload;
        const parentId = comment.parent;

        if (state.commentsByBlog[blogId]) {
          state.commentsByBlog[blogId].comments = addCommentToTree(
            state.commentsByBlog[blogId].comments,
            comment,
            parentId
          );
        }

        // Initialize like data for new comment
        if (comment._id) {
          state.likeCounts[comment._id] = comment.comment_likes
            ? comment.comment_likes.length
            : 0;
          state.userLikes[comment._id] = false; // New comment is not liked by current user
        }

        // Clear reply state
        state.replyingTo = null;
      })
      .addCase(createComment.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload;
      });

    // Update Comment
    builder
      .addCase(updateComment.pending, (state, action) => {
        const commentId = action.meta.arg.commentId;
        state.updateLoading[commentId] = true;
        delete state.updateError[commentId];
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        const updatedComment = action.payload;
        const commentId = updatedComment._id;
        state.updateLoading[commentId] = false;

        // Update comment in all relevant blog comment trees
        Object.keys(state.commentsByBlog).forEach((blogId) => {
          if (state.commentsByBlog[blogId]?.comments) {
            state.commentsByBlog[blogId].comments = updateCommentInTree(
              state.commentsByBlog[blogId].comments,
              commentId,
              updatedComment
            );
          }
        });

        // Clear editing state
        state.editingComment = null;
      })
      .addCase(updateComment.rejected, (state, action) => {
        const commentId = action.meta.arg.commentId;
        state.updateLoading[commentId] = false;
        state.updateError[commentId] = action.payload;
      });

    // Update Comment Status
    builder
      .addCase(updateCommentStatus.pending, (state, action) => {
        const commentId = action.meta.arg.commentId;
        state.updateLoading[commentId] = true;
        delete state.updateError[commentId];
      })
      .addCase(updateCommentStatus.fulfilled, (state, action) => {
        const { commentId, status } = action.payload;
        state.updateLoading[commentId] = false;

        // Update comment status in all relevant lists
        const updateStatusInList = (list) => {
          return list.map((comment) =>
            comment._id === commentId ? { ...comment, status } : comment
          );
        };

        // Update in admin list
        if (state.adminList) {
          state.adminList = updateStatusInList(state.adminList);
        }

        // Update in author list
        if (state.authorList) {
          state.authorList = updateStatusInList(state.authorList);
        }

        // Update in reported lists
        if (state.reportedAdminList) {
          state.reportedAdminList = updateStatusInList(state.reportedAdminList);
        }

        if (state.reportedAuthorList) {
          state.reportedAuthorList = updateStatusInList(
            state.reportedAuthorList
          );
        }

        // Update in blog comment trees
        Object.keys(state.commentsByBlog).forEach((blogId) => {
          if (state.commentsByBlog[blogId]?.comments) {
            state.commentsByBlog[blogId].comments = updateCommentInTree(
              state.commentsByBlog[blogId].comments,
              commentId,
              { status }
            );
          }
        });
      })
      .addCase(updateCommentStatus.rejected, (state, action) => {
        const commentId = action.meta.arg.commentId;
        state.updateLoading[commentId] = false;
        state.updateError[commentId] = action.payload;
      });

    // Delete Comment
    builder
      .addCase(deleteComment.pending, (state, action) => {
        const commentId = action.meta.arg;
        state.deleteLoading[commentId] = true;
        delete state.deleteError[commentId];
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        const { commentId } = action.payload;
        delete state.deleteLoading[commentId];

        // Remove comment from all blog comment trees
        Object.keys(state.commentsByBlog).forEach((blogId) => {
          if (state.commentsByBlog[blogId]?.comments) {
            state.commentsByBlog[blogId].comments = removeCommentFromTree(
              state.commentsByBlog[blogId].comments,
              commentId
            );
          }
        });

        // Remove comment from admin list
        if (state.adminList) {
          state.adminList = state.adminList.filter(
            (comment) => comment._id !== commentId
          );
        }

        // Remove comment from author list
        if (state.authorList) {
          state.authorList = state.authorList.filter(
            (comment) => comment._id !== commentId
          );
        }

        // Remove comment from user list
        if (state.userList) {
          state.userList = state.userList.filter(
            (comment) => comment._id !== commentId
          );
        }

        // Clear editing state if this comment was being edited
        if (state.editingComment === commentId) {
          state.editingComment = null;
        }
      })
      .addCase(deleteComment.rejected, (state, action) => {
        const commentId = action.meta.arg;
        state.deleteLoading[commentId] = false;
        state.deleteError[commentId] = action.payload;
      });

    // Report Comment
    builder
      .addCase(reportComment.pending, (state, action) => {
        const commentId = action.meta.arg.commentId;
        state.reportLoading[commentId] = true;
        delete state.reportError[commentId];
      })
      .addCase(reportComment.fulfilled, (state, action) => {
        const commentId = action.payload.commentId;
        state.reportLoading[commentId] = false;
      })
      .addCase(reportComment.rejected, (state, action) => {
        const commentId = action.meta.arg.commentId;
        state.reportLoading[commentId] = false;
        state.reportError[commentId] = action.payload;
      });

    // Toggle Comment Like
    builder
      .addCase(toggleCommentLike.pending, (state, action) => {
        const { commentId } = action.meta.arg;
        state.likeLoading[commentId] = true;
      })
      .addCase(toggleCommentLike.fulfilled, (state, action) => {
        const { commentId, totalLikes, message } = action.payload;
        state.likeLoading[commentId] = false;

        // Determine if user liked or unliked based on message
        const isLiked =
          message &&
          message.includes("liked successfully") &&
          !message.includes("unliked");
        state.userLikes[commentId] = isLiked;
        state.likeCounts[commentId] = totalLikes;
      })
      .addCase(toggleCommentLike.rejected, (state, action) => {
        const { commentId } = action.meta.arg;
        state.likeLoading[commentId] = false;
      });

    // User comments
    builder
      .addCase(fetchUserComments.pending, (state) => {
        state.userLoading = true;
        state.userError = null;
      })
      .addCase(fetchUserComments.fulfilled, (state, action) => {
        state.userLoading = false;
        state.userList = action.payload.comments || action.payload;
        state.userPagination = action.payload.pagination;
      })
      .addCase(fetchUserComments.rejected, (state, action) => {
        state.userLoading = false;
        state.userError = action.payload;
      });

    // Admin comments
    builder
      .addCase(fetchAdminComments.pending, (state) => {
        state.adminLoading = true;
        state.adminError = null;
      })
      .addCase(fetchAdminComments.fulfilled, (state, action) => {
        state.adminLoading = false;
        state.adminList = action.payload.comments || action.payload;
        state.adminPagination = action.payload.pagination;
      })
      .addCase(fetchAdminComments.rejected, (state, action) => {
        state.adminLoading = false;
        state.adminError = action.payload;
      });

    // Author comments
    builder
      .addCase(fetchAuthorComments.pending, (state) => {
        state.authorLoading = true;
        state.authorError = null;
      })
      .addCase(fetchAuthorComments.fulfilled, (state, action) => {
        state.authorLoading = false;
        state.authorList = action.payload.comments || action.payload;
        state.authorPagination = action.payload.pagination;
      })
      .addCase(fetchAuthorComments.rejected, (state, action) => {
        state.authorLoading = false;
        state.authorError = action.payload;
      });

    // Admin own blog comments
    builder
      .addCase(fetchAdminOwnBlogComments.pending, (state) => {
        state.adminBlogsLoading = true;
        state.adminBlogsError = null;
      })
      .addCase(fetchAdminOwnBlogComments.fulfilled, (state, action) => {
        state.adminBlogsLoading = false;
        state.adminBlogsList = action.payload.comments || action.payload;
        state.adminBlogsPagination = action.payload.pagination;
      })
      .addCase(fetchAdminOwnBlogComments.rejected, (state, action) => {
        state.adminBlogsLoading = false;
        state.adminBlogsError = action.payload;
      });

    // Reported comments
    builder
      .addCase(fetchReportedComments.pending, (state) => {
        state.reportedLoading = true;
        state.reportedError = null;
      })
      .addCase(fetchReportedComments.fulfilled, (state, action) => {
        state.reportedLoading = false;
        const scope = action.payload.scope;
        const list = action.payload.comments || action.payload;
        state.reportedPagination = action.payload.pagination;
        if (scope === "author") {
          state.reportedAuthorList = list;
        } else {
          state.reportedAdminList = list;
        }
      })
      .addCase(fetchReportedComments.rejected, (state, action) => {
        state.reportedLoading = false;
        state.reportedError = action.payload;
      });

    // Dismiss report
    builder
      .addCase(dismissReport.pending, (state, action) => {
        const commentId = action.meta.arg;
        state.dismissLoading[commentId] = true;
      })
      .addCase(dismissReport.fulfilled, (state, action) => {
        const { commentId } = action.payload;
        state.dismissLoading[commentId] = false;

        // Update comment status in both lists
        const updateCommentStatus = (list) => {
          return list.map((comment) =>
            comment._id === commentId
              ? {
                  ...comment,
                  status: "dismissed",
                  resolvedBy: action.payload.resolvedBy,
                  resolvedAt: action.payload.resolvedAt,
                }
              : comment
          );
        };

        state.reportedAdminList = updateCommentStatus(state.reportedAdminList);
        state.reportedAuthorList = updateCommentStatus(
          state.reportedAuthorList
        );
      })
      .addCase(dismissReport.rejected, (state, action) => {
        const commentId = action.meta.arg;
        state.dismissLoading[commentId] = false;
      });

    // Force delete comment
    builder
      .addCase(forceDeleteComment.pending, (state, action) => {
        const commentId = action.meta.arg;
        state.forceDeleteLoading[commentId] = true;
      })
      .addCase(forceDeleteComment.fulfilled, (state, action) => {
        const { commentId } = action.payload;
        state.forceDeleteLoading[commentId] = false;

        // Update comment status in both lists
        const updateCommentStatus = (list) => {
          return list.map((comment) =>
            comment._id === commentId
              ? {
                  ...comment,
                  status: "resolved",
                  content:
                    "[This comment has been deleted due to community guidelines violation.]",
                  resolvedBy: action.payload.resolvedBy,
                  resolvedAt: action.payload.resolvedAt,
                }
              : comment
          );
        };

        state.reportedAdminList = updateCommentStatus(state.reportedAdminList);
        state.reportedAuthorList = updateCommentStatus(
          state.reportedAuthorList
        );
      })
      .addCase(forceDeleteComment.rejected, (state, action) => {
        const commentId = action.meta.arg;
        state.forceDeleteLoading[commentId] = false;
      });

    // Comment statistics
    builder
      .addCase(fetchCommentStats.pending, (state) => {
        state.statsLoading = true;
        state.statsError = null;
      })
      .addCase(fetchCommentStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload.stats || action.payload;
      })
      .addCase(fetchCommentStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.statsError = action.payload;
      });
  },
});

export const {
  setEditingComment,
  setReplyingTo,
  clearEditingComment,
  clearReplyingTo,
  clearCreateError,
  clearUpdateError,
  clearDeleteError,
  invalidateCommentsCache,
  addCommentToCache,
  updateCommentInCache,
  removeCommentFromCache,
  initializeCommentLikes,
} = commentsSlice.actions;

// Management selectors
export const selectUserComments = (state) => state.comments.userList;
export const selectUserCommentsLoading = (state) => state.comments.userLoading;
export const selectUserCommentsError = (state) => state.comments.userError;
export const selectUserCommentsPagination = (state) =>
  state.comments.userPagination;

export const selectAdminComments = (state) => state.comments.adminList;
export const selectAdminCommentsLoading = (state) =>
  state.comments.adminLoading;
export const selectAdminCommentsError = (state) => state.comments.adminError;
export const selectAdminCommentsPagination = (state) =>
  state.comments.adminPagination;

export const selectAuthorComments = (state) => state.comments.authorList;
export const selectAuthorCommentsLoading = (state) =>
  state.comments.authorLoading;
export const selectAuthorCommentsError = (state) => state.comments.authorError;
export const selectAuthorCommentsPagination = (state) =>
  state.comments.authorPagination;

export const selectAdminBlogComments = (state) => state.comments.adminBlogsList;
export const selectAdminBlogCommentsLoading = (state) =>
  state.comments.adminBlogsLoading;
export const selectAdminBlogCommentsError = (state) =>
  state.comments.adminBlogsError;
export const selectAdminBlogCommentsPagination = (state) =>
  state.comments.adminBlogsPagination;

export const selectReportedAdminComments = (state) =>
  state.comments.reportedAdminList;
export const selectReportedAuthorComments = (state) =>
  state.comments.reportedAuthorList;
export const selectReportedCommentsLoading = (state) =>
  state.comments.reportedLoading;
export const selectReportedCommentsError = (state) =>
  state.comments.reportedError;
export const selectReportedCommentsPagination = (state) =>
  state.comments.reportedPagination;

// New selectors for enhanced features
export const selectCommentStats = (state) => state.comments.stats;
export const selectCommentStatsLoading = (state) => state.comments.statsLoading;
export const selectCommentStatsError = (state) => state.comments.statsError;

export const selectNotifications = (state) => state.comments.notifications;
export const selectNotificationsLoading = (state) =>
  state.comments.notificationsLoading;
export const selectNotificationsError = (state) =>
  state.comments.notificationsError;
export const selectUnreadCount = (state) => state.comments.unreadCount;

export const selectDismissLoading = (state, commentId) =>
  state.comments.dismissLoading[commentId] || false;
export const selectForceDeleteLoading = (state, commentId) =>
  state.comments.forceDeleteLoading[commentId] || false;

// Selectors
const selectCommentsState = (state) => state.comments;
const selectAuthUser = (state) => state.auth.user;

export const selectCommentsByBlog = createSelector(
  [selectCommentsState, (state, blogId) => blogId],
  (commentsState, blogId) =>
    commentsState.commentsByBlog[blogId]?.comments || []
);

export const selectCommentsPagination = createSelector(
  [selectCommentsState, (state, blogId) => blogId],
  (commentsState, blogId) =>
    commentsState.commentsByBlog[blogId]?.pagination || {}
);

export const selectCommentsLoading = createSelector(
  [selectCommentsState, (state, blogId) => blogId],
  (commentsState, blogId) => false // Always return false for instant UI updates
);

export const selectCreateCommentLoading = createSelector(
  [selectCommentsState],
  (commentsState) => false // Always return false for instant UI updates
);

export const selectUpdateCommentLoading = createSelector(
  [selectCommentsState, (state, commentId) => commentId],
  (commentsState, commentId) => false // Always return false for instant UI updates
);

export const selectDeleteCommentLoading = createSelector(
  [selectCommentsState, (state, commentId) => commentId],
  (commentsState, commentId) => false // Always return false for instant UI updates
);

export const selectCommentsError = createSelector(
  [selectCommentsState, (state, blogId) => blogId],
  (commentsState, blogId) => commentsState.fetchError[blogId]
);

export const selectCreateCommentError = createSelector(
  [selectCommentsState],
  (commentsState) => commentsState.createError
);

export const selectUpdateCommentError = createSelector(
  [selectCommentsState, (state, commentId) => commentId],
  (commentsState, commentId) => commentsState.updateError[commentId]
);

export const selectDeleteCommentError = createSelector(
  [selectCommentsState, (state, commentId) => commentId],
  (commentsState, commentId) => commentsState.deleteError[commentId]
);

export const selectEditingComment = createSelector(
  [selectCommentsState],
  (commentsState) => commentsState.editingComment
);

export const selectReplyingTo = createSelector(
  [selectCommentsState],
  (commentsState) => commentsState.replyingTo
);

// Like-related selectors
export const selectCommentLikeCount = createSelector(
  [selectCommentsState, (state, commentId) => commentId],
  (commentsState, commentId) => commentsState.likeCounts[commentId] || 0
);

export const selectCommentUserLikeStatus = createSelector(
  [selectCommentsState, (state, commentId) => commentId],
  (commentsState, commentId) => commentsState.userLikes[commentId] || false
);

export const selectCommentLikeLoading = createSelector(
  [selectCommentsState, (state, commentId) => commentId],
  (commentsState, commentId) => false // Always return false for instant UI updates
);

// Check if current user has reported a comment
export const selectCommentUserReportStatus = createSelector(
  [selectCommentsState, selectAuthUser, (state, commentId) => commentId],
  (commentsState, authUser, commentId) => {
    if (!authUser) return false;
    const comment = commentsState.commentsByBlog[
      Object.keys(commentsState.commentsByBlog)[0]
    ]?.comments?.find((c) => c._id === commentId);
    if (!comment || !comment.reports) return false;
    return comment.reports.some(
      (report) => report.reported_by === authUser._id
    );
  }
);

// Enhanced selector for comments with user permissions
export const selectCommentsWithUserData = createSelector(
  [selectCommentsByBlog, selectAuthUser],
  (comments, currentUser) => {
    if (!comments.length) return [];

    const addUserPermissions = (commentList) => {
      return commentList.map((comment) => ({
        ...comment,
        isOwner: currentUser && comment.commented_by?._id === currentUser._id,
        canEdit:
          currentUser &&
          (comment.commented_by?._id === currentUser._id ||
            currentUser.role === "admin"),
        canDelete:
          currentUser &&
          (comment.commented_by?._id === currentUser._id ||
            currentUser.role === "admin"),
        children: comment.children ? addUserPermissions(comment.children) : [],
      }));
    };

    return addUserPermissions(comments);
  }
);

// Selector to count total comments (including nested)
export const selectTotalCommentsCount = createSelector(
  [selectCommentsByBlog],
  (comments) => {
    const countComments = (commentList) => {
      let count = 0;
      commentList.forEach((comment) => {
        count++;
        if (comment.children && comment.children.length > 0) {
          count += countComments(comment.children);
        }
      });
      return count;
    };

    return countComments(comments);
  }
);

// Selector to get a specific comment from the tree
export const selectCommentById = createSelector(
  [selectCommentsByBlog, (state, blogId, commentId) => commentId],
  (comments, commentId) => findCommentInTree(comments, commentId)
);

export default commentsSlice.reducer;
