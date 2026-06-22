import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  User,
  MessageCircle,
  Flag,
  Heart,
  CheckCircle,
  Shield,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useNotificationContext } from "@/hooks/useNotificationContext";
import CommentForm from "@/features/comment/CommentForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { showToast } from "@/utils/showToast";

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    notifications,
    unreadCount,
    lastUpdate,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useNotificationContext();

  const dropdownRef = useRef(null);

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification._id);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshNotifications();
      showToast("success", "Notifications refreshed");
    } catch {
      showToast("error", "Failed to refresh notifications");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      showToast("success", "All notifications marked as read");
    } catch {
      showToast("error", "Failed to mark all notifications as read");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "comment_tag":
        return <User className="w-4 h-4 text-primary" />;
      case "blog_comment":
      case "comment_reply":
        return <MessageCircle className="w-4 h-4 text-success" />;
      case "comment_report":
        return <Flag className="w-4 h-4 text-warning" />;
      case "comment_like":
      case "blog_like":
        return <Heart className="w-4 h-4 text-primary" />;
      case "report_resolved":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "admin_notification":
        return <Shield className="w-4 h-4 text-accent" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "comment_tag":
        return "bg-primary/10";
      case "blog_comment":
      case "comment_reply":
        return "bg-success/10";
      case "comment_report":
        return "bg-warning/10";
      case "comment_like":
      case "blog_like":
        return "bg-info/10";
      case "report_resolved":
        return "bg-success/10";
      case "admin_notification":
        return "bg-accent/10";
      default:
        return "bg-muted/50";
    }
  };

  // Filter notifications to show unread first, then recent
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.is_read !== b.is_read) {
      return a.is_read ? 1 : -1;
    }
    return new Date(b.created_at) - new Date(a.created_at);
  });

  // Limit to 10 notifications in dropdown
  const displayNotifications = sortedNotifications.slice(0, 10);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-primary text-primary-foreground"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        ref={dropdownRef}
        className="w-80 sm:w-96 max-h-[80vh] overflow-y-auto"
        align="end"
        side="bottom"
        sideOffset={8}
        alignOffset={0}
      >
        <DropdownMenuLabel className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2 py-3 border-b">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm sm:text-base">
              Notifications
            </span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
            >
              <RefreshCw
                className={cn(
                  "h-3 w-3 sm:h-4 sm:w-4",
                  isRefreshing && "animate-spin"
                )}
              />
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-7 px-2 text-xs sm:h-8"
              >
                Mark all read
              </Button>
            )}
          </div>
        </DropdownMenuLabel>

        {displayNotifications.length === 0 ? (
          <div className="p-4 sm:p-6 text-center text-muted-foreground">
            <Bell className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
            <p className="text-xs sm:text-sm">No notifications yet</p>
            <p className="text-xs">We'll notify you when something happens</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {displayNotifications.map((notification) => (
              <div
                key={notification._id}
                className={cn(
                  "p-2 sm:p-3 rounded-lg cursor-pointer transition-all duration-300 hover:shadow-md relative",
                  getNotificationColor(notification.type),
                  !notification.is_read
                    ? "border-2 border-primary/40 hover:border-primary/60"
                    : "border border-muted/30 opacity-75 hover:border-muted/50"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={cn(
                          "text-xs sm:text-sm font-medium leading-tight",
                          !notification.is_read && "font-semibold"
                        )}
                      >
                        {/* Show dynamic title */}
                        {notification.type === "blog_comment" && "New Comment"}
                        {notification.type === "comment_reply" && "New Reply"}
                        {notification.type === "blog_like" && "Blog Liked"}
                        {notification.type === "comment_like" &&
                          "Comment Liked"}
                        {notification.type === "comment_tag" &&
                          "You Were Mentioned"}
                        {![
                          "blog_comment",
                          "comment_reply",
                          "blog_like",
                          "comment_like",
                          "comment_tag",
                        ].includes(notification.type) && notification.title}
                      </h4>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            new Date(notification.created_at),
                            { addSuffix: true }
                          )}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                      {/* Show dynamic message based on notification type */}
                      {notification.type === "blog_comment" &&
                        `${
                          notification.triggered_by?.personal_info?.username ||
                          notification.triggered_by?.personal_info?.name ||
                          "Someone"
                        } commented on your blog`}
                      {notification.type === "comment_reply" &&
                        `${
                          notification.triggered_by?.personal_info?.username ||
                          notification.triggered_by?.personal_info?.name ||
                          "Someone"
                        } replied to your comment`}
                      {notification.type === "blog_like" &&
                        `${
                          notification.triggered_by?.personal_info?.username ||
                          notification.triggered_by?.personal_info?.name ||
                          "Someone"
                        } liked your blog`}
                      {notification.type === "comment_like" &&
                        `${
                          notification.triggered_by?.personal_info?.username ||
                          notification.triggered_by?.personal_info?.name ||
                          "Someone"
                        } liked your comment`}
                      {notification.type === "comment_tag" &&
                        `${
                          notification.triggered_by?.personal_info?.username ||
                          notification.triggered_by?.personal_info?.name ||
                          "Someone"
                        } mentioned you in a comment`}
                      {![
                        "blog_comment",
                        "comment_reply",
                        "blog_like",
                        "comment_like",
                        "comment_tag",
                      ].includes(notification.type) && notification.message}
                    </p>

                    {/* Show comment content when available */}
                    {notification.comment_id?.content && (
                      <div className="mt-2 p-2 bg-muted/30 rounded-md border-l-2 border-primary/30">
                        <p className="text-xs text-foreground/80 italic line-clamp-2">
                          "{notification.comment_id.content}"
                        </p>
                      </div>
                    )}

                    {notification.metadata?.formatted_message && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {notification.metadata.formatted_message}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-3 flex items-center gap-2">
                      {/* Reply Button for Comment Notifications */}
                      {["blog_comment", "comment_reply"].includes(
                        notification.type
                      ) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReplyingTo(
                              replyingTo === notification._id
                                ? null
                                : notification._id
                            );
                          }}
                          className="h-6 px-2 text-xs font-medium"
                        >
                          {replyingTo === notification._id ? "Cancel" : "Reply"}
                        </Button>
                      )}

                      {/* View Button to navigate to blog */}
                      {notification.blog_id?.slug && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                            const url = notification.comment_id
                              ? `/blog/${notification.blog_id.slug}#comment-${notification.comment_id}`
                              : `/blog/${notification.blog_id.slug}`;
                            window.location.href = url;
                          }}
                          className="h-6 px-2 text-xs font-medium text-primary hover:text-primary/80"
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reply Form */}
                {replyingTo === notification._id && (
                  <div className="mt-3 p-3 bg-muted/20 rounded-lg border border-border/20">
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
                        refreshNotifications();
                        showToast("success", "Reply posted successfully!");
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {notifications.length > 10 && <DropdownMenuSeparator />}

        <div className="p-2 border-t">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="text-center sm:text-left">
              {lastUpdate &&
                `Last updated: ${formatDistanceToNow(lastUpdate, {
                  addSuffix: true,
                })}`}
            </span>
            <Link
              to="/notifications"
              className="text-primary hover:underline text-center sm:text-right"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
