import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Bell,
  MessageSquare,
  Flag,
  User,
  RefreshCw,
  Trash2,
  Heart,
  CheckCircle,
  Shield,
} from "lucide-react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  fetchNotifications,
  markNotificationRead,
  clearAllNotifications,
} from "./notificationsSlice";
import { useNotifications } from "../../hooks/useNotifications";
import { cn } from "../../lib/utils";
import { Link } from "react-router-dom";
import CommentForm from "../comment/CommentForm";

const NotificationDashboard = () => {
  const dispatch = useDispatch();
  const { notifications, loading, error } = useSelector(
    (state) => state.notifications
  );
  const { refreshNotifications } = useNotifications();

  const [activeTab, setActiveTab] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Enhanced filtering and sorting
  const filteredNotifications = notifications
    .filter((notification) => {
      // Filter by tab
      if (activeTab === "unread" && notification.is_read) return false;
      if (activeTab === "reports" && notification.type !== "comment_report")
        return false;
      if (
        activeTab === "comments" &&
        !["blog_comment", "comment_reply"].includes(notification.type)
      )
        return false;
      if (
        activeTab === "likes" &&
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-warning p-4">
        Error loading notifications: {error}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
      {/* Notification Center */}
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Notification Center
            </h1>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-4 hover:shadow-md transition-all duration-200"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-4 hover:shadow-md transition-all duration-200 text-destructive hover:text-destructive border-destructive/20 hover:border-destructive/40"
              onClick={() => dispatch(clearAllNotifications())}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Tab Navigation - Modern Design */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile Design - Stacked Tabs */}
          <div className="block sm:hidden space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveTab("all")}
                className={cn(
                  "cursor-pointer rounded-md transition-all duration-200 text-xs px-3 py-3 h-auto border",
                  activeTab === "all"
                    ? "bg-background border-primary/30"
                    : "bg-muted/30 border-border/30 hover:bg-muted/50"
                )}
              >
                <div className="text-center">
                  <div className="font-medium">All</div>
                  <div className="text-xs text-muted-foreground">
                    ({stats.total})
                  </div>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("unread")}
                className={cn(
                  "cursor-pointer rounded-md transition-all duration-200 text-xs px-3 py-3 h-auto border",
                  activeTab === "unread"
                    ? "bg-background border-primary/30"
                    : "bg-muted/30 border-border/30 hover:bg-muted/50"
                )}
              >
                <div className="text-center">
                  <div className="font-medium">Unread</div>
                  <div className="text-xs text-muted-foreground">
                    ({stats.unread})
                  </div>
                </div>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setActiveTab("reports")}
                className={cn(
                  "cursor-pointer rounded-md transition-all duration-200 text-xs px-2 py-3 h-auto border",
                  activeTab === "reports"
                    ? "bg-background border-primary/30"
                    : "bg-muted/30 border-border/30 hover:bg-muted/50"
                )}
              >
                <div className="text-center">
                  <div className="font-medium">Reports</div>
                  <div className="text-xs text-muted-foreground">
                    ({stats.reports})
                  </div>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("comments")}
                className={cn(
                  "cursor-pointer rounded-md transition-all duration-200 text-xs px-2 py-3 h-auto border",
                  activeTab === "comments"
                    ? "bg-background border-primary/30"
                    : "bg-muted/30 border-border/30 hover:bg-muted/50"
                )}
              >
                <div className="text-center">
                  <div className="font-medium">Comments</div>
                  <div className="text-xs text-muted-foreground">
                    ({stats.comments})
                  </div>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("likes")}
                className={cn(
                  "cursor-pointer rounded-md transition-all duration-200 text-xs px-2 py-3 h-auto border",
                  activeTab === "likes"
                    ? "bg-background border-primary/30"
                    : "bg-muted/30 border-border/30 hover:bg-muted/50"
                )}
              >
                <div className="text-center">
                  <div className="font-medium">Likes</div>
                  <div className="text-xs text-muted-foreground">
                    ({stats.likes})
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Desktop Design - Original Horizontal Layout */}
          <TabsList className="hidden sm:flex w-full bg-muted/30 p-1 rounded-lg gap-1">
            <TabsTrigger
              value="all"
              className="cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground rounded-md transition-all duration-200 text-sm px-3 py-2"
            >
              All ({stats.total})
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className="cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground rounded-md transition-all duration-200 text-sm px-3 py-2"
            >
              Unread ({stats.unread})
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground rounded-md transition-all duration-200 text-sm px-3 py-2"
            >
              Reports ({stats.reports})
            </TabsTrigger>
            <TabsTrigger
              value="comments"
              className="cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground rounded-md transition-all duration-200 text-sm px-3 py-2"
            >
              Comments ({stats.comments})
            </TabsTrigger>
            <TabsTrigger
              value="likes"
              className="cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground rounded-md transition-all duration-200 text-sm px-3 py-2"
            >
              Likes ({stats.likes})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-0">
            {filteredNotifications.length === 0 ? (
              <div className="py-8 sm:py-12 md:py-16 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                  No notifications yet
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xs sm:max-w-sm mx-auto px-4">
                  When you get notifications, they'll show up here. Check back
                  later for updates.
                </p>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground cursor-pointer font-medium">
                  on
                </span>
                {notification.blog_id?.title && (
                  <Link
                    to={`/blog/${
                      notification.blog_id.slug || notification.blog_id._id
                    }`}
                    className="text-primary hover:text-primary/80 hover:underline font-medium truncate max-w-32 sm:max-w-48 cursor-pointer"
                  >
                    {notification.blog_id.title}
                  </Link>
                )}
              </div>
              <div className="text-xs text-muted-foreground font-medium">
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

export default NotificationDashboard;
