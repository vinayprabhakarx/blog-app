# 📖 Blog App

A modern, feature-rich blogging platform built with **React 19**, **Vite**, **Redux Toolkit**, and **Tailwind CSS**.

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

---

## 📂 Project Structure

```
client/
├── public/                        # Public assets (served directly)
│   └── logo.svg                   # Application logo
│
├── src/                           # Application source code
│   ├── api/                       # API configuration & services
│   │   └── api.js                 # Axios instance with interceptors
│   │
│   ├── app/                       # Global state management (Redux)
│   │   ├── store.js               # Redux store setup with persistence
│   │   └── middleware/            # Custom Redux middleware
│   │
│   ├── assets/                    # Static assets (images, logos, etc.)
│   │
│   ├── components/                # Reusable UI components
│   │   ├── common/                # Shared components (Sidebar, Footer, etc.)
│   │   ├── layout/                # Layout wrappers
│   │   └── ui/                    # Shadcn UI components
│   │
│   ├── features/                  # Feature-based modules
│   │   ├── auth/                  # Authentication (slices, services, forms)
│   │   ├── blog/                  # Blog system (editor, list, markdown renderer)
│   │   ├── category/              # Category management
│   │   ├── comments/              # Comment system
│   │   ├── dashboard/             # User/Admin dashboard
│   │   ├── likes/                 # Like/reaction system
│   │   ├── notifications/         # Notification system
│   │   ├── settings/              # User settings (profile, password)
│   │   └── user/                  # User management (admin tools, profiles)
│   │
│   ├── hooks/                     # Custom React hooks
│   ├── lib/                       # Utility libraries
│   ├── pages/                     # Page-level components (Home, Blog, Profile)
│   ├── utils/                     # Utilities & context providers
│   │
│   ├── App.jsx                    # Root application component
│   ├── index.css                  # Global styles (Tailwind)
│   └── main.jsx                   # Application entry point
│
├── .env                           # Environment variables
├── .gitignore                     # Git ignore rules
├── eslint.config.js               # ESLint configuration
├── index.html                     # HTML entry point
├── package.json                   # Project metadata & dependencies
├── postcss.config.js              # PostCSS configuration
├── tailwind.config.js             # Tailwind configuration
├── vite.config.js                 # Vite build configuration
└── README.md                      # Project documentation
```

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite 6
- **State**: Redux Toolkit + RTK Query + Redux Persist
- **Styling**: Tailwind CSS + Shadcn/UI
- **Routing**: React Router v6
- **Auth**: Firebase Auth + JWT
- **Forms**: React Hook Form + Zod
- **Content**: React Markdown
- **HTTP**: Axios
- **Icons**: Lucide React, React Icons

---

## 🎯 Key Features

### 📝 Blog System

- Rich text editor with live markdown preview
- Image upload with cropping support
- Hierarchical categories with featured sections
- SEO-ready with meta tags & structured data
- Clickable blog cards for intuitive navigation

### 👤 User System

- Email/password & Google OAuth authentication
- Role-based access (Admin, Author, User)
- Profile customization & management
- Real-time notifications

### 💬 Interactivity

- Threaded comments with moderation tools
- Like & reaction system
- Social sharing integrations
- Full-text search across blogs

### 🎨 UI/UX

- Dark/light theme with system preference sync
- Mobile-first responsive design
- Accessibility-focused (WCAG compliance)
- Lazy loading & performance optimizations
- **Breakpoints:**

  - sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
  - Custom: tablet-nav (764px)

---

## 🏗️ Architecture

### State Management

- Redux Toolkit for centralized state
- RTK Query for efficient data fetching & caching
- Redux Persist for session persistence

### Routing

The app uses **React Router v6** with a centralized `RouteName.js` for route constants.

#### 📌 Public Routes

```

/ → HomePage (blog listing)
/login → Login page
/register → Signup page
/blog/:slug → Individual blog post (by slug)
/category/:slug → Blog list filtered by category
/category → Category list (public or role-based)
/:username → User profile
/:username/blogs → User's blog listing

```

#### 🔒 Private Routes (Authenticated Users Only)

```

/dashboard → Unified dashboard (author/admin/user)
/blogs → Blog list (authenticated view)
/blogs/create → Create a blog
/blogs/edit/:slug → Edit a blog
/my-blogs → User's blogs
/notifications → User notifications
/category/add → Create new category
/category/edit/:id→ Edit existing category
/profile → Authenticated user's profile
/edit-profile → Edit profile
/change-password → Change password

```

#### 🛡️ Admin Routes (Restricted Access)

```

/users → User management (admin only)
/analytics → Analytics dashboard
/comments → Comment moderation

```

#### 🚦 Legacy & Redirects

```

/user, /admin, /author → Redirected to /dashboard

```

---

### Component Patterns

- **Feature-based** folder organization
- **Compound components** for complex UI
- **Custom hooks** for reusable stateful logic

### Authentication Flow

1. User login/registration (email/password or Google OAuth)
2. JWT stored in localStorage & persisted via Redux
3. Private/Admin/Author route protection
4. Automatic token refresh
5. Role-based UI access & permission checks

---

## 🆘 Troubleshooting

- **Build fails** → Clear `node_modules` & reinstall

  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

- **Dev server issues** → Check port 5173 availability
- **Import path errors** → Ensure `.jsx` extensions & correct exports

---

**Made with ❤️ and using React 19**

