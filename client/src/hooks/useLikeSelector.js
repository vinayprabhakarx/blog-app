import { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  selectLikeCount,
  selectUserLikeStatus,
  selectToggleLoading,
} from "@/features/like/likesSlice";

export const useLikeSelector = (itemId, itemType) => {
  // Memoize the selectors with stable references
  const likeCount = useSelector(
    useMemo(
      () => (state) => selectLikeCount(state, itemId, itemType),
      [itemId, itemType]
    )
  );

  const isLiked = useSelector(
    useMemo(
      () => (state) => selectUserLikeStatus(state, itemId, itemType),
      [itemId, itemType]
    )
  );

  const isToggling = useSelector(
    useMemo(
      () => (state) => selectToggleLoading(state, itemId, itemType),
      [itemId, itemType]
    )
  );

  // Return memoized state object
  return useMemo(
    () => ({
      count: likeCount,
      isLiked,
      isToggling,
    }),
    [likeCount, isLiked, isToggling]
  );
};

export default useLikeSelector;
