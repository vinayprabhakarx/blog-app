import React from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Users,
  FileText,
  MessageSquare,
  Flag,
  Settings,
  Plus,
  BookOpen,
  Shield,
  User,
  Edit3,
} from "lucide-react";

const UnifiedDashboard = () => {
  const { user, isAdmin, isAuthor } = useAuth();

  const getUserRole = () => {
    if (isAdmin) return "Administrator";
    if (isAuthor) return "Author";
    return "User";
  };

  const getRoleDescription = () => {
    if (isAdmin)
      return "Full system access with global moderation capabilities";
    if (isAuthor)
      return "Content creation and blog management with comment moderation";
    return "Personal content management and community participation";
  };

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
        title: "My Comments",
        description: "View and manage your comments",
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
        }
      );
    }

    if (isAuthor || isAdmin) {
      actions.push({
        title: "Comment Moderation",
        description: "Review and moderate reported comments",
        icon: Flag,
        path: "/comments",
        variant: "outline",
      });
    }

    return actions;
  };

  const getStats = () => {
    const stats = [];

    if (isAdmin) {
      stats.push(
        {
          title: "Total Users",
          value: "1,234",
          icon: Users,
          color: "text-blue-600",
          bgColor: "bg-blue-100 dark:bg-blue-900/20",
        },
        {
          title: "Total Blogs",
          value: "567",
          icon: FileText,
          color: "text-green-600",
          bgColor: "bg-green-100 dark:bg-green-900/20",
        },
        {
          title: "Reported Comments",
          value: "23",
          icon: Flag,
          color: "text-red-600",
          bgColor: "bg-red-100 dark:bg-red-900/20",
        },
        {
          title: "Categories",
          value: "45",
          icon: BookOpen,
          color: "text-purple-600",
          bgColor: "bg-purple-100 dark:bg-purple-900/20",
        }
      );
    } else if (isAuthor) {
      stats.push(
        {
          title: "My Blogs",
          value: "12",
          icon: FileText,
          color: "text-green-600",
          bgColor: "bg-green-100 dark:bg-green-900/20",
        },
        {
          title: "Total Views",
          value: "8,456",
          icon: BarChart3,
          color: "text-blue-600",
          bgColor: "bg-blue-100 dark:bg-blue-900/20",
        },
        {
          title: "Comments",
          value: "89",
          icon: MessageSquare,
          color: "text-purple-600",
          bgColor: "bg-purple-100 dark:bg-purple-900/20",
        },
        {
          title: "Reports",
          value: "3",
          icon: Flag,
          color: "text-orange-600",
          bgColor: "bg-orange-100 dark:bg-orange-900/20",
        }
      );
    } else {
      stats.push(
        {
          title: "My Comments",
          value: "15",
          icon: MessageSquare,
          color: "text-blue-600",
          bgColor: "bg-blue-100 dark:bg-blue-900/20",
        },
        {
          title: "Likes Given",
          value: "67",
          icon: User,
          color: "text-green-600",
          bgColor: "bg-green-100 dark:bg-green-900/20",
        },
        {
          title: "Blogs Read",
          value: "34",
          icon: BookOpen,
          color: "text-purple-600",
          bgColor: "bg-purple-100 dark:bg-purple-900/20",
        },
        {
          title: "Categories",
          value: "8",
          icon: BookOpen,
          color: "text-orange-600",
          bgColor: "bg-orange-100 dark:bg-orange-900/20",
        }
      );
    }

    return stats;
  };

  const quickActions = getQuickActions();
  const stats = getStats();

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back!
            </h1>
            <p className="text-muted-foreground mt-2">
              {user?.personal_info?.name || user?.personal_info?.username},
              you're logged in as a{" "}
              <Badge variant="secondary">{getUserRole()}</Badge>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {getRoleDescription()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              <Shield className="w-4 h-4 mr-1" />
              {isAdmin
                ? "Admin Panel"
                : isAuthor
                ? "Author Dashboard"
                : "User Dashboard"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card
              key={index}
              className="hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <IconComponent className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Link key={index} to={action.path}>
                  <Card className="hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">
                            {action.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Role-specific Information */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="text-center space-y-2">
            <h4 className="font-medium text-foreground">Dashboard Overview</h4>
            <p className="text-sm text-muted-foreground">
              {isAdmin &&
                "As an administrator, you have access to all system features including user management, global moderation, and analytics."}
              {isAuthor &&
                !isAdmin &&
                "As an author, you can create and manage blogs, moderate comments on your content, and view your performance metrics."}
              {!isAuthor &&
                !isAdmin &&
                "As a user, you can manage your comments, explore content, and participate in the community."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedDashboard;
