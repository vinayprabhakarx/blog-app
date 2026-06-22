import { useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import {
  invalidateCommentsCache,
  addCommentToCache,
  updateCommentInCache,
  removeCommentFromCache,
} from "@/features/comment/commentsSlice";
import { setLikeData } from "@/features/like/likesSlice";

// Hook for cross-feature data synchronization and cache management
export const useDataSync = () => {
  const dispatch = useDispatch();

  // Sync like data across features
  const syncCommentLikes = useCallback(
    (commentId, likeCount, isLiked) => {
      dispatch(
        setLikeData({
          items: [
            {
              id: commentId,
              type: "comment",
              count: likeCount,
              isLiked,
            },
          ],
        })
      );
    },
    [dispatch]
  );

  const syncBlogLikes = useCallback(
    (blogId, likeCount, isLiked) => {
      dispatch(
        setLikeData({
          items: [
            {
              id: blogId,
              type: "blog",
              count: likeCount,
              isLiked,
            },
          ],
        })
      );
    },
    [dispatch]
  );

  // Cache management functions
  const invalidateCache = useCallback(
    (type, id = null) => {
      switch (type) {
        case "comments":
          dispatch(invalidateCommentsCache(id));
          break;
        default:
          console.warn(`Unknown cache type: ${type}`);
      }
    },
    [dispatch]
  );

  // Real-time update handlers
  const handleCommentUpdate = useCallback(
    (action, data) => {
      switch (action) {
        case "create":
          dispatch(
            addCommentToCache({
              blogId: data.blog_id,
              comment: data,
            })
          );
          break;
        case "update":
          dispatch(
            updateCommentInCache({
              blogId: data.blog_id,
              comment: data,
            })
          );
          break;
        case "delete":
          dispatch(
            removeCommentFromCache({
              blogId: data.blog_id,
              commentId: data.commentId,
            })
          );
          break;
        default:
          console.warn(`Unknown comment action: ${action}`);
      }
    },
    [dispatch]
  );

  // Data consistency checker
  const checkDataConsistency = useCallback(async (type) => {
    switch (type) {
      case "blog":
        break;
      case "comment":
        break;
      default:
        break;
    }
  }, []);

  return {
    syncCommentLikes,
    syncBlogLikes,
    invalidateCache,
    handleCommentUpdate,
    checkDataConsistency,
  };
};

// Hook for automatic data synchronization based on user actions
export const useAutoSync = (options = {}) => {
  const {
    syncOnFocus = true,
    syncInterval = null,
    syncOnVisibilityChange = true,
  } = options;

  const { invalidateCache } = useDataSync();

  useEffect(() => {
    let intervalId;

    // Sync on window focus
    const handleFocus = () => {
      if (syncOnFocus) {
        // Invalidate stale cache on focus
        invalidateCache("comments");
      }
    };

    // Sync on visibility change
    const handleVisibilityChange = () => {
      if (syncOnVisibilityChange && !document.hidden) {
        invalidateCache("comments");
      }
    };

    // Set up event listeners
    if (syncOnFocus) {
      window.addEventListener("focus", handleFocus);
    }

    if (syncOnVisibilityChange) {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    // Set up sync interval
    if (syncInterval) {
      intervalId = setInterval(() => {
        invalidateCache("comments");
      }, syncInterval);
    }

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [syncOnFocus, syncInterval, syncOnVisibilityChange, invalidateCache]);
};

// Hook for managing optimistic updates with error handling and data consistency
export const useOptimisticUpdates = () => {
  const dispatch = useDispatch();

  const performOptimisticUpdate = useCallback(
    async (optimisticAction, asyncAction, revertAction, data) => {
      try {
        // Perform optimistic update
        dispatch(optimisticAction(data));

        // Perform actual async action
        const result = await dispatch(asyncAction(data)).unwrap();

        return result;
      } catch (error) {
        // Revert optimistic update on error
        if (revertAction) {
          dispatch(revertAction(data));
        }
        throw error;
      }
    },
    [dispatch]
  );

  return { performOptimisticUpdate };
};

export default useDataSync;
