# Blog App - Client Refresh

A modern, restructured React application built with Vite, React 19, Redux Toolkit, and Tailwind CSS.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
client-refresh/
├── public/
│   ├── index.html                 # Main HTML template
│   └── logo.svg                   # Application logo
│
├── src/
│   ├── api/                       # API configuration and services
│   │   └── api.js                 # Axios instance with interceptors
│   │
│   ├── app/                       # Redux store configuration
│   │   ├── store.js               # Main store setup with persistence
│   │   └── middleware/            # Custom Redux middleware
│   │       └── syncMiddleware.js  # Synchronization middleware
│   │
│   ├── assets/                    # Static assets
│   │   ├── logo-dark.png          # Dark theme logo
│   │   ├── logo-light.png         # Light theme logo
│   │   └── logo.svg               # SVG logo
│   │
│   ├── components/                # Reusable UI components
│   │   ├── common/                # Common shared components
│   │   │   ├── AppSidebar.jsx     # Main navigation sidebar
│   │   │   ├── DashboardRedirect.jsx # Role-based redirection
│   │   │   ├── Footer.jsx         # Application footer
│   │   │   ├── ImageCropper.jsx   # Image cropping utility
│   │   │   ├── InputBox.jsx       # Custom input component
│   │   │   ├── LoadingButton.jsx  # Button with loading state
│   │   │   ├── LoadingSpinner.jsx # Loading indicator
│   │   │   ├── NotFound.jsx       # 404 error page
│   │   │   ├── Pagination.jsx     # Pagination component
│   │   │   ├── SearchBar.jsx      # Search functionality
│   │   │   ├── ShareDropdown.jsx  # Social sharing dropdown
│   │   │   ├── SocialInputBox.jsx # Social media input
│   │   │   ├── ThemeToggle.jsx    # Dark/light theme toggle
│   │   │   └── Topbar.jsx         # Top navigation bar
│   │   │
│   │   ├── layout/                # Layout components
│   │   │   └── AppLayout.jsx      # Main application layout
│   │   │
│   │   └── ui/                    # Shadcn UI components
│   │       ├── alert-dialog.jsx   # Alert dialog component
│   │       ├── avatar.jsx         # User avatar component
│   │       ├── badge.jsx          # Badge/label component
│   │       ├── button.jsx         # Button component variants
│   │       ├── card.jsx           # Card layout component
│   │       ├── checkbox.jsx       # Checkbox input
│   │       ├── command.jsx        # Command palette
│   │       ├── dialog.jsx         # Modal dialog
│   │       ├── dropdown-menu.jsx  # Dropdown menu
│   │       ├── form.jsx           # Form components
│   │       ├── input.jsx          # Input field
│   │       ├── label.jsx          # Form label
│   │       ├── pagination.jsx     # Pagination UI
│   │       ├── popover.jsx        # Popover component
│   │       ├── select.jsx         # Select dropdown
│   │       ├── separator.jsx      # Visual separator
│   │       ├── sheet.jsx          # Side sheet/drawer
│   │       ├── sidebar.jsx        # Sidebar component
│   │       ├── skeleton.jsx       # Loading skeleton
│   │       ├── switch.jsx         # Toggle switch
│   │       ├── table.jsx          # Data table
│   │       ├── tabs.jsx           # Tab navigation
│   │       ├── textarea.jsx       # Text area input
│   │       └── tooltip.jsx        # Tooltip component
│   │
│   ├── features/                  # Feature-based components and logic
│   │   ├── auth/                  # Authentication features
│   │   │   ├── authSlice.js       # Auth Redux slice
│   │   │   ├── authService.js     # Auth API services
│   │   │   ├── GoogleAuth.jsx     # Google OAuth component
│   │   │   ├── Login.jsx          # Login form
│   │   │   └── Signup.jsx         # Registration form
│   │   │
│   │   ├── author/                # Author-specific features
│   │   │   └── AuthorDashboard.jsx # Author dashboard
│   │   │
│   │   ├── blog/                  # Blog-related features
│   │   │   ├── blogSlice.js       # Blog Redux slice
│   │   │   ├── blogService.js     # Blog API services
│   │   │   ├── BlogCard.jsx       # Blog post card (with clickable images)
│   │   │   ├── BlogEditor.jsx     # Rich text editor
│   │   │   ├── BlogForm.jsx       # Blog creation/edit form
│   │   │   ├── BlogFormWrapper.jsx # Form wrapper component
│   │   │   ├── BlogHeader.jsx     # Blog post header
│   │   │   ├── BlogList.jsx       # Blog listing component
│   │   │   └── MdRenderCard.jsx   # Markdown renderer
│   │   │
│   │   ├── categories/            # Category management
│   │   │   ├── categoriesSlice.js # Categories Redux slice
│   │   │   ├── categoryService.js # Category API services
│   │   │   ├── CategoriesView.jsx # Category listing view
│   │   │   ├── CategoryDetails.jsx # Category details page
│   │   │   ├── CategoryForm.jsx   # Category form
│   │   │   └── CategoryManagement.jsx # Admin category management
│   │   │
│   │   ├── comments/              # Comment system
│   │   │   ├── commentSlice.js    # Comments Redux slice
│   │   │   ├── commentService.js  # Comment API services
│   │   │   ├── Comment.jsx        # Individual comment
│   │   │   ├── CommentForm.jsx    # Comment creation form
│   │   │   ├── CommentManagement.jsx # Admin comment management
│   │   │   ├── CommentSection.jsx # Comments section
│   │   │   └── ReportDialog.jsx   # Comment reporting
│   │   │
│   │   ├── dashboard/             # Dashboard features
│   │   │   └── UnifiedDashboard.jsx # Main dashboard
│   │   │
│   │   ├── likes/                 # Like/reaction system
│   │   │   ├── likeSlice.js       # Likes Redux slice
│   │   │   └── likeService.js     # Like API services
│   │   │
│   │   ├── notifications/         # Notification system
│   │   │   ├── notificationsSlice.js # Notifications Redux slice
│   │   │   ├── notificationService.js # Notification API services
│   │   │   ├── NotificationDashboard.jsx # Notification management
│   │   │   └── NotificationDropdown.jsx # Notification dropdown
│   │   │
│   │   ├── settings/              # User settings
│   │   │   ├── settingsSlice.js   # Settings Redux slice
│   │   │   ├── ChangePassword.jsx # Password change form
│   │   │   └── EditProfile.jsx    # Profile edit form
│   │   │
│   │   └── user/                  # User management
│   │       ├── userSlice.js       # User Redux slice
│   │       ├── userService.js     # User API services
│   │       ├── AdminHome.jsx      # Admin dashboard home
│   │       ├── Analytics.jsx      # User analytics
│   │       ├── Index.jsx          # User index page
│   │       ├── UserManagement.jsx # User management interface
│   │       └── UserProfile.jsx    # User profile component
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAuth.js             # Authentication hook
│   │   ├── useDataSync.js         # Data synchronization hook
│   │   ├── useFetch.js            # Data fetching hook
│   │   ├── use-mobile.js          # Mobile detection hook
│   │   ├── useNotFoundContext.js  # 404 context hook
│   │   ├── useNotificationContext.js # Notification context hook
│   │   ├── useNotifications.js    # Notification management hook
│   │   ├── usePagination.js       # Pagination logic hook
│   │   ├── useRealTimeNotifications.js # Real-time notifications
│   │   ├── useRedux.js            # Redux utilities hook
│   │   └── useTheme.js            # Theme management hook
│   │
│   ├── lib/                       # Library utilities
│   │   └── utils.js               # Utility functions (cn, etc.)
│   │
│   ├── pages/                     # Page-level components
│   │   ├── BlogPage.jsx           # Individual blog post page
│   │   ├── HomePage.jsx           # Main landing page
│   │   └── ProfilePage.jsx        # User profile page
│   │
│   ├── utils/                     # Utility functions and contexts
│   │   ├── AdminRoute.jsx         # Admin route protection
│   │   ├── AppRouter.jsx          # Main application router
│   │   ├── firebase.js            # Firebase configuration
│   │   ├── formatDate.js          # Date formatting utilities
│   │   ├── getEnv.js              # Environment variable helper
│   │   ├── handleDelete.js        # Delete operation handler
│   │   ├── NotificationContext.jsx # Notification context provider
│   │   ├── notificationRefresh.js # Notification refresh utilities
│   │   ├── PrivateRoute.jsx       # Private route protection
│   │   ├── RouteName.js           # Route name constants
│   │   ├── showToast.js           # Toast notification utility
│   │   ├── ThemeContext.jsx       # Theme context provider
│   │   └── utils.js               # General utility functions
│   │
│   ├── App.jsx                    # Root application component
│   ├── index.css                  # Global styles and Tailwind imports
│   └── main.jsx                   # Application entry point
│
├── .gitignore                     # Git ignore rules
├── eslint.config.js               # ESLint configuration
├── index.html                     # HTML entry point
├── package.json                   # Dependencies and scripts
├── postcss.config.js              # PostCSS configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── vite.config.js                 # Vite build configuration
└── README.md                      # This documentation
```

## 🛠️ Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 6.x
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Authentication**: Firebase Auth + JWT
- **Form Handling**: React Hook Form + Zod
- **Markdown**: React Markdown
- **Icons**: Lucide React, React Icons

## 🎯 Key Features

### 📝 Blog Management

- **Rich Text Editor**: Advanced markdown editor with live preview
- **Image Upload**: Integrated image handling with cropping
- **Categories**: Hierarchical category system with featured categories
- **SEO Optimized**: Meta tags and structured data
- **Clickable Images**: Blog card images are fully clickable to open posts

### 👤 User System

- **Authentication**: Email/password and Google OAuth
- **Role-based Access**: Admin, Author, and User roles
- **Profile Management**: Customizable user profiles
- **Real-time Notifications**: Live notification system

### 💬 Interactive Features

- **Comment System**: Threaded comments with moderation
- **Like/Reaction System**: Post engagement tracking
- **Social Sharing**: Integrated social media sharing
- **Search**: Full-text search across content

### 🎨 UI/UX

- **Dark/Light Theme**: System preference detection
- **Responsive Design**: Mobile-first approach
- **Accessible**: WCAG compliant components
- **Performance**: Optimized with lazy loading

## 📱 Responsive Breakpoints

```css
/* Mobile First Approach */
sm: '640px'    /* Small devices */
md: '768px'    /* Medium devices */
lg: '1024px'   /* Large devices */
xl: '1280px'   /* Extra large devices */
2xl: '1536px'  /* 2X Extra large devices */

