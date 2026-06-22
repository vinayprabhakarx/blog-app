import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Search as SearchIcon,
  Filter,
  CheckCircle,
  XCircle,
  Trash2,
  Trash,
  RefreshCw,
  AlertTriangle,
  CheckSquare,
  Flag,
} from "lucide-react";
import { PageStats } from "@/components/common/PageStats";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/StateDisplays";
import { FilterCard } from "@/components/common/FilterCard";

import {
  deleteComment,
  fetchAdminComments,
  fetchAuthorComments,
} from "./commentsSlice";
import { cn } from "@/lib/utils";
import CommentForm from "./CommentForm";
import { Link } from "react-router-dom";
import { showToast } from "@/utils/showToast";
import LoadingSpinner from "@/components/common/LoadingSpinner";

// New, minimal management view aligned with app design
const CommentManagement = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { adminList, adminLoading, authorList, authorLoading } = useSelector(
    (s) => s.comments
  );

  // All hooks must be called before any conditional returns
  // Filter applied states (used for actual filtering)
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all | reported | comments
  const [sortBy, setSortBy] = useState("newest"); // newest | oldest | reports
  
  // Pending filter states (bound to UI)
  const [pendingSearchTerm, setPendingSearchTerm] = useState("");
  const [pendingFilterStatus, setPendingFilterStatus] = useState("all");
  const [pendingSortBy, setPendingSortBy] = useState("newest");

  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const [selectedComments, setSelectedComments] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        if (user?.role === "admin") {
          await dispatch(
            fetchAdminComments({ page: 1, limit: 50, sort: "newest" })
          );
        } else if (user?.role === "author") {
          await dispatch(
            fetchAuthorComments({ page: 1, limit: 50, sort: "newest" })
          );
        }
      } catch {
        // noop
      }
    };
    if (["admin", "author"].includes(user?.role)) run();
  }, [dispatch, user?.role]);

  const allComments = useMemo(() => {
    if (user?.role === "admin") {
      return (adminList || []).map((comment) => ({
        ...comment,
        blogTitle: comment.blog_id?.title || "Unknown Blog",
        blogId: comment.blog_id?._id || comment.blog_id?.id || "unknown",
        blogSlug: comment.blog_id?.slug || null,
        authorName:
          comment.commented_by?.personal_info?.username ||
          comment.author?.personal_info?.username ||
          "Unknown User",
        authorAvatar:
          comment.commented_by?.personal_info?.profile_img ||
          comment.author?.personal_info?.profile_img ||
          null,
        commentDate:
          comment.commented_at ||
          comment.created_at ||
          comment.createdAt ||
          new Date(),
        hasReports: comment.reports && comment.reports.length > 0,
        reportCount: comment.reports ? comment.reports.length : 0,
      }));
    }
    if (user?.role === "author") {
      return (authorList || []).map((comment) => ({
        ...comment,
        blogTitle: comment.blog_id?.title || "Unknown Blog",
        blogId: comment.blog_id?._id || comment.blog_id?.id || "unknown",
        blogSlug: comment.blog_id?.slug || null,
        authorName:
          comment.commented_by?.personal_info?.username ||
          comment.author?.personal_info?.username ||
          "Unknown User",
        authorAvatar:
          comment.commented_by?.personal_info?.profile_img ||
          comment.author?.personal_info?.profile_img ||
          null,
        commentDate:
          comment.commented_at ||
          comment.created_at ||
          comment.createdAt ||
          new Date(),
        hasReports: comment.reports && comment.reports.length > 0,
        reportCount: comment.reports ? comment.reports.length : 0,
      }));
    }
    return [];
  }, [user?.role, adminList, authorList]);

  const isLoading =
    user?.role === "admin"
      ? adminLoading
      : user?.role === "author"
      ? authorLoading
      : false;

  const stats = useMemo(() => {
    const total = allComments.length;
    const reported = allComments.filter((c) => c.hasReports).length;
    return { total, reported };
  }, [allComments]);

  const filtered = useMemo(() => {
    let filteredComments = allComments;

    // Apply type filtering
    if (filterStatus === "reported") {
      filteredComments = filteredComments.filter((c) => c.hasReports);
    } else if (filterStatus === "comments") {
      filteredComments = filteredComments.filter((c) => !c.hasReports);
    }

    // Apply search filtering
    if (searchTerm) {
      filteredComments = filteredComments.filter((c) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          (c.content || "").toLowerCase().includes(searchLower) ||
          (c.authorName || "").toLowerCase().includes(searchLower) ||
          (c.blogTitle || "").toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply sorting
    return filteredComments.sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.created_at || b.commentDate) -
          new Date(a.created_at || a.commentDate)
        );
      }
      if (sortBy === "oldest") {
        return (
          new Date(a.created_at || a.commentDate) -
          new Date(b.created_at || b.commentDate)
        );
      }
      if (sortBy === "reports") {
        return (b.reportCount || 0) - (a.reportCount || 0);
      }
      return 0;
    });
  }, [allComments, searchTerm, filterStatus, sortBy]);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedComments(new Set());
      setSelectAll(false);
    } else {
      setSelectedComments(new Set(filtered.map((c) => c._id)));
      setSelectAll(true);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedComments);
    try {
      await Promise.all(ids.map((id) => dispatch(deleteComment(id)).unwrap()));
      setSelectedComments(new Set());
      setSelectAll(false);

      if (user?.role === "admin") {
        await dispatch(
          fetchAdminComments({ page: 1, limit: 50, sort: sortBy })
        );
      } else if (user?.role === "author") {
        await dispatch(
          fetchAuthorComments({ page: 1, limit: 50, sort: sortBy })
        );
      }

      showToast(
        "success",
        `${ids.length} comment${
          ids.length !== 1 ? "s" : ""
        } deleted successfully!`
      );
    } catch (error) {
      console.error("Failed to delete comments:", error);
      showToast("error", "Failed to delete some comments. Please try again.");
    }
  };

  if (!["admin", "author"].includes(user?.role)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Access Denied
          </h2>
          <p className="text-muted-foreground">
            You need admin or author privileges to access comment management.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }



  return (
    <section className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          Comment Management
        </h1>
        <PageStats
          stats={[
            { value: stats.total, label: "comments" },
            { value: stats.reported, label: "reported" },
          ]}
        />

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-10 px-0 sm:px-4 w-10 sm:w-auto shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
            onClick={() => {
              if (user?.role === "admin") {
                dispatch(
                  fetchAdminComments({ page: 1, limit: 50, sort: sortBy })
                );
              } else if (user?.role === "author") {
                dispatch(
                  fetchAuthorComments({
                    page: 1,
                    limit: 50,
                    sort: sortBy,
                  })
                );
              }
            }}
          >
            <RefreshCw className="h-7 w-7 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-10 px-0 sm:px-4 w-10 sm:w-auto shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <Filter className="w-7 h-7 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkActions(!showBulkActions)}
            disabled={filtered.length === 0}
            className="h-10 px-0 sm:px-4 w-10 sm:w-auto shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckSquare className="w-7 h-7 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Bulk Actions</span>
          </Button>
        </div>
      </div>

      <FilterCard
        isOpen={showFilters}
        onClear={() => {
          setPendingSearchTerm("");
          setPendingFilterStatus("all");
          setPendingSortBy("newest");
          setSearchTerm("");
          setFilterStatus("all");
          setSortBy("newest");
          setSelectedComments(new Set());
          setSelectAll(false);
        }}
        onApply={() => {
          setSearchTerm(pendingSearchTerm);
          setFilterStatus(pendingFilterStatus);
          setSortBy(pendingSortBy);
        }}
        disableApply={
          !pendingSearchTerm &&
          pendingFilterStatus === "all" &&
          pendingSortBy === "newest"
        }
        className="mb-6"
      >
                <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
                  <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search comments"
                    value={pendingSearchTerm}
                    onChange={(e) => setPendingSearchTerm(e.target.value)}
                    className="pl-10 w-full h-10 sm:h-9 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <Select value={pendingFilterStatus} onValueChange={setPendingFilterStatus}>
                  <SelectTrigger className="w-full h-10 sm:h-9 text-sm cursor-pointer">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Comments</SelectItem>
                    <SelectItem value="reported">Reported Only</SelectItem>
                    <SelectItem value="comments">Clean Only</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={pendingSortBy} onValueChange={setPendingSortBy}>
                  <SelectTrigger className="w-full h-10 sm:h-9 text-sm cursor-pointer">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="reports">Most Reported</SelectItem>
                  </SelectContent>
                </Select>
      </FilterCard>
      <div className="w-full mt-8">
        {showBulkActions && filtered.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                  className="cursor-pointer !w-4 !h-4 !min-w-[16px] !min-h-[16px] !max-w-[16px] !max-h-[16px] !text-base"
                />
                <span className="text-sm font-medium cursor-pointer">
                  Select All{" "}
                  {selectedComments.size > 0 && `(${selectedComments.size})`}
                </span>
              </div>

              {selectedComments.size > 0 && (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedComments(new Set());
                      setSelectAll(false);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground h-8 px-3 cursor-pointer w-full sm:w-auto"
                  >
                    Clear Selected
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const confirmed = window.confirm(
                        `Are you sure you want to delete ${
                          selectedComments.size
                        } comment${
                          selectedComments.size !== 1 ? "s" : ""
                        }? This action cannot be undone.`
                      );
                      if (confirmed) {
                        handleBulkDelete();
                      }
                    }}
                    className="h-8 px-3 cursor-pointer w-full sm:w-auto"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete ({selectedComments.size})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="py-8">
              <EmptyState 
                variant="compact"
                icon={MessageSquare} 
                title="No comments found" 
                description="Try adjusting your filters or check back later."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((c) => (
                <RowCard
                  key={c._id}
                  comment={c}
                  selected={selectedComments.has(c._id)}
                  showCheckbox={showBulkActions}
                  onToggle={() => {
                    const next = new Set(selectedComments);
                    if (next.has(c._id)) next.delete(c._id);
                    else next.add(c._id);
                    setSelectedComments(next);
                    setSelectAll(next.size === filtered.length);
                  }}
                  onRefresh={() => {
                    if (user?.role === "admin") {
                      dispatch(
                        fetchAdminComments({ page: 1, limit: 50, sort: sortBy })
                      );
                    } else if (user?.role === "author") {
                      dispatch(
                        fetchAuthorComments({
                          page: 1,
                          limit: 50,
                          sort: sortBy,
                        })
                      );
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const RowCard = ({ comment, selected, showCheckbox, onToggle, onRefresh }) => {
  const dispatch = useDispatch();
  const [isReplying, setIsReplying] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this comment? This action cannot be undone.`
    );
    if (confirmed) {
      try {
        await dispatch(deleteComment(comment._id)).unwrap();
        // Show success toast
        showToast("success", "Comment deleted successfully!");
        // No need to call onRefresh() - Redux state will update automatically
      } catch (error) {
        console.error("Failed to delete comment:", error);
        showToast("error", "Failed to delete comment. Please try again.");
      }
    }
  };

  const handleReply = () => {
    setIsReplying(!isReplying);
  };

  const handleReplySuccess = () => {
    setIsReplying(false);
    onRefresh();
  };

  const handleReplyCancel = () => {
    setIsReplying(false);
  };

  return (
    <article
      className={cn(
        "group transition-all duration-200 rounded-xl border bg-card border-border/40 hover:bg-muted/30"
      )}
    >
      <div className="flex flex-col sm:flex-row items-start gap-3 p-4">
        <div className="flex flex-row items-start gap-3 flex-1 min-w-0 w-full">
          {showCheckbox && (
            <div className="pt-1 flex-shrink-0">
              <Checkbox
                checked={selected}
                onCheckedChange={onToggle}
                className="cursor-pointer !w-4 !h-4 !min-w-[16px] !min-h-[16px] !max-w-[16px] !max-h-[16px] !text-base"
              />
            </div>
          )}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
            <span className="font-semibold text-foreground text-sm sm:text-base">
              {comment.authorName}
            </span>
            {comment.hasReports && (
              <span className="px-2 py-0.5 text-xs rounded border bg-destructive/10 text-destructive border-destructive/20">
                <Flag className="inline h-3 w-3 mr-1" /> {comment.reportCount}{" "}
                report{comment.reportCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="text-xs sm:text-sm leading-relaxed text-foreground/90 mb-2">
            {comment.content}
          </div>
          <div className="text-xs text-muted-foreground mb-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <div className="flex items-center gap-1 min-w-0 max-w-full">
                <span className="text-xs text-muted-foreground cursor-pointer font-medium flex-shrink-0">
                  on
                </span>
                <Link
                  to={`/blog/${comment.blogSlug || comment.blogId}`}
                  className="text-primary hover:text-primary/80 hover:underline font-medium truncate cursor-pointer"
                >
                  {comment.blogTitle}
                </Link>
              </div>
              <div className="text-xs text-muted-foreground font-medium flex-shrink-0 whitespace-nowrap">
                {new Date(
                  comment.created_at || comment.commentDate
                ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row sm:flex-col md:flex-row items-center justify-end gap-2 w-full sm:w-auto sm:ml-auto mt-3 sm:mt-0 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReply}
            className={cn(
              "h-8 px-3 text-xs transition-colors cursor-pointer flex-1 sm:flex-none",
              isReplying
                ? "text-primary bg-primary/10 hover:bg-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            {isReplying ? "Cancel" : "Reply"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-8 px-3 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer flex-1 sm:flex-none"
          >
            <Trash className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Inline Reply Form using existing CommentForm */}
      {isReplying && (
        <div className="border-t border-border/20 bg-muted/20 px-4 py-3">
          <CommentForm
            blogId={comment.blogId}
            parentId={comment._id}
            mode="reply"
            placeholder="Write your reply..."
            onCancel={handleReplyCancel}
            onSuccess={handleReplySuccess}
          />
        </div>
      )}
    </article>
  );
};

export default CommentManagement;
