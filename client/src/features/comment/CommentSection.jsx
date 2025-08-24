import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../components/ui/avatar";
// Removed LoadingSpinner for instant updates

import Comment from "./Comment";
import CommentForm from "./CommentForm";
import {
  fetchBlogComments,
  selectCommentsByBlog,
  selectCommentsError,
  selectTotalCommentsCount,
} from "./commentsSlice";

const CommentSection = ({
  blogId,
  categoryId = "uncategorized",
  showCreateForm = true,
  maxNestingLevel = 2,
  className = "",
}) => {
  const dispatch = useDispatch();
  const comments = useSelector((state) => selectCommentsByBlog(state, blogId));
  // Removed loading state for instant updates
  const error = useSelector((state) => selectCommentsError(state, blogId));
  const totalComments = useSelector((state) =>
    selectTotalCommentsCount(state, blogId)
  );
  const currentUser = useSelector((state) => state.auth.user);

  // Load comments immediately when component mounts, but only if not already cached
  useEffect(() => {
    if (blogId && comments.length === 0) {
      dispatch(fetchBlogComments({ blogId }));
    }
  }, [dispatch, blogId, comments.length]);

  const topLevelComments = comments.filter((comment) => !comment.parent);

  const getInitials = (name) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // No loading spinners - comments appear instantly

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Header */}
      <div className="border-b border-border/50 pb-4">
        <h3 className="text-xl font-semibold text-foreground">
          {totalComments === 0 ? "Comments" : `Comments (${totalComments})`}
        </h3>
      </div>

      {/* Create Comment Form - Instagram style */}
      {showCreateForm && currentUser && (
        <div className="flex items-start gap-3 pb-4 border-b border-border/30">
          <Avatar className="h-8 w-8 flex-shrink-0 ring-1 ring-transparent transition-all duration-200 hover:ring-border/50 cursor-pointer">
            <AvatarImage
              src={currentUser.personal_info?.profile_img}
              alt={currentUser.personal_info?.name}
            />
            <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-foreground">
              {getInitials(currentUser.personal_info?.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <CommentForm
              blogId={blogId}
              mode="create"
              placeholder="Add a comment..."
            />
          </div>
        </div>
      )}

      {/* Sign in prompt for non-logged users - only show when there are comments */}
      {showCreateForm && !currentUser && topLevelComments.length > 0 && (
        <div className="flex flex-col items-center py-2">
          <div className="h-10 w-10 flex-shrink-0 mb-2 ring-1 ring-transparent transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-center w-full h-full rounded-full bg-muted/50 dark:bg-muted/20">
              <Link to="/login">
                <MessageCircle className="h-6 w-6 text-foreground/70" />
              </Link>
            </div>
          </div>
          <div className="flex-1 min-w-0 text-center">
            <Link to="/login" className="block">
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="font-semibold text-foreground hover:text-foreground/80 transition-colors">
                    Join the conversation
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sign in to share your thoughts and engage with others
                </p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
            <p className="text-base text-red-600 dark:text-red-400">
              Failed to load comments: {error}
            </p>
          </div>
        </div>
      )}

      {/* Comments List - Instagram style */}
      {topLevelComments.length > 0 ? (
        <div className="space-y-1">
          {topLevelComments
            .filter((comment) => comment && comment._id)
            .map((comment, index) => (
              <Comment
                key={comment._id || `comment-${blogId}-${index}`}
                comment={comment}
                blogId={blogId}
                categoryId={categoryId}
                level={0}
                maxLevel={maxNestingLevel}
              />
            ))}
        </div>
      ) : (
        <div className="py-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 mb-3 rounded-full bg-muted/50 dark:bg-muted/20 flex items-center justify-center">
                <Link to="/login">
                  <MessageCircle className="h-6 w-6 text-foreground/70 cursor-pointer" />
                </Link>
              </div>
              <Link to="/login">
                <h3 className="text-lg font-semibold text-foreground mb-1.5">
                  Be the first to comment
                </h3>
              </Link>
              <Link to="/login">
                <p className="text-sm text-muted-foreground max-w-xs mb-4 leading-relaxed">
                  Start the conversation! Share your thoughts and connect with
                  others about this post.
                </p>
              </Link>
            </div>
          </div>
      )}
    </div>
  );
};

export default CommentSection;
