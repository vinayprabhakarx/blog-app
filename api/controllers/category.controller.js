import Category from "../models/category.model.js";
import Blog from "../models/blog.model.js";
import {
  handleError,
  databaseError,
  notFoundError,
  forbiddenError,
  conflictError,
} from "../utils/handleError.js";

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private (Admin, Author)
export const createCategory = async (req, res, next) => {
  const { name, description, featured = false } = req.body;

  if (!name) {
    return next(handleError(400, "Category name is required."));
  }

  // Check if category with the same name already exists
  const existingCategory = await Category.findOne({ name }).catch((err) => {
    throw databaseError("checking for existing category", err);
  });

  if (existingCategory) {
    return next(conflictError("A category with this name already exists."));
  }

  const newCategory = new Category({ name, description, featured });
  await newCategory.save().catch((err) => {
    throw databaseError("saving new category", err);
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully.",
    category: newCategory,
  });
};

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
export const getAllCategories = async (req, res, next) => {
  const categories = await Category.find()
    .sort({ name: 1 })
    .catch((err) => {
      throw databaseError("fetching all categories", err);
    });

  // Calculate article count for each category
  const categoriesWithCount = await Promise.all(
    categories.map(async (category) => {
      const articleCount = await Blog.countDocuments({
        category: category._id,
      }).catch((err) => {
        throw databaseError("counting articles for category", err);
      });

      return {
        ...category.toObject(),
        articleCount,
      };
    })
  );

  res.status(200).json({
    success: true,
    count: categoriesWithCount.length,
    categories: categoriesWithCount,
  });
};

// @route   GET /api/categories/:slug
// @desc    Get a single category by its slug
// @access  Public
export const getCategoryBySlug = async (req, res, next) => {
  const { slug } = req.params;
  const category = await Category.findOne({ slug }).catch((err) => {
    throw databaseError("finding category by slug", err);
  });

  if (!category) {
    return next(notFoundError("Category"));
  }

  res.status(200).json({
    success: true,
    category,
  });
};

// @route   GET /api/category/show/:id
// @desc    Get a single category by its ID (for editing)
// @access  Public
export const getCategoryById = async (req, res, next) => {
  const { id } = req.params;
  const category = await Category.findById(id).catch((err) => {
    if (err.name === "CastError")
      throw handleError(400, "Invalid Category ID format");
    throw databaseError("finding category by ID", err);
  });

  if (!category) {
    return next(notFoundError("Category"));
  }

  res.status(200).json({
    success: true,
    category,
  });
};

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Private (Admin)
export const updateCategory = async (req, res, next) => {
  const { id } = req.params;
  const { name, description, featured } = req.body;

  const category = await Category.findById(id).catch((err) => {
    if (err.name === "CastError")
      throw handleError(400, "Invalid Category ID format");
    throw databaseError("finding category to update", err);
  });

  if (!category) {
    return next(notFoundError("Category"));
  }

  if (name) category.name = name;
  if (description !== undefined) category.description = description;
  if (featured !== undefined) category.featured = featured;

  const updatedCategory = await category.save().catch((err) => {
    throw databaseError("updating category", err);
  });

  res.status(200).json({
    success: true,
    message: "Category updated successfully.",
    category: updatedCategory,
  });
};

// @route   DELETE /api/categories/:id
// @desc    Delete a category
// @access  Private (Admin)
export const deleteCategory = async (req, res, next) => {
  const { id } = req.params;

  // Check if any blogs are using this category before deleting
  const blogCount = await Blog.countDocuments({ category: id }).catch((err) => {
    throw databaseError("checking for blogs in category", err);
  });

  if (blogCount > 0) {
    return next(
      forbiddenError(
        `Cannot delete this category because it is associated with ${blogCount} blog(s).`
      )
    );
  }

  const category = await Category.findByIdAndDelete(id).catch((err) => {
    if (err.name === "CastError")
      throw handleError(400, "Invalid Category ID format");
    throw databaseError("deleting category", err);
  });

  if (!category) {
    return next(notFoundError("Category"));
  }

  res.status(200).json({
    success: true,
    message: "Category deleted successfully.",
  });
};
