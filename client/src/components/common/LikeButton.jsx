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
        className={`flex items-center gap-2 flex-shrink-0 whitespace-nowrap transition-colors ${
          isDisabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:text-red-500 cursor-pointer"
        }`}
      >
        <Heart
          className={`w-4 h-4 sm:w-5 sm:h-5 ${
            isLiked ? "fill-red-500 text-red-500" : ""
          }`}
        />
        <span>{count}</span>
        {isToggling && <span className="text-xs">...</span>}
      </button>
    );
  }
);

LikeButton.displayName = "LikeButton";

export default LikeButton;
