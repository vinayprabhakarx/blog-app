import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Bell,
  Trash2,
  Filter,
  RefreshCw,
} from "lucide-react";
import { PageStats } from "@/components/common/PageStats";

import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateDisplays";
import { FilterCard } from "@/components/common/FilterCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchNotifications,
  markNotificationRead,
  clearAllNotifications,
} from "./notificationsSlice";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import CommentForm from "@/features/comment/CommentForm";

const NotificationCenter = () => {
  const dispatch = useDispatch();
  const { notifications, loading, error } = useSelector(
    (state) => state.notifications
  );
  const { refreshNotifications } = useNotifications();

  const [filterStatus, setFilterStatus] = useState("all");
  const [pendingFilterStatus, setPendingFilterStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Enhanced filtering and sorting
  const filteredNotifications = notifications
    .filter((notification) => {
      // Filter by type
      if (filterStatus === "unread" && notification.is_read) return false;
      if (filterStatus === "reports" && notification.type !== "comment_report")
        return false;
      if (
        filterStatus === "comments" &&
        !["blog_comment", "comment_reply"].includes(notification.type)
      )
        return false;
      if (
        filterStatus === "likes" &&
        !["blog_like", "comment_like"].includes(notification.type)
      )
        return false;

      return true;
    })
    .sort((a, b) => {
      // Sort by priority first, then by newest date
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;

      if (aPriority !== bPriority) {
        return bPriority - aPriority; // High priority first
      }

      // Then sort by newest date
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const handleMarkAsRead = async (notificationId) => {
    try {
      await dispatch(markNotificationRead(notificationId)).unwrap();
      refreshNotifications();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshNotifications();
    } catch (error) {
      console.error("Failed to refresh:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getNotificationStats = () => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.is_read).length;
    const reports = notifications.filter(
      (n) => n.type === "comment_report"
    ).length;
    const comments = notifications.filter((n) =>
      ["blog_comment", "comment_reply"].includes(n.type)
    ).length;
    const likes = notifications.filter((n) =>
      ["blog_like", "comment_like"].includes(n.type)
    ).length;

    return { total, unread, reports, comments, likes };
  };

  const stats = getNotificationStats();

  if (loading) {
    return <LoadingState message="Loading notifications..." />;
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorState 
          title="Failed to Load Notifications" 
          message={error} 
        />
      </div>
    );
  }

  return (
    <section className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8" aria-label="Notifications">
      {/* Notification Center */}
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              Notification Center
            </h1>
            <PageStats
              stats={[
                { value: stats.total, label: "total" },
                { value: stats.unread, label: "unread" },
              ]}
            />
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-0 sm:px-4 w-10 sm:w-auto hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={cn("h-7 w-7 sm:h-4 sm:w-4", isRefreshing && "animate-spin")}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-0 sm:px-4 w-10 sm:w-auto hover:shadow-md transition-all duration-200 text-destructive hover:text-destructive border-destructive/20 hover:border-destructive/40 flex items-center justify-center gap-2"
                onClick={() => dispatch(clearAllNotifications())}
                disabled={loading}
              >
                <Trash2 className="h-7 w-7 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Clear All</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              disabled={notifications.length === 0}
              className="h-10 px-0 sm:px-4 w-10 sm:w-auto hover:shadow-md transition-all duration-200 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Filter className="w-7 h-7 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <FilterCard
          isOpen={showFilters}
          onClear={() => {
            setPendingFilterStatus("all");
            setFilterStatus("all");
          }}
          onApply={() => {
            setFilterStatus(pendingFilterStatus);
          }}
          className="mb-6"
        >
                  {/* Type */}
                  <Select value={pendingFilterStatus} onValueChange={setPendingFilterStatus}>
                    <SelectTrigger className="w-full h-10 sm:h-9 text-sm cursor-pointer">
                      <SelectValue placeholder="All Notifications" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Notifications</SelectItem>
                      <SelectItem value="unread">Unread ({stats.unread})</SelectItem>
                      <SelectItem value="reports">Reports ({stats.reports})</SelectItem>
                      <SelectItem value="comments">Comments ({stats.comments})</SelectItem>
                      <SelectItem value="likes">Likes ({stats.likes})</SelectItem>
                    </SelectContent>
                  </Select>
        </FilterCard>

        <div className="space-y-0">
            {filteredNotifications.length === 0 ? (
              <div className="py-8">
                <EmptyState 
                  variant="compact"
                  icon={Bell} 
                  title="No notifications yet" 
                  description="When you get notifications, they'll show up here. Check back later for updates."
                />
              </div>
            ) : (
              <div className="bg-background border border-border/20 rounded-xl overflow-hidden">
                <div className="divide-y divide-border/30">
                  {filteredNotifications.map((notification) => (
                    <NotificationCard
                      key={notification._id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
    </section>
  );
};

// Individual notification card component
const NotificationCard = ({ notification, onMarkAsRead }) => {
  const [replyingTo, setReplyingTo] = useState(null);

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;
    return timestamp.toLocaleDateString();
  };

  const username =
    notification.triggered_by?.personal_info?.username ||
    notification.triggered_by?.personal_info?.name ||
    "User";

  const actionText = {
    comment_tag: "mentioned you in a comment",
    blog_comment: "commented on your blog",
    comment_reply: "replied to your comment",
    comment_like: "liked your comment",
    blog_like: "liked your blog",
    comment_report: "reported on your comment",
    report_resolved: "report resolved",
    admin_notification: "sent you a message",
  }[notification.type] || notification.title || "new notification";

  const blogTitle = notification.blog_id?.title;
  const blogSlug = notification.blog_id?.slug || notification.blog_id?._id;
  const commentContent = notification.comment_id?.content;
  const reportReason = notification.metadata?.reason;
  const canReply = ["blog_comment", "comment_reply"].includes(notification.type) && notification.comment_id?._id;

  return (
    <div
      className={cn(
        "group px-5 py-3 transition-colors duration-150",
        !notification.is_read ? "bg-muted/20 hover:bg-muted/30" : "hover:bg-muted/10"
      )}
    >
      {/* Single-line notification */}
      <div className="flex items-baseline gap-x-1.5 flex-wrap text-sm leading-relaxed">
        <Link
          to={`/${username}`}
          className="font-semibold text-foreground hover:text-primary transition-colors shrink-0"
        >
          @{username}
        </Link>
        <span className="text-muted-foreground">{actionText}</span>
        {blogTitle && (
          <>
            <span className="text-muted-foreground">
              {notification.type === "comment_report" ? "of" : "on"}
            </span>
            <Link
              to={`/blog/${blogSlug}`}
              className="font-medium text-foreground hover:text-primary transition-colors truncate max-w-60"
            >
              "{blogTitle}"
            </Link>
          </>
        )}
        {!notification.is_read && (
          <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full shrink-0 translate-y-[-1px]" />
        )}
        <span className="text-xs text-muted-foreground/50 ml-auto shrink-0">
          {formatTimestamp(new Date(notification.created_at))}
        </span>
      </div>

      {/* Comment preview (secondary line) */}
      {commentContent && (
        <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1 italic">
          "{commentContent}"
        </p>
      )}

      {/* Report reason (secondary line) */}
      {reportReason && (
        <p className="text-xs text-destructive/80 mt-1">
          <span className="font-semibold uppercase tracking-wide">Reason:</span>{" "}
          {reportReason}
        </p>
      )}

      {/* Actions row — visible on hover */}
      <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity h-0 group-hover:h-auto overflow-hidden">
        {canReply && (
          <button
            onClick={() => setReplyingTo(replyingTo === notification._id ? null : notification._id)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            {replyingTo === notification._id ? "Cancel" : "Reply"}
          </button>
        )}
        {!notification.is_read && (
          <button
            onClick={() => onMarkAsRead(notification._id)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            Mark read
          </button>
        )}
        {blogSlug && (
          <Link
            to={`/blog/${blogSlug}`}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            View
          </Link>
        )}
      </div>

      {/* Inline Reply Form */}
      {replyingTo === notification._id && (
        <div className="mt-2 pl-3 border-l-2 border-border/40">
          <CommentForm
            blogId={notification.blog_id?._id}
            parentId={notification.comment_id?._id}
            mode="reply"
            placeholder={`Reply to @${username}...`}
            onCancel={() => setReplyingTo(null)}
            onSuccess={() => {
              setReplyingTo(null);
              setTimeout(() => window.location.reload(), 1000);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
