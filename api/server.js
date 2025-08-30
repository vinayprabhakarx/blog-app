import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { testCloudinaryConnection } from "./config/cloudinary.js";

// Import routes
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import blogRoutes from "./routes/blog.route.js";
import commentRoutes from "./routes/comment.route.js";
import categoryRoutes from "./routes/category.route.js";
import blogLikeRoutes from "./routes/blogLike.route.js";
import notificationRoutes from "./routes/notification.route.js";
import contactRoutes from "./routes/contact.routes.js";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "https://blog.vinayprabhakar.dev",
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
      console.error("❌ Cloudinary connection failed: Check your credentials and network.");
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
app.use("/api/categories", categoryRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/categories/:categoryId/blogs", blogRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", blogLikeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/contact", contactRoutes);

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