/* Custom Breakpoints */
tablet-nav: '764px'  /* Tablet navigation */
```

## 🚀 Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
```

### Development Commands

```bash
# Install dependencies
npm install

# Start development server (localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🏗️ Architecture

### State Management

- **Redux Toolkit**: Centralized state management
- **RTK Query**: Efficient data fetching and caching
- **Redux Persist**: State persistence across sessions

### Routing Structure

```
/                    # Homepage with blog listing
/blog/:slug          # Individual blog post
/login               # User authentication
/signup              # User registration
/profile             # User profile page
/dashboard           # Role-based dashboard
/admin/*             # Admin-only routes
/author/*            # Author-only routes
```

### Component Patterns

- **Feature-based**: Components organized by domain
- **Compound Components**: Complex UI patterns
- **Render Props**: Flexible component composition
- **Custom Hooks**: Reusable stateful logic

## 🔐 Authentication Flow

1. **Login/Register**: Email/password or Google OAuth
2. **Token Storage**: JWT stored in localStorage with Redux Persist
3. **Route Protection**: Private/Admin/Author route guards
4. **Auto Refresh**: Automatic token refresh handling
5. **Role-based Access**: Component-level permission checking

## 📊 Performance Optimizations

- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: Lazy loading with fallbacks
- **Bundle Analysis**: Webpack bundle analyzer integration
- **Caching**: Aggressive caching strategies
- **Tree Shaking**: Unused code elimination

## 📦 Build & Deployment

### Production Build

```bash
npm run build
```

### Build Output

- **dist/**: Production build directory
- **assets/**: Static assets with hashing
- **index.html**: Entry point with asset injection

### Deployment Options

- **Vercel**: Zero-config deployment
- **Netlify**: JAMstack hosting
- **AWS S3 + CloudFront**: Custom CDN setup
- **Docker**: Containerized deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use ESLint configuration
- Follow component naming conventions
- Write meaningful commit messages
- Add proper documentation

## 🆘 Troubleshooting

### Common Issues

**Build Fails**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Dev Server Issues**

```bash
# Check port availability
lsof -i :5173
# Kill process if needed
kill -9 <PID>
```

**Import Path Errors**

- Check file extensions (.jsx for React components)
- Verify relative path accuracy
- Ensure proper exports/imports

## 📞 Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Review existing issues and discussions

---

**Made with ❤️ using React 19 and modern web technologies**
