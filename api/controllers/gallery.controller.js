import Gallery from "../models/gallery.model.js";
import { uploadImage, deleteImage } from "../config/cloudinary.js";
import { cleanupTempFile } from "../config/multer.js";
import asyncHandler from "../utils/asyncHandler.js";
import path from "path";

// @desc    Upload image to gallery
// @route   POST /api/gallery/upload
// @access  Private (Admin/Author)
export const uploadToGallery = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const { title, description, tags, category } = req.body;

    // Validate required fields
    if (!title) {
      cleanupTempFile(req.file.path);
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadImage(req.file.path, {
      folder: "gallery",
      quality: "auto:good",
      fetch_format: "auto",
    });

    // Clean up temporary file
    cleanupTempFile(req.file.path);

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload image to Cloudinary",
        error: uploadResult.error,
      });
    }

    // Parse tags if provided
    const parsedTags = tags ? tags.split(",").map((tag) => tag.trim()) : [];

    // Create gallery entry
    const galleryItem = new Gallery({
      title: title.trim(),
      description: description?.trim() || "",
      imageUrl: uploadResult.url,
      publicId: uploadResult.publicId,
      originalName: req.file.originalname,
      fileSize: uploadResult.bytes,
      dimensions: {
        width: uploadResult.width,
        height: uploadResult.height,
      },
      format: uploadResult.format,
      uploadedBy: req.user._id,
      tags: parsedTags,
      category: category || "general",
    });

    await galleryItem.save();

    // Populate user info
    await galleryItem.populate("uploadedBy", "name email avatar");

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: galleryItem,
    });
  } catch (error) {
    // Clean up temporary file in case of error
    if (req.file) {
      cleanupTempFile(req.file.path);
    }
    throw error;
  }
});

// @desc    Get all gallery images with filters
// @route   GET /api/gallery
// @access  Private (Admin/Author)
export const getGalleryImages = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    tags,
    uploadedBy,
    dateFrom,
    dateTo,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build filter object
  const filter = {};

  // Category filter
  if (category && category !== "all") {
    filter.category = category;
  }

  // Tags filter
  if (tags) {
    const tagArray = tags.split(",").map((tag) => tag.trim());
    filter.tags = { $in: tagArray };
  }

  // Uploaded by filter
  if (uploadedBy) {
    filter.uploadedBy = uploadedBy;
  }

  // Date range filter
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) {
      filter.createdAt.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      filter.createdAt.$lte = new Date(dateTo);
    }
  }

  // Search filter
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
    ];
  }

  // If not admin, only show public images or user's own images
  if (req.user.role !== "admin") {
    filter.$or = [{ isPublic: true }, { uploadedBy: req.user._id }];
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  // Execute query
  const [images, totalCount] = await Promise.all([
    Gallery.find(filter)
      .populate("uploadedBy", "name email avatar")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Gallery.countDocuments(filter),
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / parseInt(limit));
  const hasNextPage = parseInt(page) < totalPages;
  const hasPrevPage = parseInt(page) > 1;

  res.status(200).json({
    success: true,
    data: {
      images,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit),
      },
    },
  });
});

// @desc    Get single gallery image
// @route   GET /api/gallery/:id
// @access  Private (Admin/Author)
export const getGalleryImage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const image = await Gallery.findById(id).populate(
    "uploadedBy",
    "name email avatar"
  );

  if (!image) {
    return res.status(404).json({
      success: false,
      message: "Image not found",
    });
  }

  // Check permissions
  if (
    req.user.role !== "admin" &&
    !image.isPublic &&
    image.uploadedBy._id.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  res.status(200).json({
    success: true,
    data: image,
  });
});

// @desc    Update gallery image details
// @route   PUT /api/gallery/:id
// @access  Private (Admin/Author - own images)
export const updateGalleryImage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, tags, category, isPublic } = req.body;

  const image = await Gallery.findById(id);

  if (!image) {
    return res.status(404).json({
      success: false,
      message: "Image not found",
    });
  }

  // Check permissions
  if (
    req.user.role !== "admin" &&
    image.uploadedBy.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You can only update your own images",
    });
  }

  // Update fields
  if (title) image.title = title.trim();
  if (description !== undefined) image.description = description.trim();
  if (tags) {
    image.tags = tags.split(",").map((tag) => tag.trim());
  }
  if (category) image.category = category;
  if (isPublic !== undefined) image.isPublic = isPublic;

  await image.save();
  await image.populate("uploadedBy", "name email avatar");

  res.status(200).json({
    success: true,
    message: "Image updated successfully",
    data: image,
  });
});

