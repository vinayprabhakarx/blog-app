import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useSelector } from 'react-redux';
import { selectAllCategories } from '@/features/category/categoriesSlice';
import { Home, Search, BookOpen, Users, Settings, Shield, MessageCircle, BarChart, FileText, Lock, Globe, Folder, User, PenTool } from 'lucide-react';

export const useNotFoundContext = () => {
  const location = useLocation();
  const { isAuthenticated, isAdmin, isAuthor, getUserRole } = useAuth();
  const categories = useSelector(selectAllCategories);

  const contextAnalysis = useMemo(() => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    const searchParams = new URLSearchParams(location.search);
    
    // Enhanced context extraction
    const context = {
      path,
      segments,
      searchParams,
      isAdminRoute: path.startsWith('/admin'),
      isAuthorRoute: path.startsWith('/author'),
      isBlogRoute: path.includes('/blog') || segments.includes('blog'),
      isCategoryRoute: path.includes('/category'),
      isUserRoute: path.includes('/profile') || path.includes('/user'),
      isSettingsRoute: path.includes('/settings'),
      isDashboardRoute: path.includes('/dashboard'),
      isAuthRoute: path.includes('/login') || path.includes('/register'),
      isSearchRoute: path.includes('/search'),
      isPublicRoute: !isAuthenticated && !path.startsWith('/admin') && !path.startsWith('/author'),
      slugOrId: segments[segments.length - 1],
      routeType: segments[0],
      subRoute: segments[1],
      hasQuery: searchParams.toString() !== '',
      isEditRoute: path.includes('/edit'),
      isCreateRoute: path.includes('/create'),
      isNestedRoute: segments.length > 2,
    };

    // Determine user's expected destination based on role
    const getUserDashboard = () => {
      if (isAdmin) return { path: '/admin', text: 'Admin Dashboard', icon: Shield };
      if (isAuthor) return { path: '/author', text: 'Author Dashboard', icon: BookOpen };
      return { path: '/profile', text: 'Profile', icon: Users };
    };

    // Generate contextual suggestions based on current route and user role
    const generateSuggestions = (context) => {
      const suggestions = [];
      
      // Always include home
      suggestions.push({ path: '/', text: 'Browse Articles', icon: BookOpen });

      // Add categories if available
      if (categories.length > 0) {
        if (context.isCategoryRoute) {
          // Show popular categories
          categories.slice(0, 4).forEach(cat => {
            suggestions.push({
              path: `/category/${cat.slug}`,
              text: cat.name,
              icon: Search,
            });
          });
        } else {
          suggestions.push({ path: '/category', text: 'Browse Categories', icon: Search });
        }
      }

      // Role-based suggestions
      if (isAuthenticated) {
        const dashboard = getUserDashboard();
        suggestions.push(dashboard);

        if (isAuthor || isAdmin) {
          suggestions.push({ path: '/author/my-blogs', text: 'My Blogs', icon: BookOpen });
          suggestions.push({ path: '/author/blog/create', text: 'Create Blog', icon: BookOpen });
        }

        if (isAdmin) {
          suggestions.push({ path: '/admin/users', text: 'Manage Users', icon: Users });
          suggestions.push({ path: '/admin/analytics', text: 'Analytics', icon: BarChart });
          suggestions.push({ path: '/admin/comments', text: 'Manage Comments', icon: MessageCircle });
        }
      } else {
        suggestions.push({ path: '/login', text: 'Log In', icon: Users });
        suggestions.push({ path: '/register', text: 'Create Account', icon: Users });
      }

      // Remove duplicates and limit to 6 suggestions
      const uniqueSuggestions = suggestions.filter((item, index, self) => 
        index === self.findIndex(t => t.path === item.path)
      ).slice(0, 6);

      return uniqueSuggestions;
    };

    // Generate contextual error messages
    const getContextualContent = () => {
      let content = {
        title: 'Page Not Found',
        message: "The page you're looking for doesn't exist.",
        errorIcon: <FileText className="w-12 h-12" />,
        primaryAction: { path: '/', text: 'Go Home', icon: Home },
        suggestions: [],
        errorType: 'not_found'
      };

      // Admin route handling
      if (context.isAdminRoute) {
        if (!isAuthenticated) {
          return {
            title: 'Login Required',
            message: 'You need to log in to access the admin area.',
            errorIcon: <Lock className="w-12 h-12" />,
            primaryAction: { path: '/login', text: 'Log In', icon: Users },
            suggestions: generateSuggestions(context),
            errorType: 'auth_required'
          };
        }
        
        if (!isAdmin) {
          return {
            title: 'Admin Access Required',
            message: "You don't have permission to access this admin area.",
            errorIcon: <Lock className="w-12 h-12" />,
            primaryAction: getUserDashboard(),
            suggestions: generateSuggestions(context),
            errorType: 'access_denied'
          };
        }

        // Admin route not found
        content = {
          title: 'Admin Page Not Found',
          message: 'The admin page you\'re looking for doesn\'t exist or may have been moved.',
          errorIcon: <Settings className="w-12 h-12" />,
          primaryAction: { path: '/admin', text: 'Admin Dashboard', icon: Shield },
          suggestions: [
            { path: '/admin/blogs', text: 'Manage Blogs', icon: BookOpen },
            { path: '/admin/category', text: 'Manage Categories', icon: Settings },
            { path: '/admin/users', text: 'Manage Users', icon: Users },
            { path: '/admin/analytics', text: 'Analytics', icon: BarChart },
          ],
          errorType: 'admin_not_found'
        };
      }
      
      // Author route handling
      else if (context.isAuthorRoute) {
        if (!isAuthenticated) {
          return {
            title: 'Login Required',
            message: 'You need to log in to access author features.',
            errorIcon: <Lock className="w-12 h-12" />,
            primaryAction: { path: '/login', text: 'Log In', icon: Users },
            suggestions: generateSuggestions(context),
            errorType: 'auth_required'
          };
        }
        
        if (!isAuthor && !isAdmin) {
          return {
            title: 'Author Access Required',
            message: 'You need author privileges to access this area.',
            errorIcon: <PenTool className="w-12 h-12" />,
            primaryAction: { path: '/profile', text: 'Go to Profile', icon: Settings },
            suggestions: generateSuggestions(context),
            errorType: 'author_required'
          };
        }

        content = {
          title: 'Author Page Not Found',
          message: 'The author page you\'re looking for doesn\'t exist.',
          errorIcon: <PenTool className="w-12 h-12" />,
          primaryAction: { path: '/author', text: 'Author Dashboard', icon: BookOpen },
          suggestions: [
            { path: '/author/my-blogs', text: 'My Blogs', icon: BookOpen },
            { path: '/author/blog/create', text: 'Create New Blog', icon: BookOpen },
            { path: '/author/category', text: 'Manage Categories', icon: Settings },
          ],
          errorType: 'author_not_found'
        };
      }
      
      // Blog-related routes
      else if (context.isBlogRoute) {
        const blogSlug = context.slugOrId;
        content = {
          title: 'Blog Not Found',
          message: blogSlug 
            ? `The blog post "${decodeURIComponent(blogSlug)}" doesn't exist or may have been removed.`
            : 'The blog you\'re looking for doesn\'t exist.',
          errorIcon: <BookOpen className="w-12 h-12" />,
          primaryAction: { path: '/', text: 'Browse All Articles', icon: BookOpen },
          suggestions: [
            { path: '/blogs', text: 'View All Blogs', icon: BookOpen },
            ...generateSuggestions(context).slice(1, 4)
          ],
          errorType: 'blog_not_found'
        };
      }
      
      // Category routes
      else if (context.isCategoryRoute) {
        const categorySlug = context.slugOrId;
        content = {
          title: 'Category Not Found',
          message: categorySlug 
            ? `The category "${decodeURIComponent(categorySlug)}" doesn't exist.`
            : 'The category you\'re looking for doesn\'t exist.',
          errorIcon: <Folder className="w-12 h-12" />,
          primaryAction: { path: '/category', text: 'Browse Categories', icon: Search },
          suggestions: [
            { path: '/', text: 'All Articles', icon: BookOpen },
            ...categories.slice(0, 4).map(cat => ({
              path: `/category/${cat.slug}`,
              text: cat.name,
              icon: Search,
            }))
          ],
          errorType: 'category_not_found'
        };
      }
      
      // User/Profile routes
      else if (context.isUserRoute) {
        if (!isAuthenticated) {
          return {
            title: 'Login Required',
            message: 'You need to log in to access your profile.',
            errorIcon: <Lock className="w-12 h-12" />,
            primaryAction: { path: '/login', text: 'Log In', icon: Users },
            suggestions: [
              { path: '/', text: 'Browse Articles', icon: BookOpen },
              { path: '/register', text: 'Create Account', icon: Users },
            ],
            errorType: 'auth_required'
          };
        }

        content = {
          title: 'Profile Page Not Found',
          message: 'The profile page you\'re looking for doesn\'t exist.',
          errorIcon: <User className="w-12 h-12" />,
          primaryAction: { path: '/profile', text: 'My Profile', icon: Users },
          suggestions: generateSuggestions(context),
          errorType: 'profile_not_found'
        };
      }
      
      // Public routes for non-authenticated users
      else if (!isAuthenticated) {
        content = {
          title: 'Page Not Found',
          message: 'The page you\'re looking for doesn\'t exist. Explore our articles or create an account to get started.',
          errorIcon: <Globe className="w-12 h-12" />,
          primaryAction: { path: '/', text: 'Explore Articles', icon: BookOpen },
          suggestions: generateSuggestions(context),
          errorType: 'public_not_found'
        };
      }
      
      // Default for authenticated users
      else {
        content.suggestions = generateSuggestions(context);
        content.primaryAction = getUserDashboard();
        content.errorType = 'authenticated_not_found';
      }

      return content;
    };

    return {
      context,
      content: getContextualContent(),
      userRole: getUserRole(),
      isAuthenticated,
      isAdmin,
      isAuthor,
    };
  }, [location.pathname, location.search, isAuthenticated, isAdmin, isAuthor, categories, getUserRole]);

  return contextAnalysis;
};

export default useNotFoundContext;
