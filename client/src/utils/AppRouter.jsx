import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";
import AdminRoute from "./AdminRoute";
import AuthorRoute from "./AuthorRoute";
import AppLayout from "@/components/layout/AppLayout";
import FullScreenLoader from "@/components/common/FullScreenLoader";
import { useAuth } from "@/hooks/useAuth";
import ScrollToTop from "@/components/common/ScrollToTop";

// Critical / Lightweight / Public Auth Pages (Static direct imports - instant load, no network chunk requests)
import HomePage from "@/pages/HomePage";
import Login from "@/features/auth/Login";
import Signup from "@/features/auth/Signup";
import ForgotPassword from "@/features/auth/ForgotPassword";
import ResetPassword from "@/features/auth/ResetPassword";
import VerifyEmail from "@/features/auth/VerifyEmail";
import ResendEmail from "@/features/auth/ResendEmail";
import BlogPage from "@/pages/BlogPage";
import PublicCategoriesView from "@/features/category/CategoryView";
import NotFound from "@/components/common/NotFound";
import DashboardRedirect from "@/components/common/DashboardRedirect";
import Dashboard from "@/features/dashboard/Dashboard";
import ChangePassword from "@/features/settings/ChangePassword";
import NotificationCenter from "@/features/notification/NotificationCenter";

// Heavy / Editor / Admin Management Components (Lazy Loaded - code-split to save initial bundle size)
const BlogForm = React.lazy(() => import("@/features/blog/BlogForm"));
const BlogFormWrapper = React.lazy(() => import("@/features/blog/BlogFormWrapper"));
const BlogManagement = React.lazy(() => import("@/features/blog/BlogManagement"));
const CategoryManagement = React.lazy(() => import("@/features/category/CategoryManagement"));
const CategoryForm = React.lazy(() => import("@/features/category/CategoryForm"));
const UserManagement = React.lazy(() => import("@/features/user_management/UserManagement"));
const Analytics = React.lazy(() => import("@/features/user_management/Analytics"));
const CommentManagement = React.lazy(() => import("@/features/comment/CommentManagement"));
const ProfilePage = React.lazy(() => import("@/pages/ProfilePage"));
const EditProfile = React.lazy(() => import("@/features/settings/EditProfile"));
const ContactManagement = React.lazy(() => import("@/features/contact/ContactManagement"));

// ConditionalCategories component
const ConditionalCategories = () => {
  const { isAdmin, isAuthor, authLoading } = useAuth();

  if (authLoading) return <FullScreenLoader />;

  if (isAdmin || isAuthor) {
    return <CategoryManagement />;
  }

  return <PublicCategoriesView />;
};

const AppRouter = () => {
  return (
    <Router>
      <ScrollToTop />
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            {/* Auth Routes */}
            {/* Public Auth Routes - Only accessible when not logged in */}
            <Route element={<PublicRoute />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Signup />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="resend-email" element={<ResendEmail />} />
            </Route>

            {/* Email Verification Route - Public access */}
            <Route path="verify-email" element={<VerifyEmail />} />

            {/* Home Page */}
            <Route index element={<HomePage />} />

            {/* Blog Routes - Public access */}
            <Route path="blog/:slug" element={<BlogPage />} />
            <Route path="blog/id/:id" element={<BlogPage />} />
            <Route path="blogs" element={<BlogManagement />} />
            <Route path="category/:slug" element={<BlogManagement />} />
            <Route
              path="browse-categories"
              element={<PublicCategoriesView />}
            />
            <Route path="category" element={<ConditionalCategories />} />
            <Route path=":username" element={<ProfilePage />} />
            <Route path=":username/blogs" element={<BlogManagement />} />

            {/* Private Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="notifications" element={<NotificationCenter />} />
              <Route path="category/add" element={<CategoryForm />} />
              <Route path="category/edit/:id" element={<CategoryForm />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="edit-profile" element={<EditProfile />} />
              <Route path="change-password" element={<ChangePassword />} />

              {/* Author Routes - Only for authors and admins */}
              <Route element={<AuthorRoute />}>
                <Route path="my-blogs" element={<BlogManagement />} />
                <Route path="blogs/create" element={<BlogForm />} />
                <Route path="blogs/edit/:slug" element={<BlogFormWrapper />} />
                <Route path="write-blog" element={<BlogForm />} />
                <Route path="edit-blog/:slug" element={<BlogFormWrapper />} />
                <Route path="editor/:id" element={<BlogFormWrapper />} />
                <Route path="comments" element={<CommentManagement />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="users" element={<UserManagement />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="contacts" element={<ContactManagement />} />
              </Route>

              {/* Legacy Routes */}
              <Route path="user" element={<DashboardRedirect />} />
              <Route path="admin" element={<DashboardRedirect />} />
              <Route path="author" element={<DashboardRedirect />} />
              <Route path="admin/*" element={<DashboardRedirect />} />
              <Route path="author/*" element={<DashboardRedirect />} />

              <Route path="blog/preview/:id" element={<BlogPage />} />
            </Route>

            {/* Not Found Route - inside AppLayout to show header/footer */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
};

export default AppRouter;
