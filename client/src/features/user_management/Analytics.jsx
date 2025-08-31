import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { store } from "../../app/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  MessageSquare,
  Users,
  Activity,
  FileText,
  FolderOpen,
} from "lucide-react";
import { showToast } from "../../utils/showToast";
import api from "../../api/api";
import {
  fetchAdminStats,
  fetchMonthlyPerformance,
  fetchRecentActivities,
  selectAdminStats,
  selectMonthlyPerformance,
  selectMonthlyPerformanceLoading,
} from "./userSlice";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const Analytics = () => {
  const dispatch = useDispatch();

  // Redux selectors
  const adminStats = useSelector(selectAdminStats);
  const monthlyPerformance = useSelector(selectMonthlyPerformance);
  const monthlyPerformanceLoading = useSelector(
    selectMonthlyPerformanceLoading
  );

  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalUsers: 0,
    totalBlogs: 0,
    totalCategories: 0,
    monthlyGrowth: 0,
    topBlogs: [],
    recentStats: [],
    usersByRole: {},
    recentRegistrations: 0,
    monthlyRegistrations: [],
  });
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState([]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch data using Redux actions and blogs
      const [, , , blogsResponse] = await Promise.all([
        dispatch(fetchAdminStats()),
        dispatch(fetchMonthlyPerformance()),
        dispatch(fetchRecentActivities()),
        api.get("/blogs"),
      ]);

      const blogsData = blogsResponse.data.blogs || [];
      setBlogs(blogsData);

      // Set data from Redux state after successful fetch
      const state = store.getState();
      setAnalytics({
        totalViews: state.user.adminStats?.totalViews || 0,
        totalLikes: state.user.adminStats?.totalLikes || 0,
        totalComments: state.user.adminStats?.totalComments || 0,
        totalUsers: state.user.adminStats?.totalUsers || 0,
        totalBlogs: state.user.adminStats?.totalBlogs || 0,
        totalCategories: state.user.adminStats?.totalCategories || 0,
        monthlyGrowth: state.user.monthlyPerformance?.monthlyGrowth || 0,
        topBlogs: state.user.adminStats?.topBlogs || [],
        recentStats: state.user.adminStats?.recentStats || [],
        usersByRole: state.user.adminStats?.usersByRole || {},
        recentRegistrations: state.user.adminStats?.recentRegistrations || 0,
        monthlyRegistrations:
          state.user.monthlyPerformance?.monthlyRegistrations || [],
      });
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      showToast("error", "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Process analytics data when Redux state changes
  useEffect(() => {
    if (adminStats && monthlyPerformance && blogs.length > 0) {
      // Calculate total views from blog reads
      const totalViews = blogs.reduce(
        (sum, blog) => sum + (blog.activity?.total_reads || 0),
        0
      );

      // Calculate total likes (estimate based on blogs)
      const totalLikes = blogs.reduce(
        (sum, blog) => sum + (blog.likes || 0),
        0
      );

      // Process monthly registrations for trends
      const monthlyRegistrations = adminStats.monthlyRegistrations || [];
      const recentMonths = monthlyRegistrations.slice(-4); // Last 4 months

      // Calculate growth percentage
      const currentMonth = recentMonths[recentMonths.length - 1]?.count || 0;
      const previousMonth = recentMonths[recentMonths.length - 2]?.count || 0;
      const monthlyGrowth =
        previousMonth > 0
          ? ((currentMonth - previousMonth) / previousMonth) * 100
          : 0;

      // Get top blogs by views
      const topBlogs = blogs
        .filter((blog) => !blog.draft)
        .sort(
          (a, b) =>
            (b.activity?.total_reads || 0) - (a.activity?.total_reads || 0)
        )
        .slice(0, 5)
        .map((blog) => ({
          title: blog.title,
          views: blog.activity?.total_reads || 0,
          likes: blog.likes || 0,
          slug: blog.slug,
          author: blog.author?.personal_info?.name || "Unknown",
        }));

      setAnalytics({
        totalViews,
        totalLikes,
        totalComments: adminStats.totalComments,
        totalUsers: adminStats.totalUsers,
        totalBlogs: adminStats.totalBlogs,
        totalCategories: adminStats.totalCategories,
        monthlyGrowth: Math.round(monthlyGrowth),
        topBlogs,
        recentStats: monthlyPerformance,
        usersByRole: adminStats.usersByRole,
        recentRegistrations: adminStats.recentRegistrations,
        monthlyRegistrations: adminStats.monthlyRegistrations,
      });
    }
  }, [adminStats, monthlyPerformance, blogs]);

  const StatCard = ({ icon, title, value, color = "blue" }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {React.createElement(icon, { className: `h-4 w-4 text-${color}-600` })}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? "..." : value.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            Analytics Dashboard
          </h1>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Eye}
            title="Total Views"
            value={analytics.totalViews}
            color="blue"
          />
          <StatCard
            icon={Heart}
            title="Total Likes"
            value={analytics.totalLikes}
            color="red"
          />
          <StatCard
            icon={MessageSquare}
            title="Comments"
            value={analytics.totalComments}
            color="green"
          />
          <StatCard
            icon={Users}
            title="Active Users"
            value={analytics.totalUsers}
            color="purple"
          />
        </div>

        {/* Additional Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={FileText}
            title="Total Blogs"
            value={analytics.totalBlogs}
            color="green"
          />
          <StatCard
            icon={FolderOpen}
            title="Categories"
            value={analytics.totalCategories}
            color="orange"
          />
          <StatCard
            icon={Users}
            title="New Users"
            value={analytics.recentRegistrations}
            color="indigo"
          />
        </div>

        {/* Content Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performing Blogs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Performing Blogs
              </CardTitle>
              <CardDescription>
                Most viewed blog posts this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topBlogs.map((blog, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-accent/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{blog.title}</p>
                      <p className="text-xs text-muted-foreground">
                        by {blog.author}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {blog.views.toLocaleString()} views
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {blog.likes} likes
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline">#{index + 1}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Monthly Performance
              </CardTitle>
              <CardDescription>
                Engagement metrics over recent months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyPerformance && monthlyPerformance.length > 0 ? (
                  monthlyPerformance.map((stat, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-accent/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{stat.period}</p>
                        <p className="text-xs text-muted-foreground">
                          Performance overview
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3 text-blue-600" />
                            {stat.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-green-600" />
                            {stat.users}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3 text-purple-600" />
                            {stat.comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3 text-orange-600" />
                            {stat.blogs}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3 text-red-600" />
                            {stat.likes}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : monthlyPerformanceLoading ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      Loading monthly performance...
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      No performance data available
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Demographics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Demographics
            </CardTitle>
            <CardDescription>User distribution by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg border">
                <div className="text-2xl font-bold mb-1">
                  {analytics.usersByRole?.user || 0}
                </div>
                <p className="text-sm font-medium">Regular Users</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.totalUsers > 0
                    ? Math.round(
                        (analytics.usersByRole?.user / analytics.totalUsers) *
                          100
                      )
                    : 0}
                  % of total
                </p>
              </div>

              <div className="text-center p-4 bg-muted/50 rounded-lg border">
                <div className="text-2xl font-bold mb-1">
                  {analytics.usersByRole?.author || 0}
                </div>
                <p className="text-sm font-medium">Authors</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.totalUsers > 0
                    ? Math.round(
                        (analytics.usersByRole?.author / analytics.totalUsers) *
                          100
                      )
                    : 0}
                  % of total
                </p>
              </div>

              <div className="text-center p-4 bg-muted/50 rounded-lg border">
                <div className="text-2xl font-bold mb-1">
                  {analytics.usersByRole?.admin || 0}
                </div>
                <p className="text-sm font-medium">Administrators</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.totalUsers > 0
                    ? Math.round(
                        (analytics.usersByRole?.admin / analytics.totalUsers) *
                          100
                      )
                    : 0}
                  % of total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
