import express from "express";
import {
  uploadToGallery,
  getGalleryImages,
  getGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  incrementImageUsage,
  getGalleryStats,
  getImageLink,
} from "../controllers/gallery.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import upload, { handleMulterError } from "../config/multer.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Upload image to gallery
router.post(
  "/upload",
  authorize("admin", "author"),
  upload.single("image"),
  handleMulterError,
  uploadToGallery
);

// Get all gallery images with filters
router.get("/", authorize("admin", "author"), getGalleryImages);

// Get gallery statistics
router.get("/stats", authorize("admin", "author"), getGalleryStats);

// Get single gallery image
router.get("/:id", authorize("admin", "author"), getGalleryImage);

// Get image link for markdown
router.get("/:id/link", authorize("admin", "author"), getImageLink);

// Update gallery image details
router.put("/:id", authorize("admin", "author"), updateGalleryImage);

// Delete gallery image
router.delete("/:id", authorize("admin", "author"), deleteGalleryImage);

// Increment image usage count
router.post("/:id/use", authorize("admin", "author"), incrementImageUsage);

export default router;
