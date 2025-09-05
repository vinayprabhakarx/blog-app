import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";
import AdminRoute from "./AdminRoute";
import AuthorRoute from "./AuthorRoute";
import AppLayout from "../components/layout/AppLayout";
import Loading from "../components/common/Loading";
import { useAuth } from "../hooks/useAuth";

// Lazy load components for better code splitting
const HomePage = React.lazy(() => import("../pages/HomePage"));
const Login = React.lazy(() => import("../features/auth/Login"));
const Signup = React.lazy(() => import("../features/auth/Signup"));
const ForgotPassword = React.lazy(() =>
  import("../features/auth/ForgotPassword")
);
const ResetPassword = React.lazy(() =>
  import("../features/auth/ResetPassword")
);
const VerifyEmail = React.lazy(() => import("../features/auth/VerifyEmail"));
const ProfilePage = React.lazy(() => import("../pages/ProfilePage"));
const EditProfile = React.lazy(() =>
  import("../features/settings/EditProfile")
);
const ChangePassword = React.lazy(() =>
  import("../features/settings/ChangePassword")
);
const Dashboard = React.lazy(() => import("../features/dashboard/Dashboard"));
const CommentManagement = React.lazy(() =>
  import("../features/comment/CommentManagement")
);
const NotificationDashboard = React.lazy(() =>
  import("../features/notification/NotificationDashboard")
);

const CategoryManagement = React.lazy(() =>
  import("../features/category/CategoryManagement")
);
const PublicCategoriesView = React.lazy(() =>
  import("../features/category/CategoryView")
);
const CategoryForm = React.lazy(() =>
  import("../features/category/CategoryForm")
);
const BlogList = React.lazy(() => import("../features/blog/BlogList"));
const BlogForm = React.lazy(() => import("../features/blog/BlogForm"));
const BlogFormWrapper = React.lazy(() =>
  import("../features/blog/BlogFormWrapper")
);
const BlogPage = React.lazy(() => import("../pages/BlogPage"));
const NotFound = React.lazy(() => import("../components/common/NotFound"));
const DashboardRedirect = React.lazy(() =>
  import("../components/common/DashboardRedirect")
);
const UserManagement = React.lazy(() =>
  import("../features/user_management/UserManagement")
);
const Analytics = React.lazy(() =>
  import("../features/user_management/Analytics")
);

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
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            {/* Auth Routes */}
            {/* Public Auth Routes - Only accessible when not logged in */}
            <Route element={<PublicRoute />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Signup />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
            </Route>

            {/* Email Verification Route - Public access */}
            <Route path="verify-email" element={<VerifyEmail />} />

            {/* Home Page */}
            <Route index element={<HomePage />} />

            {/* Blog Routes - Public access */}
            <Route path="blog/:slug" element={<BlogPage />} />
            <Route path="blog/id/:id" element={<BlogPage />} />
            <Route path="blogs" element={<BlogList />} />
            <Route path="category/:slug" element={<BlogList />} />
            <Route
              path="browse-categories"
              element={<PublicCategoriesView />}
            />
            <Route path="categories" element={<ConditionalCategories />} />
            <Route path=":username" element={<ProfilePage />} />
            <Route path=":username/blogs" element={<BlogList />} />

            {/* Private Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="notifications" element={<NotificationDashboard />} />
              <Route path="categories/add" element={<CategoryForm />} />
              <Route path="categories/edit/:id" element={<CategoryForm />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="edit-profile" element={<EditProfile />} />
              <Route path="change-password" element={<ChangePassword />} />

              {/* Author Routes - Only for authors and admins */}
              <Route element={<AuthorRoute />}>
                <Route path="my-blogs" element={<BlogList />} />
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
              </Route>

              {/* Legacy Routes */}
              <Route path="user" element={<DashboardRedirect />} />
              <Route path="admin" element={<DashboardRedirect />} />
              <Route path="author" element={<DashboardRedirect />} />
              <Route path="admin/*" element={<DashboardRedirect />} />
              <Route path="author/*" element={<DashboardRedirect />} />

              <Route path="blog/preview/:id" element={<BlogPage />} />
            </Route>
          </Route>

          {/* Not Found Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default AppRouter;
