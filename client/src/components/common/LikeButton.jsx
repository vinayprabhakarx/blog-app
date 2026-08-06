import React, { memo } from "react";
import { Heart } from "lucide-react";

/**
 * Memoized LikeButton component to prevent unnecessary re-renders
 */
const LikeButton = memo(
  ({ count, isLiked, isToggling, isDisabled, onLike }) => {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onLike();
        }}
        disabled={isDisabled}
        aria-label={`${isLiked ? 'Unlike' : 'Like'} this post, ${count} ${count === 1 ? 'like' : 'likes'}`}
        aria-pressed={isLiked}
        className={`flex items-center gap-2 shrink-0 whitespace-nowrap transition-colors ${
          isDisabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:text-red-500 cursor-pointer"
        }`}
      >
        <Heart
          aria-hidden="true"
          className={`w-4 h-4 sm:w-5 sm:h-5 ${
            isLiked ? "fill-red-500 text-red-500" : ""
          }`}
        />
        <span>{count}</span>
        {isToggling && <span className="text-xs" aria-live="polite">...</span>}
      </button>
    );
  }
);

LikeButton.displayName = "LikeButton";

export default LikeButton;
