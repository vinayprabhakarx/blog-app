import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleBlogLike,
  toggleBlogLikeFrontend,
} from "@/features/like/likesSlice";
import { refreshNotificationsAfterAction } from "@/utils/notificationRefresh";
import useLikeSelector from "./useLikeSelector";

export const useBlogLike = (blogId) => {
  const dispatch = useDispatch();

  // Use optimized like selector only if blogId exists
  const likeState = useLikeSelector(blogId, "blog");

  const { user } = useSelector((state) => state.auth);

  // Memoize user state to prevent unnecessary re-renders
  const userState = useMemo(
    () => ({
      exists: Boolean(user),
      id: user?._id || user?.id,
    }),
    [user]
  );

  // Memoize like handler with stable dependencies
  const handleLike = useCallback(async () => {
    if (!userState.exists) {
      alert("Please log in to like this blog");
      return;
    }

    if (!blogId) return;

    // Optimistic update
    dispatch(toggleBlogLikeFrontend({ blogId }));

    try {
      await dispatch(
        toggleBlogLike({
          blogId,
        })
      ).unwrap();

      // Refresh notifications after successful like
      refreshNotificationsAfterAction("like");
    } catch (error) {
      // Revert optimistic update on error
      dispatch(toggleBlogLikeFrontend({ blogId }));
      console.error("Failed to toggle like:", error);
    }
  }, [userState.exists, blogId, dispatch]);

  // Memoize final state object to prevent new object creation
  return useMemo(
    () => ({
      ...likeState,
      isDisabled: !userState.exists || likeState.isToggling,
      canLike: Boolean(userState.exists && blogId),
      handleLike,
    }),
    [likeState, userState.exists, blogId, handleLike]
  );
};

export default useBlogLike;
