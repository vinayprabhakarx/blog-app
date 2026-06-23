import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useNotificationContext } from "@/hooks/useNotificationContext";
import CommentForm from "@/features/comment/CommentForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification._id);
    }
  };

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

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      showToast("success", "All notifications marked as read");
    } catch {
      showToast("error", "Failed to mark all notifications as read");
    }
  };


  const getUsername = (notification) =>
    notification.triggered_by?.personal_info?.username ||
    notification.triggered_by?.personal_info?.name ||
    "Someone";

  const getNotificationText = (notification) => {
    const user = getUsername(notification);
    switch (notification.type) {
      case "blog_comment":
        return { user, action: "commented on your blog" };
      case "comment_reply":
        return { user, action: "replied to your comment" };
      case "blog_like":
        return { user, action: "liked your blog" };
      case "comment_like":
        return { user, action: "liked your comment" };
      case "comment_tag":
        return { user, action: "mentioned you in a comment" };
      case "comment_report":
        return { user, action: "reported a comment" };
      case "report_resolved":
        return { user, action: "resolved a report" };
      default:
        return { user: "", action: notification.message || notification.title || "New notification" };
    }
  };

  // Sort: unread first, then by date
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

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
        className="w-80 sm:w-96 p-0"
        align="end"
        side="bottom"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {unreadCount} unread
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
              />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <div className="max-h-96 overflow-y-auto">
          {displayNotifications.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs mt-0.5 opacity-70">
                We'll notify you when something happens
              </p>
            </div>
          ) : (
            displayNotifications.map((notification) => {
              const { user, action } = getNotificationText(notification);
              const blogTitle = notification.blog_id?.title;
              const blogSlug = notification.blog_id?.slug;
              const commentContent = notification.comment_id?.content;

              return (
                <div key={notification._id}>
                  <div
                    className={cn(
                      "px-4 py-3 cursor-pointer transition-colors hover:bg-muted/40",
                      !notification.is_read && "bg-primary/[0.03]"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="min-w-0">
                        {/* Main text */}
                        <p className="text-sm leading-snug">
                          {user && (
                            <Link
                              to={`/${notification.triggered_by?.personal_info?.username}`}
                              className="font-medium text-foreground hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                              }}
                            >
                              @{user}
                            </Link>
                          )}
                          {user && " "}
                          <span className="text-muted-foreground">
                            {action}
                          </span>
                        </p>

                        {/* Blog title */}
                        {blogTitle && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            on{" "}
                            {blogSlug ? (
                              <Link
                                to={`/blog/${blogSlug}`}
                                className="text-foreground/70 hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsOpen(false);
                                }}
                              >
                                "{blogTitle}"
                              </Link>
                            ) : (
                              <span className="text-foreground/70">
                                "{blogTitle}"
                              </span>
                            )}
                          </p>
                        )}

                        {/* Comment preview */}
                        {commentContent && (
                          <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1 italic">
                            "{commentContent}"
                          </p>
                        )}

                        {/* Timestamp + actions row */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-muted-foreground/60">
                            {formatDistanceToNow(
                              new Date(notification.created_at),
                              { addSuffix: true }
                            )}
                          </span>

                          {/* Inline reply toggle */}
                          {["blog_comment", "comment_reply"].includes(
                            notification.type
                          ) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyingTo(
                                  replyingTo === notification._id
                                    ? null
                                    : notification._id
                                );
                              }}
                              className="text-xs text-primary/70 hover:text-primary transition-colors cursor-pointer"
                            >
                              {replyingTo === notification._id
                                ? "Cancel"
                                : "Reply"}
                            </button>
                          )}

                          {blogSlug && (
                            <Link
                              to={
                                notification.comment_id
                                  ? `/blog/${blogSlug}#comment-${notification.comment_id._id}`
                                  : `/blog/${blogSlug}`
                              }
                              className="text-xs text-primary/70 hover:text-primary transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                              }}
                            >
                              View
                            </Link>
                          )}

                          {/* Unread dot */}
                          {!notification.is_read && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                    </div>

                    {/* Inline Reply Form */}
                    {replyingTo === notification._id && (
                      <div className="mt-2 ml-6.5 pl-3 border-l-2 border-border/40">
                        <CommentForm
                          blogId={notification.blog_id?._id}
                          parentId={notification.comment_id?._id}
                          mode="reply"
                          placeholder={`Reply to @${getUsername(notification)}...`}
                          onCancel={() => setReplyingTo(null)}
                          onSuccess={() => {
                            setReplyingTo(null);
                            refreshNotifications();
                            showToast("success", "Reply posted!");
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Divider between items */}
                  <div className="border-b border-border/30 last:border-0" />
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border text-xs text-muted-foreground">
          <span>
            {lastUpdate &&
              `Updated ${formatDistanceToNow(lastUpdate, {
                addSuffix: true,
              })}`}
          </span>
          <Link
            to="/notifications"
            className="text-primary hover:underline font-medium"
            onClick={() => setIsOpen(false)}
          >
            View all
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
