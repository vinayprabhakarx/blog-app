import React, { useState, useEffect } from "react";
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
import {
  Users,
  FileText,
  FolderOpen,
  MessageSquare,
  Plus,
  TrendingUp,
} from "lucide-react";
import { showToast } from "../../utils/showToast";
import api from "../../api/api";

const AdminHome = () => {
  const user = useSelector((state) => state.user);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBlogs: 0,
    totalCategories: 0,
    totalComments: 0,
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchActivities();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get("/users/admin/stats");
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

  const fetchActivities = async () => {
    try {
      const response = await api.get("/users/admin/recent-activities");
      setActivities(response.data.activities);
      setActivitiesLoading(false);
    } catch (error) {
      showToast(
        "error",
        error.response?.data?.message || "Failed to load recent activities"
      );
      setActivitiesLoading(false);
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
              Welcome back, {user.user?.name}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your blog today.
            </p>
          </div>
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Admin Dashboard
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            title="Total Users"
            value={stats.totalUsers}
            description="Active registered users"
            color="blue"
          />
          <StatCard
            icon={FileText}
            title="Total Blogs"
            value={stats.totalBlogs}
            description="Published articles"
            color="green"
          />
          <StatCard
            icon={FolderOpen}
            title="Categories"
            value={stats.totalCategories}
            description="Blog categories"
            color="purple"
          />
          <StatCard
            icon={MessageSquare}
            title="Comments"
            value={stats.totalComments}
            description="Total comments"
            color="orange"
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickAction
              icon={Plus}
              title="Create Blog"
              description="Write a new blog post"
              to="/blog/add"
              color="primary"
            />
            <QuickAction
              icon={FolderOpen}
              title="Manage Categories"
              description="Add or edit categories"
              to="/categories"
              color="secondary"
            />
            <QuickAction
              icon={Users}
              title="User Management"
              description="Manage user accounts"
              to="/users"
              color="accent"
            />
            <QuickAction
              icon={TrendingUp}
              title="Analytics"
              description="View blog analytics"
              to="/analytics"
              color="muted"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Recent Activity
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Latest Updates</CardTitle>
              <CardDescription>
                Stay updated with the recent activities on your blog
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activitiesLoading ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      Loading activities...
                    </p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      No recent activities found
                    </p>
                  </div>
                ) : (
                  activities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-3 bg-accent/50 rounded-lg"
                    >
                      <div
                        className={`w-2 h-2 bg-${activity.color}-500 rounded-full`}
                      ></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(activity.createdAt)}
                        </p>
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

export default AdminHome;
