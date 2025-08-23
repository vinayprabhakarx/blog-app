import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { FileText, MessageSquare, Plus, Eye, TrendingUp } from "lucide-react";
import api from "../../api/api";
import { showToast } from "../../utils/showToast";

const AuthorDashboard = () => {
  const { user } = useSelector((state) => state.user);
  const [stats, setStats] = useState({
    totalMyBlogs: 0,
    totalCommentsOnMyBlogs: 0,
    totalViewsOnMyBlogs: 0,
    publishedBlogs: 0,
    draftBlogs: 0,
  });
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blogsLoading, setBlogsLoading] = useState(true);

  useEffect(() => {
    fetchAuthorStats();
    fetchRecentBlogs();
  }, []);

  const fetchAuthorStats = async () => {
    try {
      const response = await api.get("/users/author/stats");
      setStats(response.data.stats);
      setLoading(false);
    } catch (error) {
      showToast(
        "error",
        error.response?.data?.message || "Failed to load dashboard stats"
      );
      setLoading(false);
    }
  };

  const fetchRecentBlogs = async () => {
    try {
      const response = await api.get("/users/author/recent-blogs");
      setRecentBlogs(response.data.blogs);
      setBlogsLoading(false);
    } catch (error) {
      showToast(
        "error",
        error.response?.data?.message || "Failed to load recent blogs"
      );
      setBlogsLoading(false);
    }
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

  const StatCard = ({ icon, title, value, description, color = "blue" }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {React.createElement(icon, { className: `h-4 w-4 text-${color}-600` })}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? "..." : value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  const QuickAction = ({ icon, title, description, to, color = "primary" }) => (
    <Link to={to}>
      <Card className="hover:shadow-md transition-all hover:scale-105 cursor-pointer">
        <CardHeader className="text-center">
          <div
            className={`mx-auto w-12 h-12 bg-${color}/10 rounded-lg flex items-center justify-center mb-2`}
          >
            {React.createElement(icon, { className: `h-6 w-6 text-${color}` })}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's your blog performance overview.
            </p>
          </div>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Author Dashboard
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={FileText}
            title="Total Blogs"
            value={stats.totalMyBlogs}
            description="Your published articles"
            color="blue"
          />
          <StatCard
            icon={MessageSquare}
            title="Total Comments"
            value={stats.totalCommentsOnMyBlogs}
            description="Comments on your blogs"
            color="green"
          />
          <StatCard
            icon={Eye}
            title="Total Views"
            value={stats.totalViewsOnMyBlogs || 0}
            description="Views on your content"
            color="purple"
          />
          <StatCard
            icon={TrendingUp}
            title="Published"
            value={stats.publishedBlogs}
            description="Live articles"
            color="orange"
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuickAction
              icon={Plus}
              title="Write New Blog"
              description="Create a new blog post"
              to="/blog/create"
              color="primary"
            />
            <QuickAction
              icon={FileText}
              title="My Blogs"
              description="Manage your blog posts"
              to="/my-blogs"
              color="secondary"
            />
            <QuickAction
              icon={TrendingUp}
              title="Analytics"
              description="View your blog analytics"
              to="/author/analytics"
              color="accent"
            />
          </div>
        </div>

        {/* Recent Blogs */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Recent Blogs
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Your Latest Posts</CardTitle>
              <CardDescription>
                Recently published and drafted blog posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {blogsLoading ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Loading blogs...</p>
                  </div>
                ) : recentBlogs.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      No blogs found. Start writing your first blog!
                    </p>
                  </div>
                ) : (
                  recentBlogs.map((blog, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-accent/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{blog.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(blog.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={blog.draft ? "secondary" : "default"}
                          className="text-xs"
                        >
                          {blog.draft ? "Draft" : "Published"}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthorDashboard;
