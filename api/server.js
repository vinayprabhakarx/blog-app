import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { testCloudinaryConnection } from "./config/cloudinary.js";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
// Import routes
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import blogRoutes from "./routes/blog.route.js";
import commentRoutes from "./routes/comment.route.js";
import categoryRoutes from "./routes/category.route.js";
import blogLikeRoutes from "./routes/blogLike.route.js";
import notificationRoutes from "./routes/notification.route.js";
import contactRoutes from "./routes/contact.routes.js";
import sitemapRoutes from "./routes/sitemap.route.js";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.set("trust proxy", 1); // Trust reverse proxy for rate limiters (fixes 429 errors in prod)
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "https://blog.vinayprabhakar.dev",
      "http://blog.vinayprabhakar.dev",
      "https://www.vinayprabhakar.dev",
      "https://vinayprabhakar.dev",
      "http://localhost:5173",
    ];

    // Add CORS_ORIGIN from env if it exists
    if (process.env.CORS_ORIGIN) {
      allowedOrigins.push(process.env.CORS_ORIGIN);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Security Middlewares
app.use(helmet());
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body, { replaceWith: '_' });
  if (req.query) mongoSanitize.sanitize(req.query, { replaceWith: '_' });
  if (req.params) mongoSanitize.sanitize(req.params, { replaceWith: '_' });
  next();
});
app.use(hpp());

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased to 500 to prevent 429 errors during normal SPA usage
  message: "Too many requests, please try again after 15 minutes",
});
app.use("/api", limiter);

// Stricter Rate Limiting for Auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: "Too many login attempts, please try again after 15 minutes",
});
// Only apply auth limiter to sensitive endpoints, not logout/verify
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/reset-password", authLimiter);

// Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "blog-app",
    });
    console.log("✅ MongoDB connected successfully.");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const checkCloudinary = async () => {
  try {
    const ok = await testCloudinaryConnection();
    if (ok) {
      console.log("✅ Cloudinary connected successfully.");
    } else {
      console.error(
        "❌ Cloudinary connection failed: Check your credentials and network."
      );
    }
  } catch (err) {
    console.error("❌ Cloudinary connection failed:", err.message);
  }
};

connectDB();
checkCloudinary();

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/category/:categoryId/blogs", blogRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", blogLikeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/send-email", contactRoutes);
app.use("/sitemap.xml", sitemapRoutes);
app.use("/api/sitemap.xml", sitemapRoutes);


// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (statusCode >= 500) {
    console.error(`[ERROR] ${statusCode} - ${message}`, {
      details: err.details,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(statusCode).json({
    success: false,
    type: err.type || "SERVER_ERROR",
    message,
    ...(err.details && { details: err.details }),
  });
});

// Start Server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
});
