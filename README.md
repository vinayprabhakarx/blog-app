# Blog App

A full-stack blog application with a Node.js/Express backend (API) and a React (Vite) frontend (client).
The app provides authentication, blog publishing, comments, likes, notifications, and admin/user role management.

---

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

---

## Features

- User authentication (JWT-based register/login)
- Email verification (Mailgun API/SMTP)
- Password reset with secure email link
- Blog CRUD (create, read, update, delete)
- Blog categorization (Admin-defined categories)
- Comments and nested replies
- Likes on blogs and comments
- Real-time notifications
- Admin and author roles
- Profile management (name, username, social links)
- Image uploads (Cloudinary)
- Markdown editor with LaTeX math support
- Responsive UI with light/dark mode

---

## Architecture

- **Backend (API):** Node.js + Express.js with MongoDB (Mongoose ODM)
- **Frontend (Client):** React (Vite) + Redux Toolkit
- **Storage & Media:** MongoDB Atlas + Cloudinary
- **Email Delivery:** Mailgun API/SMTP (with Nodemailer fallback)
- **Authentication:** JWT-based auth (access + refresh tokens)

---

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

---

## Backend (API)

**Tech Stack:** Node.js, Express.js, MongoDB, Mongoose

**Main Features:**

- Authentication & Authorization (JWT)
- Email verification & password reset
- Blog, category, comments, likes, notifications APIs
- Image upload with Cloudinary
- Role-based access (admin, author, user)

**Important Files:**

- `server.js` – API entry point
- `controllers/` – Business logic
- `routes/` – API endpoints
- `middleware/` – Auth & error handling
- `utils/sendEmail.js` – Mailgun + SMTP email handling

---

## Frontend (Client)

**Tech Stack:** React, Vite, Redux Toolkit

**Main Features:**

- Auth flows (login, register, reset password)
- Blog creation, editing, viewing
- Comments, replies, and likes
- Notifications panel
- User profile & settings
- Light/Dark theme toggle

**Important Files:**

- `src/pages/` – Application pages (Home, Blog, Profile, etc.)
- `src/components/` – Shared components
- `src/features/` – Redux slices per feature
- `src/app/store.js` – Redux store setup

---

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

---

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

---

## Email & Password Reset Flow

- **Email Verification**

  - User registers → verification email sent → secure token in URL → clicking activates account.

- **Password Reset**

  - User requests reset → secure link emailed → link opens reset form → password updated after validation.

**Supported Providers:**

- Mailgun API (preferred)
- SMTP (Mailgun SMTP or other providers)

---

## Deployment & Live Demo

The application is deployed and available for live testing.

- **Frontend:** [https://blog.vinayprabhakar.dev](https://blog.vinayprabhakar.dev)
- **API Base URL:** [https://blog.vinayprabhakar.dev/api](https://blog.vinayprabhakar.dev/api)

---

## Scripts

**Backend:**

- `npm start` – Run production server
- `npm run dev` – Run with Nodemon

**Frontend:**

- `npm run dev` – Start Vite dev server
- `npm run build` – Build production-ready frontend

---

## Contributing

1. Fork this repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes with clear messages
4. Push branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

This project is licensed under the **MIT License**.