// @desc    Delete gallery image
// @route   DELETE /api/gallery/:id
// @access  Private (Admin/Author - own images)
export const deleteGalleryImage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const image = await Gallery.findById(id);

  if (!image) {
    return res.status(404).json({
      success: false,
      message: "Image not found",
    });
  }

  // Check permissions
  if (
    req.user.role !== "admin" &&
    image.uploadedBy.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You can only delete your own images",
    });
  }

  // Delete from Cloudinary
  const deleteResult = await deleteImage(image.publicId);

  if (!deleteResult.success) {
    console.error(
      "Failed to delete image from Cloudinary:",
      deleteResult.error
    );
    // Continue with database deletion even if Cloudinary deletion fails
  }

  // Delete from database
  await Gallery.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Image deleted successfully",
  });
});

// @desc    Increment image usage count
// @route   POST /api/gallery/:id/use
// @access  Private (Admin/Author)
export const incrementImageUsage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const image = await Gallery.incrementUsage(id);

  if (!image) {
    return res.status(404).json({
      success: false,
      message: "Image not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Usage count updated",
    data: {
      usage: image.usage,
      lastUsed: image.lastUsed,
    },
  });
});

// @desc    Get gallery statistics
// @route   GET /api/gallery/stats
// @access  Private (Admin/Author)
export const getGalleryStats = asyncHandler(async (req, res) => {
  const userId = req.user.role === "admin" ? null : req.user._id;

  const matchStage = userId ? { uploadedBy: userId } : {};

  const stats = await Gallery.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalImages: { $sum: 1 },
        totalSize: { $sum: "$fileSize" },
        totalUsage: { $sum: "$usage" },
        categories: { $push: "$category" },
        formats: { $push: "$format" },
      },
    },
    {
      $project: {
        _id: 0,
        totalImages: 1,
        totalSize: 1,
        totalUsage: 1,
        categories: 1,
        formats: 1,
      },
    },
  ]);

  const categoryStats = await Gallery.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        totalSize: { $sum: "$fileSize" },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      overall: stats[0] || {
        totalImages: 0,
        totalSize: 0,
        totalUsage: 0,
        categories: [],
        formats: [],
      },
      byCategory: categoryStats,
    },
  });
});

// @desc    Get image link for markdown
// @route   GET /api/gallery/:id/link
// @access  Private (Admin/Author)
export const getImageLink = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { width, height, quality = "auto", format = "auto" } = req.query;

  const image = await Gallery.findById(id);

  if (!image) {
    return res.status(404).json({
      success: false,
      message: "Image not found",
    });
  }

  // Check permissions
  if (
    req.user.role !== "admin" &&
    !image.isPublic &&
    image.uploadedBy.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  // Build transformation parameters
  let transformedUrl = image.imageUrl;

  if (width || height || quality !== "auto" || format !== "auto") {
    const transformations = [];

    if (width && height) {
      transformations.push(`w_${width},h_${height},c_fill`);
    } else if (width) {
      transformations.push(`w_${width}`);
    } else if (height) {
      transformations.push(`h_${height}`);
    }

    if (quality !== "auto") {
      transformations.push(`q_${quality}`);
    }

    if (format !== "auto") {
      transformations.push(`f_${format}`);
    }

    // Insert transformations into Cloudinary URL
    if (transformations.length > 0) {
      const transformString = transformations.join(",");
      transformedUrl = image.imageUrl.replace(
        "/image/upload/",
        `/image/upload/${transformString}/`
      );
    }
  }

  // Increment usage count
  await Gallery.incrementUsage(id);

  res.status(200).json({
    success: true,
    data: {
      id: image._id,
      title: image.title,
      originalUrl: image.imageUrl,
      transformedUrl,
      markdownCode: `![${image.title}](${transformedUrl})`,
      htmlCode: `<img src="${transformedUrl}" alt="${image.title}" />`,
      dimensions: image.dimensions,
      usage: image.usage + 1,
    },
  });
});
