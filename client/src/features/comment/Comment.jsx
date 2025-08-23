import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Flag,
  Edit,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { refreshNotificationsAfterAction } from "../../utils/notificationRefresh";

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

import CommentForm from "./CommentForm";
import ReportDialog from "./ReportDialog";
import {
  selectEditingComment,
  selectReplyingTo,
  selectDeleteCommentLoading,
  selectCommentLikeCount,
  selectCommentUserLikeStatus,
  selectCommentLikeLoading,
  selectCommentUserReportStatus,
  toggleCommentLike,
  setEditingComment,
  setReplyingTo,
  deleteComment,
} from "./commentsSlice";

const Comment = ({
  comment,
  blogId,
  categoryId = "uncategorized",
  level = 0,
  maxLevel = 2,
  instagramStyle = true,
}) => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);

  // Render comment content with clickable @mentions
  const renderCommentContent = (content, taggedUsers = []) => {
    if (!content) return "";

    const parts = content.split(/(@\w+)/g);

    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        const username = part.substring(1);
        const taggedUser = taggedUsers.find(
          (tag) =>
            tag.username === username ||
            tag.user_id?.personal_info?.username === username
        );

        if (taggedUser) {
          return (
            <Link
              key={index}
              to={`/profile/${username}`}
              className="text-primary hover:underline font-medium"
            >
              {part}
            </Link>
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  const getTaggedUsersDisplay = () => {
    if (!comment.tagged_users || comment.tagged_users.length === 0) return null;

    return (
      <div className="text-xs text-muted-foreground mt-1">
        Replying to{" "}
        {comment.tagged_users.map((tag, index) => (
          <span key={tag.user_id?._id || index}>
            <Link
              to={`/${tag.username}`}
              className="text-primary hover:underline"
            >
              @{tag.username}
            </Link>
            {index < comment.tagged_users.length - 1 && ", "}
          </span>
        ))}
      </div>
    );
  };
  const editingComment = useSelector(selectEditingComment);
  const replyingTo = useSelector(selectReplyingTo);
  const deleteLoading = useSelector((state) =>
    selectDeleteCommentLoading(state, comment._id)
  );
  const isLiked = useSelector((state) =>
    selectCommentUserLikeStatus(state, comment._id)
  );
  const likeCount = useSelector((state) =>
    selectCommentLikeCount(state, comment._id)
  );
  const likeLoading = useSelector((state) =>
    selectCommentLikeLoading(state, comment._id)
  );
  const hasReported = useSelector((state) =>
    selectCommentUserReportStatus(state, comment._id)
  );

  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const isEditing = editingComment === comment._id;
  const isReplying = replyingTo === comment._id;
  // Edit permissions: Only comment owner can edit their own comments
  const canEdit =
    currentUser &&
    comment.commented_by &&
    comment.commented_by._id === currentUser._id;

  // Delete permissions: More complex based on role and context
  const canDelete =
    currentUser &&
    comment.commented_by &&
    (comment.commented_by._id === currentUser._id || // Own comment
      currentUser.role === "admin" || // Admin can delete any comment
      (currentUser.role === "author" &&
        comment.blog_id?.author === currentUser._id)); // Author can delete comments on their own blogs
  const hasReplies = comment.children && comment.children.length > 0;

  const handleLike = () => {
    if (!currentUser) return;
    dispatch(
      toggleCommentLike({
        commentId: comment._id,
      })
    );
    // Refresh notifications after like action
    refreshNotificationsAfterAction();
  };

  const handleReply = () => {
    if (isReplying) {
      dispatch(setReplyingTo(null));
    } else {
      dispatch(setReplyingTo(comment._id));
    }
  };

  const handleEdit = () => {
    dispatch(setEditingComment(comment._id));
  };

  const handleDelete = () => {
    dispatch(deleteComment(comment._id));
  };

  const handleReport = () => {
    if (hasReported) return;
    setShowReportDialog(true);
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimeAgo = (date) => {
    if (!date || isNaN(new Date(date))) return "now";

    const timeAgo = formatDistanceToNow(new Date(date), { addSuffix: true });
    return timeAgo
      .replace("about ", "")
      .replace(" ago", "")
      .replace("minute", "m")
      .replace("minutes", "m")
      .replace("hour", "h")
      .replace("hours", "h")
      .replace("day", "d")
      .replace("days", "d")
      .replace("week", "w")
      .replace("weeks", "w")
      .replace("month", "mo")
      .replace("months", "mo")
      .replace("year", "y")
      .replace("years", "y");
  };

  // Instagram-style minimal indentation
  const getIndentClass = (level) => {
    return level > 0 ? "ml-6 sm:ml-8 md:ml-10" : "";
  };

  return (
    <div className={cn("group relative", getIndentClass(level))}>
      {/* Vertical line for replies - Instagram style */}
      {level > 0 && (
        <div className="absolute left-[-12px] sm:left-[-16px] md:left-[-20px] top-0 bottom-0 w-px bg-border/40" />
      )}

      {/* Main Comment Container */}
      <div className="flex items-start gap-3 py-2">
        {/* Avatar - Clickable to go to user profile */}
        {comment.commented_by?.personal_info?.username ? (
          <Link
            to={`/${comment.commented_by.personal_info.username}`}
            className="flex-shrink-0"
          >
            <Avatar className="h-8 w-8 ring-1 ring-transparent transition-all duration-200 hover:ring-border/50 cursor-pointer">
              <AvatarImage
                src={comment.commented_by?.personal_info?.profile_img}
                alt={
                  comment.commented_by?.personal_info?.name ||
                  comment.commented_by?.personal_info?.username ||
                  "User"
                }
              />
              <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-muted to-muted/50 text-foreground">
                {getInitials(
                  comment.commented_by?.personal_info?.name ||
                    comment.commented_by?.personal_info?.username ||
                    "User"
                )}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Avatar className="h-8 w-8 flex-shrink-0 ring-1 ring-transparent transition-all duration-200 hover:ring-border/50">
            <AvatarImage
              src={comment.commented_by?.personal_info?.profile_img}
              alt={
                comment.commented_by?.personal_info?.name ||
                comment.commented_by?.personal_info?.username ||
                "User"
              }
            />
            <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-muted to-muted/50 text-foreground">
              {getInitials(
                comment.commented_by?.personal_info?.name ||
                  comment.commented_by?.personal_info?.username ||
                  "User"
              )}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Content Container */}
        <div className="flex-1 min-w-0 w-full">
          {isEditing ? (
            /* Edit Mode */
            <div className="space-y-2">
              <CommentForm
                initialContent={comment.content}
                commentId={comment._id}
                mode="edit"
                placeholder="Edit your comment..."
                onCancel={() => dispatch(setEditingComment(null))}
                onSuccess={() => dispatch(setEditingComment(null))}
              />
            </div>
          ) : (
            /* Display Mode */
            <div className="space-y-2">
              {/* Username and Content - Instagram style */}
              <div className="space-y-1 w-full">
                {/* Username and Like Button on same line */}
                <div className="w-full flex items-center justify-between">
                  <div>
                    {comment.commented_by?.personal_info?.username ? (
                      <Link
                        to={`/${comment.commented_by.personal_info.username}`}
                        className="font-semibold text-foreground cursor-pointer hover:text-foreground/80 transition-colors"
                      >
                        {comment.commented_by.personal_info.username}
                      </Link>
                    ) : (
                      <span className="font-semibold text-foreground">
                        {comment.commented_by?.personal_info?.name ||
                          comment.commented_by?.personal_info?.username ||
                          "User"}
                      </span>
                    )}
                  </div>

                  {/* Like Button - positioned on username line */}
                  {!isEditing && (
                    <div className="flex-shrink-0 flex items-center">
                      <button
                        onClick={handleLike}
                        disabled={!currentUser || likeLoading}
                        className={cn(
                          "p-1.5 rounded-full transition-all duration-200 hover:bg-muted/50 cursor-pointer",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                          !currentUser && "cursor-not-allowed opacity-50"
                        )}
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4 transition-all duration-200",
                            isLiked
                              ? "fill-destructive text-destructive scale-110"
                              : "text-muted-foreground hover:text-destructive hover:scale-110"
                          )}
                        />
                      </button>
                    </div>
                  )}
                </div>

                {/* Comment content on second line */}
                <div className="text-foreground break-words w-full">
                  {renderCommentContent(comment.content, comment.tagged_users)}
                </div>

                {/* Tagged users display */}
                {getTaggedUsersDisplay()}
              </div>

              {/* Action Bar - Instagram style */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {/* Timestamp */}
                <span className="font-medium">
                  {formatTimeAgo(comment.commented_at)}
                </span>

                {/* Reported Badge */}
                {hasReported && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                    <Flag className="h-3 w-3" />
                    Reported
                  </span>
                )}

                {/* Report Count for Admins/Authors */}
                {(currentUser?.role === "admin" ||
                  currentUser?.role === "author") &&
                  comment.reports &&
                  comment.reports.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                      <Flag className="h-3 w-3" />
                      {comment.reports.length}{" "}
                      {comment.reports.length === 1 ? "report" : "reports"}
                    </span>
                  )}

                {/* Like Count (if any) */}
                {likeCount > 0 && (
                  <span className="font-medium hover:text-foreground cursor-pointer transition-colors">
                    {likeCount} {likeCount === 1 ? "like" : "likes"}
                  </span>
                )}

                {/* Reply Button */}
                {(instagramStyle || (!instagramStyle && level < maxLevel)) &&
                  currentUser && (
                    <button
                      onClick={handleReply}
                      className={cn(
                        "font-medium transition-colors hover:text-foreground cursor-pointer",
                        isReplying && "text-foreground"
                      )}
                    >
                      Reply
                    </button>
                  )}

                {/* More Actions */}
                {currentUser && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded-full hover:bg-muted/50 transition-colors cursor-pointer">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      {/* Edit option - only for comment owner */}
                      {canEdit && (
                        <DropdownMenuItem
                          onClick={handleEdit}
                          className="cursor-pointer text-sm"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}

                      {/* Delete option - for comment owner or admin */}
                      {canDelete && (
                        <DropdownMenuItem
                          onClick={handleDelete}
                          className="cursor-pointer text-destructive focus:text-destructive text-sm"
                          disabled={deleteLoading}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deleteLoading ? "Deleting..." : "Delete"}
                        </DropdownMenuItem>
                      )}

                      {/* Report option - only for users who can't delete */}
                      {!canDelete && (
                        <DropdownMenuItem
                          onClick={handleReport}
                          disabled={hasReported}
                          className={cn(
                            "cursor-pointer text-sm",
                            hasReported
                              ? "text-muted-foreground cursor-not-allowed"
                              : "text-destructive focus:text-destructive"
                          )}
                        >
                          <Flag className="h-4 w-4 mr-2" />
                          {hasReported ? "Already Reported" : "Report"}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          )}

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-3 flex items-start gap-2">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage
                  src={currentUser?.personal_info?.profile_img}
                  alt={currentUser?.personal_info?.name}
                />
                <AvatarFallback className="text-xs bg-muted">
                  {getInitials(currentUser?.personal_info?.name || "You")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CommentForm
                  blogId={blogId}
                  parentId={comment._id}
                  mode="reply"
                  placeholder={`Reply to ${
                    comment.commented_by?.personal_info?.username ||
                    comment.commented_by?.personal_info?.name ||
                    "User"
                  }...`}
                  onCancel={() => dispatch(setReplyingTo(null))}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View/Hide Replies Toggle */}
      {hasReplies && (
        <div className="ml-8 mt-2">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
          >
            <div className="w-6 h-px bg-border group-hover:bg-muted-foreground/50 transition-colors" />
            <MessageCircle className="h-4 w-4" />
            <span className="font-medium">
              {showReplies ? "Hide" : "View"} {comment.children.length}{" "}
              {comment.children.length === 1 ? "reply" : "replies"}
            </span>
          </button>
        </div>
      )}

      {/* Instagram-style Replies */}
      {hasReplies && showReplies && (
        <div className="mt-2 space-y-1">
          {comment.children?.map((reply) => {
            if (!reply || !reply._id) {
              // Skip invalid reply
              return null;
            }

            if (instagramStyle) {
              // Instagram-style: render replies as simple flat list with no further nesting
              return (
                <div
                  key={reply._id}
                  className="ml-0 border-l-2 border-muted pl-3"
                >
                  <Comment
                    comment={reply}
                    blogId={blogId}
                    categoryId={categoryId}
                    level={1}
                    maxLevel={1} // Force single level
                    instagramStyle={true}
                  />
                </div>
              );
            } else {
              // Traditional nested style
              return (
                <Comment
                  key={reply._id}
                  comment={reply}
                  blogId={blogId}
                  categoryId={categoryId}
                  level={level + 1}
                  maxLevel={maxLevel}
                  instagramStyle={false}
                />
              );
            }
          })}
        </div>
      )}

      {/* Report Dialog */}
      <ReportDialog
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        commentId={comment._id}
        commentAuthor={
          comment.commented_by?.personal_info?.name ||
          comment.commented_by?.personal_info?.username ||
          "User"
        }
        hasReported={hasReported}
      />
    </div>
  );
};

export default Comment;
