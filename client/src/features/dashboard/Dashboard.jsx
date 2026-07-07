import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  fetchAdminStats,
  fetchRecentActivities,
  selectAdminStats,
  selectAdminStatsLoading,
  selectRecentActivities,
  selectRecentActivitiesLoading,
} from "@/features/user_management/userSlice";
import {
  BarChart3,
  Users,
  FileText,
  MessageSquare,
  Settings,
  Plus,
  BookOpen,
  TrendingUp,
  Eye,
  FolderOpen,
  Activity,
  PenTool,
  Mail
} from "lucide-react";
import api from "@/api/api";
import { EmptyState, LoadingState } from "@/components/common/StateDisplays";

const Dashboard = () => {
  const { user, isAdmin, isAuthor } = useAuth();
  const [authorStats, setAuthorStats] = useState({
    totalMyBlogs: 0,
    totalCommentsOnMyBlogs: 0,
    totalViewsOnMyBlogs: 0,
    publishedBlogs: 0,
    draftBlogs: 0,
  });
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [blogsLoading, setBlogsLoading] = useState(true);

  // Helper function to get user display name
  const getUserDisplayName = () => {
    if (!user) return "User";
    return (
      user.personal_info?.name ||
      user.personal_info?.username ||
      user.name ||
      "User"
    );
  };

  const dispatch = useDispatch();
  const adminStats = useSelector(selectAdminStats);
  const adminStatsLoading = useSelector(selectAdminStatsLoading);
  const recentActivities = useSelector(selectRecentActivities);
  const recentActivitiesLoading = useSelector(selectRecentActivitiesLoading);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (isAdmin) {
        await Promise.all([
          dispatch(fetchAdminStats()),
          dispatch(fetchRecentActivities()),
        ]);
      }

      // Fetch author stats if author
      if (isAuthor) {
        try {
          const authorResponse = await api.get("/users/author/stats");
          setAuthorStats(authorResponse.data.stats);
        } catch {
          // Error handled silently
        }

        try {
          const blogsResponse = await api.get("/users/author/recent-blogs");
          setRecentBlogs(blogsResponse.data.blogs);
          setBlogsLoading(false);
        } catch {
          setBlogsLoading(false);
        }
      }
    };

    fetchDashboardData();
  }, [dispatch, isAdmin, isAuthor]);

  const getQuickActions = () => {
    const actions = [];

    if (isAdmin || isAuthor) {
      actions.push(
        {
          title: "Create Blog",
          description: "Write and publish a new blog post",
          icon: Plus,
          path: "/blogs/create",
          variant: "default",
        },
        {
          title: "My Blogs",
          description: "Manage your published and draft blogs",
          icon: BookOpen,
          path: "/my-blogs",
          variant: "outline",
        }
      );
    }

    actions.push(
      {
        title: "Comments",
        description: "View and manage comments",
        icon: MessageSquare,
        path: "/comments",
        variant: "outline",
      },
      {
        title: "Profile",
        description: "Update your profile and settings",
        icon: Settings,
        path: "/profile",
        variant: "outline",
      }
    );

    if (isAdmin) {
      actions.push(
        {
          title: "User Management",
          description: "Manage system users and permissions",
          icon: Users,
          path: "/users",
          variant: "outline",
        },
        {
          title: "Analytics",
          description: "View system-wide statistics and insights",
          icon: BarChart3,
          path: "/analytics",
          variant: "outline",
        },
        {
          title: "Manage Categories",
          description: "Add or edit blog categories",
          icon: FolderOpen,
          path: "/category",
          variant: "outline",
        },
        {
          title: "Contact Messages",
          description: "View and manage submitted contact forms",
          icon: Mail,
          path: "/contacts",
          variant: "outline",
        }
      );
    }

    return actions;
  };

  const getStats = () => {
    const stats = [];

    if (isAdmin && adminStats) {
      stats.push(
        {
          title: "Total Users",
          value: adminStats?.totalUsers || 0,
          icon: Users,
        },
        {
          title: "Total Blogs",
          value: adminStats?.totalBlogs || 0,
          icon: FileText,
        },
        {
          title: "Categories",
          value: adminStats?.totalCategories || 0,
          icon: FolderOpen,
        },
        {
          title: "Total Comments",
          value: adminStats?.totalComments || 0,
          icon: MessageSquare,
        }
      );
    } else if (isAuthor) {
      stats.push(
        {
          title: "My Blogs",
          value: authorStats.totalMyBlogs,
          icon: FileText,
        },
        {
          title: "Total Views",
          value: authorStats.totalViewsOnMyBlogs,
          icon: Eye,
        },
        {
          title: "Comments",
          value: authorStats.totalCommentsOnMyBlogs,
          icon: MessageSquare,
        },
        {
          title: "Published",
          value: authorStats.publishedBlogs,
          icon: TrendingUp,
        }
      );
    }
    return stats;
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60)
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  };

  const quickActions = getQuickActions();
  const stats = getStats();

  return (
    <section className="min-h-screen bg-background">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8 p-2 sm:p-4 md:p-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          {isAdmin
            ? "Admin Dashboard"
            : isAuthor
            ? "Author Dashboard"
            : "Dashboard"}
        </h1>
        <div className="mt-2 flex flex-col items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Welcome back, {getUserDisplayName()}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-8 p-6">
        {/* Stats Overview (Non-Card Layout) */}
        <div className="w-full rounded-lg border border-border/50 bg-card overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {adminStatsLoading
              ? Array(4)
                  .fill(0)
                  .map((_, index) => {
                    const borderClasses =
                      index === 0 ? "border-b border-r border-border/50 md:border-b-0" :
                      index === 1 ? "border-b border-border/50 md:border-b-0 md:border-r" :
                      index === 2 ? "border-r border-border/50" :
                      "";
                    return (
                    <div
                      key={`loading-stat-${index}`}
                      className={`p-4 flex flex-col items-center justify-center space-y-1.5 ${borderClasses}`}
                    >
                      <div className="h-3 w-20 bg-muted animate-pulse rounded"></div>
                      <div className="h-6 w-8 bg-muted animate-pulse rounded"></div>
                    </div>
                  );
                  })
              : stats.map((stat, index) => {
                  const borderClasses =
                    index === 0 ? "border-b border-r border-border/50 md:border-b-0" :
                    index === 1 ? "border-b border-border/50 md:border-b-0 md:border-r" :
                    index === 2 ? "border-r border-border/50" :
                    "";
                  return (
                    <div
                      key={stat.title || stat.id}
                      className={`p-4 flex flex-col items-center justify-center text-center group hover:bg-accent/10 transition-colors ${borderClasses}`}
                    >
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 group-hover:text-foreground transition-colors">
                        {stat.title}
                      </h3>
                      <div className="text-2xl font-bold text-foreground tracking-tight">
                        {stat.value}
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="md:col-span-2 lg:col-span-3">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {quickActions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <Link 
                    key={action.path} 
                    to={action.path}
                    className="group rounded-lg border border-border/60 bg-card p-4 transition-colors hover:border-border hover:bg-accent/30 flex items-center gap-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border/50 bg-background transition-colors group-hover:bg-background">
                      <IconComponent className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-foreground truncate">{action.title}</p>
                      <p className="text-xs text-muted-foreground truncate hidden sm:block">{action.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Admin-specific: Recent Activities */}
        {isAdmin && (
          <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border/40">
              <h2 className="text-lg font-semibold">Recent Activities</h2>
            </div>
            <div className="p-0">
              {recentActivitiesLoading ? (
                <div className="p-3 sm:p-4 md:p-6"><LoadingState variant="compact" message="Loading activities..." /></div>
              ) : recentActivities?.length === 0 ? (
                <div className="p-3 sm:p-4 md:p-6">
                  <EmptyState 
                    variant="compact" 
                    icon={Activity} 
                    title="No Activity Yet" 
                    description="Recent activities will appear here once users interact with the platform."
                  />
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {recentActivities.map((activity, index) => (
                    <div
                      key={`${activity.type}-${activity.createdAt}-${index}`}
                      className="flex items-center p-4 hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {activity.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {formatTimeAgo(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Author-specific: Recent Blogs */}
        {isAuthor && (
          <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border/40">
              <h2 className="text-lg font-semibold">Your Recent Blogs</h2>
            </div>
            <div className="p-0">
              {blogsLoading ? (
                <div className="p-3 sm:p-4 md:p-6"><LoadingState variant="compact" message="Loading blogs..." /></div>
              ) : recentBlogs.length === 0 ? (
                <div className="p-3 sm:p-4 md:p-6">
                  <EmptyState 
                    variant="compact" 
                    icon={PenTool} 
                    title="No Blogs Yet" 
                    description="You haven't published any blogs yet. Start writing your first one!"
                    action={
                      <Button asChild variant="outline" size="sm" className="mt-2">
                        <Link to="/write-blog">Write a Blog</Link>
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {recentBlogs.map((blog, index) => (
                    <Link
                      to={blog.draft ? `/edit-blog/${blog.slug}` : `/blog/${blog.slug}`}
                      key={blog._id || blog.slug || `blog-${index}`}
                      className="flex items-center justify-between p-4 hover:bg-accent/30 transition-colors cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{blog.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {formatTimeAgo(blog.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center shrink-0">
                        <Badge
                          variant={blog.draft ? "secondary" : "outline"}
                          className="text-micro font-normal"
                        >
                          {blog.draft ? "Draft" : "Published"}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Dashboard;
