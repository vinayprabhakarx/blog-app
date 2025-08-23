import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Import routes
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import blogRoutes from "./routes/blog.route.js";
import commentRoutes from "./routes/comment.route.js";
import categoryRoutes from "./routes/category.route.js";
import blogLikeRoutes from "./routes/blogLike.route.js";
import notificationRoutes from "./routes/notification.route.js";

// Load environment variables
dotenv.config();

// Debug: Check environment variables
console.log("🔧 Environment Variables Debug:");
console.log("🔧 PORT:", process.env.PORT);
console.log("🔧 CORS_ORIGIN:", process.env.CORS_ORIGIN);
console.log(
  "🔧 MONGODB_URI:",
  process.env.MONGODB_URI ? "LOADED" : "NOT LOADED"
);
console.log("🔧 JWT_SECRET:", process.env.JWT_SECRET ? "LOADED" : "NOT LOADED");
console.log(
  "🔧 JWT_SECRET length:",
  process.env.JWT_SECRET ? process.env.JWT_SECRET.length : "N/A"
);
console.log("🔧 NODE_ENV:", process.env.NODE_ENV);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

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

connectDB();

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/categories/:categoryId/blogs", blogRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", blogLikeRoutes);
app.use("/api/notifications", notificationRoutes);

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
