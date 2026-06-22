import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Bell,
  MessageSquare,
  CheckCircle,
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

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  const canReply = (notification) => {
    const commentTypes = ["blog_comment", "comment_reply"];
    const canReplyToType = commentTypes.includes(notification.type);
    const hasCommentId = notification.comment_id?._id;

    return canReplyToType && hasCommentId;
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col sm:flex-row items-start gap-4 p-5 transition-colors duration-200 cursor-default",
        !notification.is_read ? "bg-muted/20 hover:bg-muted/30" : "bg-transparent hover:bg-muted/10"
      )}
    >
      <div className="flex flex-col sm:flex-row items-start w-full">
        {/* Main Content */}
        <div className="flex-1 min-w-0 w-full space-y-1">
          {/* Notification Message */}
          <div className="text-sm leading-relaxed text-foreground">
            <Link 
              to={`/${notification.triggered_by?.personal_info?.username || ""}`}
              className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer mr-1.5 align-baseline"
            >
              @{notification.triggered_by?.personal_info?.username ||
                notification.triggered_by?.personal_info?.name ||
                "User"}
            </Link>
            <span className="text-muted-foreground">
              {notification.type === "comment_tag" && "mentioned you in a comment"}
              {notification.type === "blog_comment" && "commented on your blog"}
              {notification.type === "comment_reply" && "replied to your comment"}
              {notification.type === "comment_like" && "liked your comment"}
              {notification.type === "blog_like" && "liked your blog"}
              {notification.type === "comment_report" && "reported on your comment"}
              {notification.type === "report_resolved" && "report resolved"}
              {notification.type === "admin_notification" && !notification.comment_id?.content && "sent you a message"}
            </span>
            {notification.blog_id?.title && (
              <span className="text-muted-foreground">
                {notification.type === "comment_report" ? " of this blog " : " on "}
                <Link
                  to={`/blog/${notification.blog_id.slug || notification.blog_id._id}`}
                  className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  "{notification.blog_id.title}"
                </Link>
              </span>
            )}
            {!notification.is_read && (
              <span className="inline-block w-2 h-2 bg-primary rounded-full ml-2 align-middle" />
            )}
          </div>

          {/* Comment Content Preview */}
          {notification.comment_id?.content && (
            <div className="mt-2.5 p-3.5 bg-muted/30 rounded-lg border border-border/40">
              <p className="text-sm text-muted-foreground line-clamp-3">
                "{notification.comment_id.content}"
              </p>
            </div>
          )}

            {/* Report Reason */}
            {notification.metadata?.reason && (
              <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-xs text-destructive font-semibold mb-1 uppercase tracking-wide">
                  Report Reason
                </p>
                <p className="text-sm text-destructive/90">
                  {notification.metadata.reason}
                </p>
              </div>
            )}
          {/* Footer Info & Actions */}
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-muted-foreground font-medium">
              {formatTimestamp(new Date(notification.created_at))}
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {canReply(notification) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReplyingTo(
                      replyingTo === notification._id ? null : notification._id
                    );
                  }}
                  className={cn(
                    "h-7 px-3 text-xs font-medium transition-colors cursor-pointer rounded-full",
                    replyingTo === notification._id
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <MessageSquare className="h-3 w-3 mr-1.5" />
                  {replyingTo === notification._id ? "Cancel" : "Reply"}
                </Button>
              )}

              {!notification.is_read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification._id);
                  }}
                  className="h-7 px-3 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer rounded-full"
                >
                  <CheckCircle className="h-3 w-3 mr-1.5" />
                  Mark Read
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inline Reply Form using existing CommentForm */}
      {replyingTo === notification._id && (
        <div className="border-t border-border/20 bg-muted/20 px-4 py-3">
          <CommentForm
            blogId={notification.blog_id?._id}
            parentId={notification.comment_id?._id}
            mode="reply"
            placeholder={`Reply to ${
              notification.triggered_by?.personal_info?.username ||
              "this comment"
            }...`}
            onCancel={() => setReplyingTo(null)}
            onSuccess={() => {
              setReplyingTo(null);
              // Refresh notifications after successful reply
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
