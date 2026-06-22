import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Bell,
  Heart,
  MessageCircle,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Check,
  CheckSquare,
  Trash2,
  Trash,
  Filter,
  RefreshCw,
  Info,
} from "lucide-react";
import { PageStats } from "@/components/common/PageStats";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateDisplays";
import { FilterCard } from "@/components/common/FilterCard";
import { Card } from "@/components/ui/card";
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
import LoadingSpinner from "@/components/common/LoadingSpinner";

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
              className="h-10 px-0 sm:px-4 w-10 sm:w-auto hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
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
        "group transition-all duration-200 rounded-xl border bg-card border-border/40 hover:bg-muted/30 mb-4",
        !notification.is_read &&
          "border-2 border-primary/40 hover:border-primary/60"
      )}
    >
      {/* Left border accent for unread notifications */}
      {!notification.is_read && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />
      )}

      <div className="flex flex-col sm:flex-row items-start gap-3 p-4">
        {/* User Avatar */}
        <div className="pt-1 flex-shrink-0">
          <Avatar className="h-8 w-8 sm:h-9 sm:w-9 ring-1 ring-border/20 group-hover:ring-primary/30 transition-all duration-300">
            <AvatarImage
              src={notification.triggered_by?.personal_info?.profile_img}
              alt={
                notification.triggered_by?.personal_info?.username ||
                notification.triggered_by?.personal_info?.name ||
                "User"
              }
            />
            <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
              {notification.triggered_by?.personal_info?.username
                ?.charAt(0)
                ?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 w-full">
          {/* Username */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
            <span className="font-semibold text-foreground text-sm sm:text-base">
              {notification.triggered_by?.personal_info?.username ||
                notification.triggered_by?.personal_info?.name ||
                "User"}
            </span>
          </div>

          {/* Notification Message */}
          <div className="text-xs sm:text-sm leading-relaxed text-foreground/90 mb-2">
            <span className="font-medium">
              {notification.type === "comment_tag" && "mentioned you"}
              {notification.type === "blog_comment" && "commented"}
              {notification.type === "comment_reply" && "replied"}
              {notification.type === "comment_like" && "liked your comment"}
              {notification.type === "blog_like" && "liked your blog"}
              {notification.type === "comment_report" &&
                "reported your comment"}
              {notification.type === "report_resolved" && "report resolved"}
              {notification.type === "admin_notification" &&
                !notification.comment_id?.content &&
                "sent you a message"}
              {notification.type === "blog_comment" &&
                notification.comment_id?.content &&
                ":"}
              {notification.type === "comment_reply" &&
                notification.comment_id?.content &&
                ":"}
            </span>

            {/* Comment Content */}
            {notification.comment_id?.content && (
              <div className="mt-2 p-3 bg-muted/30 rounded-lg border-l-2 border-primary/30">
                <p className="text-sm text-foreground/80 italic">
                  "{notification.comment_id.content}"
                </p>
              </div>
            )}

            {/* Report Reason */}
            {notification.metadata?.reason && (
              <div className="mt-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-xs text-warning font-semibold mb-1 uppercase tracking-wide">
                  Report Reason
                </p>
                <p className="text-sm text-warning/90">
                  {notification.metadata.reason}
                </p>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="text-xs text-muted-foreground mb-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <div className="flex items-center gap-1 min-w-0 max-w-full">
                <span className="text-xs text-muted-foreground cursor-pointer font-medium flex-shrink-0">
                  on
                </span>
                {notification.blog_id?.title && (
                  <Link
                    to={`/blog/${
                      notification.blog_id.slug || notification.blog_id._id
                    }`}
                    className="text-primary hover:text-primary/80 hover:underline font-medium truncate cursor-pointer"
                  >
                    {notification.blog_id.title}
                  </Link>
                )}
              </div>
              <div className="text-xs text-muted-foreground font-medium flex-shrink-0 whitespace-nowrap">
                {formatTimestamp(new Date(notification.created_at))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto mt-3 sm:mt-0">
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
                "h-8 px-3 text-xs transition-colors cursor-pointer flex-1 sm:flex-none",
                replyingTo === notification._id
                  ? "text-primary bg-primary/10 hover:bg-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
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
              className="h-8 px-3 text-xs text-primary hover:text-primary hover:bg-primary/10 cursor-pointer flex-1 sm:flex-none"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Mark Read
            </Button>
          )}
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
