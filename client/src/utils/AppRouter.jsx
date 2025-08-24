import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import AdminRoute from "./AdminRoute";
import AppLayout from "../components/layout/AppLayout";
import HomePage from "../pages/HomePage";
import Login from "../features/auth/Login";
import Signup from "../features/auth/Signup";
import ProfilePage from "../pages/ProfilePage";
import EditProfile from "../features/settings/EditProfile";
import ChangePassword from "../features/settings/ChangePassword";
import Dashboard from "../features/dashboard/Dashboard";
import CommentManagement from "../features/comment/CommentManagement";
import NotificationDashboard from "../features/notification/NotificationDashboard";

import CategoryManagement from "../features/category/CategoryManagement";
import PublicCategoriesView from "../features/category/CategoryView";
import CategoryForm from "../features/category/CategoryForm";
import BlogList from "../features/blog/BlogList";
import BlogForm from "../features/blog/BlogForm";
import BlogFormWrapper from "../features/blog/BlogFormWrapper";
import BlogPage from "../pages/BlogPage";
import NotFound from "../components/common/NotFound";
import DashboardRedirect from "../components/common/DashboardRedirect";
import UserManagement from "../features/user_management/UserManagement";
import Analytics from "../features/user_management/Analytics";
import { useAuth } from "../hooks/useAuth";

// ConditionalCategories component
const ConditionalCategories = () => {
  const { isAdmin, isAuthor } = useAuth();

  if (isAdmin || isAuthor) {
    return <CategoryManagement />;
  }

  return <PublicCategoriesView />;
};

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          {/* Auth Routes */}
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Signup />} />

          {/* Home Page */}
          <Route index element={<HomePage />} />

          {/* Blog Routes */}
          <Route path="blog/:slug" element={<BlogPage />} />
          <Route path="blog/id/:id" element={<BlogPage />} />
          <Route path="category/:slug" element={<BlogList />} />
          <Route path="browse-categories" element={<PublicCategoriesView />} />
          <Route path="categories" element={<ConditionalCategories />} />
          <Route path=":username" element={<ProfilePage />} />
          <Route path=":username/blogs" element={<BlogList />} />

          {/* Private Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="blogs" element={<BlogList />} />
            <Route path="blogs/create" element={<BlogForm />} />
            <Route path="blogs/edit/:slug" element={<BlogFormWrapper />} />
            <Route path="my-blogs" element={<BlogList />} />
            <Route path="notifications" element={<NotificationDashboard />} />
            <Route path="categories/add" element={<CategoryForm />} />
            <Route path="categories/edit/:id" element={<CategoryForm />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="edit-profile" element={<EditProfile />} />
            <Route path="change-password" element={<ChangePassword />} />

            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route path="users" element={<UserManagement />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="comments" element={<CommentManagement />} />
            </Route>

            {/* Legacy Routes */}
            <Route path="user" element={<DashboardRedirect />} />
            <Route path="admin" element={<DashboardRedirect />} />
            <Route path="author" element={<DashboardRedirect />} />
            <Route path="admin/*" element={<DashboardRedirect />} />
            <Route path="author/*" element={<DashboardRedirect />} />

            {/* Blog Routes */}
            <Route path="write-blog" element={<BlogForm />} />
            <Route path="edit-blog/:slug" element={<BlogFormWrapper />} />
            <Route path="editor/:id" element={<BlogFormWrapper />} />

            <Route path="blog/preview/:id" element={<BlogPage />} />
          </Route>
        </Route>

        {/* Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
