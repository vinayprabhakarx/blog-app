import express from "express";
import { check } from "express-validator";
import {
  createCategory,
  getAllCategories,
  getCategoryBySlug,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import onlyAdmin from "../middleware/onlyAdmin.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

// --- Validation Rules ---
const categoryValidation = [
  check("name", "Category name is required and cannot exceed 50 characters.")
    .not()
    .isEmpty()
    .isLength({ max: 50 }),
  check("description", "Description cannot exceed 200 characters.")
    .optional()
    .isLength({ max: 200 }),
];

// --- Public Routes ---

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get("/", asyncHandler(getAllCategories));

// @route   GET /api/categories/show/:id
// @desc    Get a single category by ID (for editing)
// @access  Public
router.get("/show/:id", asyncHandler(getCategoryById));

// @route   GET /api/categories/:slug
// @desc    Get a single category by slug
// @access  Public
router.get("/:slug", asyncHandler(getCategoryBySlug));

// --- Private Routes (Author & Admin) ---

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private (Author, Admin)
router.post(
  "/",
  authenticate,
  authorize("admin", "author"),
  categoryValidation,
  asyncHandler(createCategory)
);

// --- Admin-Only Routes ---

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Private (Admin)
router.put(
  "/:id",
  authenticate,
  onlyAdmin,
  categoryValidation,
  asyncHandler(updateCategory)
);

// @route   DELETE /api/categories/:id
// @desc    Delete a category
// @access  Private (Admin)
router.delete("/:id", authenticate, onlyAdmin, asyncHandler(deleteCategory));

export default router;
