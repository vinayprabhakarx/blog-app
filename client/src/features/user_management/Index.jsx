import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate } from "react-router-dom";
import { fetchAllBlogs as fetchBlogs } from "../blog/blogSlice";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import BlogCard from "../../features/blog/BlogCard";

const Index = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const { blogs, loading, error } = useSelector((state) => state.blog);

  // Load blogs on component mount
  useEffect(() => {
    dispatch(fetchBlogs({ page: 1, limit: 6 })); // Load first 6 blogs
  }, [dispatch]);

  // If user is logged in and is admin, redirect to dashboard
  if (user.isLoggedIn && user.user?.role === "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // For regular users and non-logged-in users, show regular home
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Welcome to Our Blog
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Discover amazing stories and insights from our community
          </p>
          {!user.isLoggedIn && (
            <div className="space-x-4">
              <Link
                to="/signin"
                className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="inline-block border border-border text-foreground px-6 py-3 rounded-lg hover:bg-accent transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
          {user.isLoggedIn && user.user?.role === "user" && (
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Welcome back, {user.user.name}!
              </h2>
              <p className="text-muted-foreground">
                Ready to explore and share your thoughts?
              </p>
            </div>
          )}
        </div>

        {/* Latest Blogs Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-foreground">Latest Blogs</h2>
            <Link
              to="/blogs"
              className="text-primary hover:text-primary/80 font-medium"
            >
              View All →
            </Link>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="h-64">
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full mb-2" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">
                Failed to load blogs: {error}
              </p>
              <button
                onClick={() => dispatch(fetchBlogs({ page: 1, limit: 6 }))}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Blogs Grid */}
          {!loading && !error && blogs && blogs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <BlogCard key={blog._id} blog={blog} variant="default" />
              ))}
            </div>
          )}

          {/* No Blogs State */}
          {!loading && !error && (!blogs || blogs.length === 0) && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">
                No blogs available yet.
              </p>
              {user.isLoggedIn && user.user?.role === "admin" && (
                <Link
                  to="/admin/blog/add"
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Create First Blog
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
