import React, { useState, useCallback, useMemo } from "react";
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
  selectCommentLikeCount,
  selectCommentUserLikeStatus,
  selectCommentUserReportStatus,
  toggleCommentLike,
  setEditingComment,
  setReplyingTo,
  deleteComment,
} from "./commentsSlice";

const Comment = React.memo(
  ({
    comment,
    blogId,
    categoryId = "uncategorized",
    level = 0,
    maxLevel = 2,
    instagramStyle = true,
  }) => {
    const dispatch = useDispatch();
    const currentUser = useSelector((state) => state.auth.user);

    // Memoize comment data for stable references
    const commentData = useMemo(
      () => ({
        id: comment._id,
        content: comment.content,
        commentedAt: comment.commented_at,
        taggedUsers: comment.tagged_users || [],
        commentedBy: comment.commented_by,
        children: comment.children || [],
        blogId: comment.blog_id,
        reports: comment.reports || [],
      }),
      [comment]
    );

    // Memoize permissions
    const permissions = useMemo(() => {
      const canEdit =
        currentUser &&
        commentData.commentedBy &&
        commentData.commentedBy._id === currentUser._id;

      const canDelete =
        currentUser &&
        commentData.commentedBy &&
        (commentData.commentedBy._id === currentUser._id ||
          currentUser.role === "admin" ||
          (currentUser.role === "author" &&
            commentData.blogId?.author === currentUser._id));

      return { canEdit, canDelete };
    }, [currentUser, commentData.commentedBy, commentData.blogId]);

    // Render comment content with clickable @mentions
    const renderCommentContent = (content, taggedUsers = []) => {
      if (!content) return "";

      const parts = content.split(/(@\w+)/g);

      return parts.map((part, index) => {
        if (part.startsWith("@")) {
          const username = part.slice(1);
          const taggedUser = taggedUsers.find(
            (tag) => tag.user_id?.personal_info?.username === username
          );

          if (taggedUser) {
            return (
              <Link
                key={`mention-${username}-${index}`}
                to={`/profile/${username}`}
                className="text-primary hover:underline font-medium"
              >
                {part}
              </Link>
            );
          }
        }
        return <span key={`text-${index}-${part.slice(0, 10)}`}>{part}</span>;
      });
    };

    const getTaggedUsersDisplay = () => {
      if (!comment.tagged_users || comment.tagged_users.length === 0)
        return null;

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
    const isLiked = useSelector((state) =>
      selectCommentUserLikeStatus(state, comment._id)
    );
    const likeCount = useSelector((state) =>
      selectCommentLikeCount(state, comment._id)
    );
    const hasReported = useSelector((state) =>
      selectCommentUserReportStatus(state, comment._id)
    );

    const [showReportDialog, setShowReportDialog] = useState(false);
    const [showReplies, setShowReplies] = useState(false);

    // Memoize computed state values
    const computedState = useMemo(
      () => ({
        isEditing: editingComment === commentData.id,
        isReplying: replyingTo === commentData.id,
        hasReplies: commentData.children.length > 0,
      }),
      [editingComment, replyingTo, commentData.id, commentData.children.length]
    );

    // Memoize utility functions
    const getInitials = useCallback((name) => {
      return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }, []);

    const formatTimeAgo = useCallback((date) => {
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
    }, []);

    const getIndentClass = useCallback((level) => {
      return level > 0 ? "ml-6 sm:ml-8 md:ml-10" : "";
    }, []);

    // Memoize event handlers
    const handleLike = useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUser) return;
        dispatch(
          toggleCommentLike({
            commentId: commentData.id,
          })
        );
        refreshNotificationsAfterAction();
      },
      [currentUser, dispatch, commentData.id]
    );

    const handleReply = useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (computedState.isReplying) {
          dispatch(setReplyingTo(null));
        } else {
          dispatch(setReplyingTo(commentData.id));
        }
      },
      [dispatch, computedState.isReplying, commentData.id]
    );

    const handleEdit = useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch(setEditingComment(commentData.id));
      },
      [dispatch, commentData.id]
    );

    const handleDelete = useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch(deleteComment(commentData.id));
      },
      [dispatch, commentData.id]
    );

    const handleReport = useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (hasReported) return;
        setShowReportDialog(true);
      },
      [hasReported]
    );

    const handleShowReplies = useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      setShowReplies((prev) => !prev);
    }, []);

    return (
      <article className={cn("group relative", getIndentClass(level))}>
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
            {computedState.isEditing ? (
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
                    {!computedState.isEditing && (
                      <div className="flex-shrink-0 flex items-center">
                        <button
                          type="button"
                          onClick={handleLike}
                          disabled={!currentUser}
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
                    {renderCommentContent(
                      comment.content,
                      comment.tagged_users
                    )}
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
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-warning/10 text-warning rounded-full">
                      <Flag className="h-3 w-3" />
                      Reported
                    </span>
                  )}

                  {/* Report Count for Admins/Authors */}
                  {(currentUser?.role === "admin" ||
                    currentUser?.role === "author") &&
                    comment.reports &&
                    comment.reports.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-destructive/10 text-destructive rounded-full">
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
                        type="button"
                        onClick={handleReply}
                        className={cn(
                          "font-medium transition-colors hover:text-foreground cursor-pointer",
                          computedState.isReplying && "text-foreground"
                        )}
                      >
                        Reply
                      </button>
                    )}

                  {/* More Actions */}
                  {currentUser && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="p-1 rounded-full hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        {/* Edit option - only for comment owner */}
                        {permissions.canEdit && (
                          <DropdownMenuItem
                            onClick={handleEdit}
                            className="cursor-pointer text-sm"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}

                        {/* Delete option - for comment owner or admin */}
                        {permissions.canDelete && (
                          <DropdownMenuItem
                            onClick={handleDelete}
                            className="cursor-pointer text-destructive focus:text-destructive text-sm"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}

                        {/* Report option - only for users who can't delete */}
                        {!permissions.canDelete && (
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
            {computedState.isReplying && (
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
        {computedState.hasReplies && (
          <div className="ml-8 mt-2">
            <button
              type="button"
              onClick={handleShowReplies}
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
        {computedState.hasReplies && showReplies && (
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
      </article>
    );
  }
);

export default Comment;
