<div align="center">

# Blog App

A full-stack blog application with a Node.js/Express backend (API) and a React (Vite) frontend (client).  
The app provides authentication, blog publishing, comments, likes, notifications, and admin/user role management.

</div>

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Backend (API)](#backend-api)
- [Frontend (Client)](#frontend-client)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Email & Password Reset Flow](#email--password-reset-flow)
- [Deployment & Live Demo](#deployment--live-demo)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

## Features

### Core Features

- **Authentication & Authorization**
  - JWT-based register/login with access & refresh tokens
  - Email verification (Mailgun API/SMTP)
  - Secure password reset with email link
  - Role-based access control (admin, author, user)

### Blog Management

- **Rich Content Creation**
  - Markdown editor with live preview and fullscreen mode
  - Image upload with cropping (Cloudinary integration)
  - Auto-save functionality (all form fields via localStorage with 12-hour expiry)
  - LaTeX math support for technical content
  - Blog categorization (Admin-defined categories)
  - Draft & publish workflow

### Social Features

- **Comments System**
  - Nested replies with threading
  - User mentions with @ tagging (debounced search, cached results)
  - Real-time comment updates
- **Engagement**
  - Like functionality for blogs and comments
  - Comment count tracking
  - Read time estimation

### Notifications

- **Real-time Updates**
  - Optimized polling (30-second intervals)
  - In-app notification panel
  - Notification summary and filtering
  - Mark as read functionality

### User Experience

- **Profile Management**
  - Customizable profile (name, username, bio, social links)
  - Avatar upload with image cropping
  - Public profile pages
- **UI/UX**
  - Responsive design (mobile-first)
  - Light/dark theme toggle with persistence
  - Accessible search bar with autocomplete
  - Visual distinction for input elements (borders & shadows)

### Admin Dashboard

- **Analytics**
  - Total views tracking
  - Comment statistics
  - Active user count
  - Blog and category management
  - Monthly performance metrics

### Performance Optimizations

- **Memory Management**
  - Proper cleanup of timers and event listeners
  - AbortController for cancellable API requests
  - isMounted flags to prevent state updates after unmount
- **API Efficiency**
  - Request debouncing (300ms for search)
  - Response caching (5-minute expiry, max 50 entries)
  - Rate limiting (max 30 requests/minute for search)
  - Optimized polling intervals
- **Component Optimization**
  - React.memo for expensive components
  - useCallback/useMemo for stable references
  - Lazy loading for images
  - Auto-save debouncing (1-second intervals)

## Architecture

- **Backend (API):** Node.js + Express.js with MongoDB (Mongoose ODM)
- **Frontend (Client):** React (Vite) + Redux Toolkit
- **Storage & Media:** MongoDB Atlas + Cloudinary
- **Email Delivery:** Mailgun API/SMTP (with Nodemailer fallback)
- **Authentication:** JWT-based auth (access + refresh tokens)

## Project Structure

```
root/
│
├── api/         # Node.js/Express backend
│   ├── config/          # Config files (Cloudinary, Mailgun, Multer, JWT)
│   ├── controllers/     # Route controllers (auth, blog, user, etc.)
│   ├── middleware/      # Auth, role, error handling
│   ├── models/          # Mongoose schemas (User, Blog, Category, etc.)
│   ├── routes/          # Express routes
│   ├── templates/       # Email templates (verification, reset password)
│   ├── utils/           # Utility helpers (sendEmail, token, etc.)
│   ├── uploads/         # Temporary file uploads
│   ├── package.json     # Backend dependencies
│   └── server.js        # Backend entry point
│
├── client/      # React frontend
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── api/         # API service functions
│   │   ├── app/         # Redux store & middleware
│   │   ├── assets/      # Logos, images
│   │   ├── components/  # Reusable UI components
│   │   ├── features/    # Redux slices (auth, blog, comments, etc.)
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility libraries
│   │   ├── pages/       # Page-level components
│   │   └── utils/       # Helpers & contexts
│   ├── package.json     # Frontend dependencies
│   └── vite.config.js   # Vite configuration
│
└── README.md    # Documentation
```

## Backend (API)

**Tech Stack:** Node.js, Express.js, MongoDB, Mongoose

**Main Features:**

### Authentication & Security

- **JWT-based Authentication**
  - Access tokens (12-hour expiry)
  - Refresh tokens for session management
  - Secure password hashing (bcrypt)
  - Email verification flow
  - Password reset with secure tokens

### API Endpoints

#### Authentication (`/api/auth`)

- POST `/register` – User registration with email verification
- POST `/login` – User login with JWT tokens
- POST `/verify-email/:token` – Email verification
- POST `/forgot-password` – Password reset request
- POST `/reset-password/:token` – Password reset confirmation
- POST `/logout` – User logout
- POST `/refresh-token` – Refresh access token

#### Blogs (`/api/blogs`)

- GET `/` – List all published blogs (with pagination, filtering)
- GET `/slug/:slug` – Get blog by slug
- GET `/:id` – Get blog by ID (for editing)
- POST `/` – Create new blog (authenticated)
- PUT `/:id` – Update blog (author/admin only)
- DELETE `/:id` – Delete blog (author/admin only)
- POST `/upload-image` – Upload blog image to Cloudinary
- DELETE `/delete-image` – Delete blog image from Cloudinary

#### Comments (`/api/blogs/:blogId/comments`)

- GET `/` – Get all comments for a blog
- POST `/` – Create comment or reply
- PUT `/:commentId` – Update comment (author only)
- DELETE `/:commentId` – Delete comment (author/admin only)
- GET `/search-users/:query` – Search users for @mentions (limit 3)

#### Categories (`/api/categories`)

- GET `/` – List all categories
- POST `/` – Create category (admin only)
- PUT `/:id` – Update category (admin only)
- DELETE `/:id` – Delete category (admin only)

#### Likes (`/api/likes`)

- POST `/toggle` – Toggle like on blog/comment
- POST `/status` – Get user's like status for item
- POST `/batch-status` – Get like status for multiple items

#### Notifications (`/api/notifications`)

- GET `/` – Get user notifications (paginated)
- GET `/unread-count` – Get unread notification count
- GET `/summary` – Get notification summary
- PUT `/:id/read` – Mark notification as read
- PUT `/mark-all-read` – Mark all as read
- DELETE `/:id` – Delete notification

#### User Management (`/api/users`)

- GET `/me` – Get current user profile
- PUT `/me` – Update current user profile
- GET `/:username` – Get public user profile
- GET `/admin/stats` – Admin analytics (admin only)
- GET `/admin/monthly-performance` – Monthly metrics (admin only)
- GET `/admin/users` – List all users (admin only)

### Database Models

- **User** – Authentication, profile, social links
- **Blog** – Content, metadata, activity stats
- **Comment** – Comments with threading support
- **Category** – Blog categorization
- **Like** – Like tracking for blogs/comments
- **Notification** – User notifications

### Middleware

- **Authentication** (`authenticate.js`) – Verify JWT tokens
- **Authorization** (`authorize.js`) – Role-based access
- **onlyAdmin** – Admin-only routes
- **onlyAuthor** – Author/admin routes
- Error handling middleware

### Optimization Features

- **Performance**
  - Indexed database queries
  - Aggregation pipelines for analytics
  - Lean queries where appropriate
  - Pagination for large datasets
- **API Efficiency**
  - Reduced polling intervals (30s for notifications)
  - Removed unnecessary view count tracking
  - Optimized monthly performance calculations
  - Limited search results (max 3 for user mentions)

**Important Files:**

- `server.js` – API entry point
- `controllers/` – Business logic for each resource
  - `auth.controller.js` – Authentication flows
  - `blog.controller.js` – Blog CRUD operations
  - `comment.controller.js` – Comment management
  - `user.controller.js` – User profiles & admin stats
  - `notification.controller.js` – Notification handling
- `routes/` – API route definitions
- `middleware/` – Auth, authorization, error handling
- `models/` – Mongoose schemas
- `utils/sendEmail.js` – Email delivery (Mailgun + SMTP)
- `config/` – Configuration files (Cloudinary, Multer)

## Frontend (Client)

**Tech Stack:** React 19.1.1, Vite 6.3.5, Redux Toolkit, Tailwind CSS

**Main Features:**

### User Interface

- **Pages**
  - Home page with blog listing and category filtering
  - Individual blog page with full content display
  - User profile pages (public & own profile)
  - Admin dashboard with analytics
  - Settings page (profile editing, password change)
- **Components**
  - Markdown editor with toolbar (H1-H3, Bold, Italic, Links, Images, Code blocks, Tables)
  - Image cropper with preview
  - Search bar with autocomplete and caching
  - Comment section with nested replies
  - Like button with optimistic updates
  - Notification dropdown with real-time updates
  - Theme toggle (light/dark mode)

### State Management

- **Redux Toolkit Slices**
  - `authSlice` – User authentication & session
  - `blogSlice` – Blog CRUD operations
  - `commentSlice` – Comments & replies
  - `likeSlice` – Like functionality
  - `notificationSlice` – Notification management
  - `categorySlice` – Category data
  - `userSlice` – User profiles & admin stats

### Optimization Features

- **Performance**
  - Component memoization (React.memo)
  - Callback memoization (useCallback)
  - Value memoization (useMemo)
  - Image lazy loading
  - Request debouncing & throttling
  - Response caching with expiry
  - AbortController for cancellable requests
- **Memory Management**
  - Proper cleanup of timers, listeners, and controllers
  - isMounted flags for async operations
  - Cache size limits (max 50 entries)
  - Auto-cleanup of old cache entries

**Important Files:**

- `src/pages/` – Application pages (HomePage, BlogPage, ProfilePage)
- `src/components/common/` – Shared components (SearchBar, Footer, Topbar)
- `src/components/layout/` – Layout components (AppLayout, Sidebar)
- `src/features/` – Feature modules with Redux slices
  - `blog/` – Blog editor, display, form
  - `comment/` – Comment management, forms
  - `auth/` – Login, register, verification
  - `notification/` – Notification center
  - `user_management/` – Admin analytics & user management
- `src/app/store.js` – Redux store configuration
- `src/hooks/` – Custom hooks (useAuth, useBlogLike, useFetch, etc.)
- `src/utils/` – Utility functions & contexts

## Setup & Installation

### Prerequisites

- Node.js v20+
- MongoDB (local or Atlas)
- Mailgun (or SMTP credentials)
- Cloudinary account

### 1. Clone repository

```bash
git clone https://github.com/vinayprabhakarx/blog-app.git
cd blog-app
```

### 2. Install dependencies

**Backend**

```bash
cd api
npm install
```

**Frontend**

```bash
cd ../client
npm install
```

### 3. Configure environment variables

- Copy `.env.example` → `.env` in both **api/** and **client/**
- Add credentials (MongoDB URI, JWT, Mailgun, Cloudinary, etc.)

### 4. Run application

**Backend**

```bash
cd api
npm run dev
```

**Frontend**

```bash
cd client
npm run dev
```

## Environment Variables

### Backend (`api/.env`)

- `MONGODB_URI` – MongoDB connection string
- `JWT_SECRET` – Secret for JWT signing
- `CLOUDINARY_*` – Cloudinary API credentials
- `MAILGUN_API_KEY` – Mailgun API key
- `MAILGUN_DOMAIN` – Mailgun domain
- `MAILGUN_FROM` – Default sender email
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` – SMTP fallback
- `DOMAIN` – App domain for links

### Frontend (`client/.env`)

- `VITE_API_URL` – API base URL

## Email & Password Reset Flow

- **Email Verification**

  - User registers → verification email sent → secure token in URL → clicking activates account.

- **Password Reset**

  - User requests reset → secure link emailed → link opens reset form → password updated after validation.

**Supported Providers:**

- Mailgun API (preferred)
- SMTP (Mailgun SMTP or other providers)

## Deployment & Live Demo

The application is deployed and available for live testing.

- **Frontend:** [https://blog.vinayprabhakar.dev](https://blog.vinayprabhakar.dev)
- **API Base URL:** [https://blog.vinayprabhakar.dev/api](https://blog.vinayprabhakar.dev/api)

## Scripts

**Backend (api/):**

- `npm start` – Run production server
- `npm run dev` – Run with Nodemon (hot reload)
- `npm test` – Run tests (if configured)

**Frontend (client/):**

- `npm run dev` – Start Vite dev server (http://localhost:5173)
- `npm run build` – Build production-ready frontend
- `npm run preview` – Preview production build locally
- `npm run lint` – Run ESLint

## Performance & Optimization

### Memory Management

- **Cleanup Mechanisms**
  - Timers cleared on component unmount
  - Event listeners removed properly
  - AbortControllers cancel pending requests
  - isMounted flags prevent state updates after unmount

### API Call Optimization

- **Notification Polling:** 30-second intervals (66% reduction from 10s)
- **Search Debouncing:** 300ms delay before API call
- **User Mention Search:** 300ms debounce + 5-minute cache + limit 3 results
- **Request Cancellation:** AbortController for all async requests
- **Rate Limiting:** Max 30 search requests per minute

### Caching Strategy

- **Client-Side Caching**
  - Search results: 5-minute expiry, max 50 entries
  - User mentions: 5-minute expiry, max 50 entries
  - Auto-save: localStorage with 12-hour expiry for all form fields
  - Cache cleanup: FIFO (First In, First Out)

### Component Optimization

- **React Performance**
  - React.memo for expensive components (SearchBar, CommentForm)
  - useCallback for stable function references
  - useMemo for computed values
  - Lazy loading for images (loading="lazy")

### Database Optimization

- **MongoDB Indexing**
  - Indexed fields for fast queries
  - Aggregation pipelines for analytics
  - Lean queries where possible
  - Pagination for large datasets

## Contributing

1. Fork this repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes with clear messages
4. Push branch: `git push origin feature/your-feature`
5. Open a Pull Request

## License

This project is licensed under the **MIT License**.
