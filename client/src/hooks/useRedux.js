import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import { createBlog } from "../features/blog/blogSlice";
import { toggleBlogLike } from "../features/like/likesSlice";
import {
  fetchBlogComments,
  createComment as createCommentAction,
  updateComment as updateCommentAction,
  deleteComment as deleteCommentAction,
  toggleCommentLike,
} from "../features/comment/commentsSlice";

export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

// Blog hooks
export const useBlog = () => {
  const dispatch = useAppDispatch();
  const blog = useAppSelector((state) => state.blog);

  const createBlogWithOptimism = useCallback(
    async (blogData) => {
      return dispatch(createBlog(blogData));
    },
    [dispatch]
  );

  return {
    ...blog,
    dispatch,
    createBlogWithOptimism,
  };
};

// Comment hooks
export const useComments = (blogId) => {
  const dispatch = useAppDispatch();
  const comments = useAppSelector(
    (state) => state.comments.commentsByBlog[blogId] || []
  );
  const loading = useAppSelector(
    (state) => state.comments.fetchLoading[blogId] || false
  );
  const error = useAppSelector((state) => state.comments.fetchError[blogId]);
  const createLoading = useAppSelector((state) => state.comments.createLoading);
  const editingComment = useAppSelector(
    (state) => state.comments.editingComment
  );
  const replyingTo = useAppSelector((state) => state.comments.replyingTo);

  const fetchComments = useCallback(() => {
    if (blogId) {
      dispatch(fetchBlogComments(blogId));
    }
  }, [dispatch, blogId]);

  const createComment = useCallback(
    async (commentData) => {
      return dispatch(createCommentAction(commentData));
    },
    [dispatch]
  );

  const updateComment = useCallback(
    async (updateData) => {
      return dispatch(updateCommentAction(updateData));
    },
    [dispatch]
  );

  const deleteComment = useCallback(
    async (commentId) => {
      return dispatch(deleteCommentAction(commentId));
    },
    [dispatch]
  );

  const setEditing = useCallback(() => {
    // TODO: Implement setEditingComment action
  }, []);

  const setReplying = useCallback(() => {
    // TODO: Implement setReplyingTo action
  }, []);

  const clearEditing = useCallback(() => {
    // TODO: Implement clearEditingComment action
  }, []);

  const clearReplying = useCallback(() => {
    // TODO: Implement clearReplyingTo action
  }, []);

  return {
    comments,
    loading,
    error,
    createLoading,
    editingComment,
    replyingTo,
    dispatch,
    // Actions
    fetchComments,
    createComment,
    updateComment,
    deleteComment,
    setEditing,
    setReplying,
    clearEditing,
    clearReplying,
  };
};

// Category hooks
export const useCategories = () => {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.categories);

  return {
    ...categories,
    dispatch,
  };
};

// Like hooks
export const useLikes = () => {
  const dispatch = useAppDispatch();
  const likes = useAppSelector((state) => state.likes);

  const toggleLike = useCallback(
    async (itemId, itemType) => {
      if (itemType === "blog") {
        return dispatch(toggleBlogLike(itemId));
      }
      // Comment likes are now handled in the comment slice
    },
    [dispatch]
  );

  const getLikeInfo = useCallback(
    (itemId, itemType) => {
      if (itemType === "blog") {
        const key = `blog_${itemId}`;
        return {
          count: likes.likeCounts[key] || 0,
          isLiked: likes.userLikes[key] || false,
          loading: likes.toggleLoading[key] || false,
        };
      }
      // Comment like info is now handled in the comment slice
      return {
        count: 0,
        isLiked: false,
        loading: false,
      };
    },
    [likes]
  );

  return {
    ...likes,
    dispatch,
    toggleLike,
    getLikeInfo,
  };
};

// User hooks
export const useUser = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user);

  return {
    ...user,
    dispatch,
  };
};

// Blog with likes hooks
export const useBlogWithLikes = (blogId) => {
  const { getLikeInfo, toggleLike } = useLikes();
  const blog = useAppSelector(
    (state) =>
      state.blog.allBlogs.find((b) => b._id === blogId) ||
      state.blog.myBlogs.find((b) => b._id === blogId) ||
      state.blog.currentBlog
  );

  const likeInfo = blogId ? getLikeInfo(blogId, "blog") : null;

  const handleToggleLike = useCallback(() => {
    if (blogId) {
      toggleLike(blogId, "blog");
    }
  }, [blogId, toggleLike]);

  return {
    blog,
    likeInfo,
    toggleLike: handleToggleLike,
  };
};

// Comment with likes hooks
export const useCommentWithLikes = (commentId) => {
  const dispatch = useAppDispatch();

  // Use comment slice selectors for comment likes
  const likeCount = useAppSelector((state) =>
    commentId ? state.comments.likeCounts[commentId] || 0 : 0
  );
  const isLiked = useAppSelector((state) =>
    commentId ? state.comments.userLikes[commentId] || false : false
  );
  const likeLoading = useAppSelector((state) =>
    commentId ? state.comments.likeLoading[commentId] || false : false
  );

  const handleToggleLike = useCallback(() => {
    if (commentId) {
      dispatch(toggleCommentLike({ commentId }));
    }
  }, [commentId, dispatch]);

  return {
    likeInfo: {
      count: likeCount,
      isLiked,
      loading: likeLoading,
    },
    toggleLike: handleToggleLike,
  };
};
