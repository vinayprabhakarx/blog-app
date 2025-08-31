import Blog from "../models/blog.model.js";
import User from "../models/user.model.js";
import Comment from "../models/comment.model.js";
import Like from "../models/blogLike.model.js";
import {
  handleError,
  databaseError,
  notFoundError,
  forbiddenError,
} from "../utils/handleError.js";
import { uploadImage, deleteImage } from "../config/cloudinary.js";
import mongoose from "mongoose";
import { serverError } from "../utils/handleError.js";

// @route   POST /api/blogs
// @desc    Create a new blog post
// @access  Private (Author, Admin)
export const createBlog = async (req, res, next) => {
  const { title, content, excerpt, tags, category, draft } = req.body;
  const { id: authorId } = req.user;

  if (!title || !content || !category) {
    return next(handleError(400, "Title, content, and category are required."));
  }

  // Get author information for backup storage
  const author = await User.findById(authorId)
    .select("personal_info")
    .catch((err) => {
      throw databaseError("finding author information", err);
    });

  if (!author) {
    return next(notFoundError("Author"));
  }

  // Handle banner image upload if provided
  let bannerUrl = "";
  if (req.file) {
    const uploadResult = await uploadImage(req.file.path, {
      folder: "notion-blog-app/banners",
    });
    if (!uploadResult.success) {
      return next(
        handleError(500, "Failed to upload blog banner.", uploadResult.error)
      );
    }
    bannerUrl = uploadResult.url;
  }

  const blogData = {
    title,
    content,
    excerpt,
    tags: tags ? tags.split(",").map((tag) => tag.trim()) : [], // Parse comma-separated tags
    category,
    draft: draft === "true",
    author: authorId,
    // Store author backup info
    authorInfo: {
      username: author.personal_info.username,
      name: author.personal_info.name,
      profile_img: author.personal_info.profile_img || "",
    },
    banner: bannerUrl,
  };

  const newBlog = new Blog(blogData);
  await newBlog.save().catch((err) => {
    throw databaseError("saving new blog", err);
  });

  // Increment user's total post count
  await User.findByIdAndUpdate(authorId, {
    $inc: { "account_info.total_posts": 1 },
  }).catch((err) => {
    throw databaseError("updating user post count", err);
  });

  res.status(201).json({
    success: true,
    message: "Blog created successfully.",
    blog: newBlog,
  });
};

// @route   GET /api/blogs
// @desc    Get all published blogs with filtering and pagination
// @access  Public
export const getAllBlogs = async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    category = "",
    tag = "",
    username = "",
  } = req.query;

  const query = { draft: false };

  if (search) {
    // Find authors whose names match the search query
    const authors = await User.find({
      "personal_info.name": { $regex: search, $options: "i" },
    }).select("_id");
    const authorIds = authors.map((author) => author._id);

    // Create a search condition for either the blog title or the author
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { author: { $in: authorIds } },
    ];
  }

  if (category) {
    query.category = category;
  }
  if (tag) {
    query.tags = tag;
  }

  if (username) {
    // Find user by username and filter blogs by that author
    const user = await User.findOne({
      "personal_info.username": username.toLowerCase(),
    }).select("_id");

    if (user) {
      query.author = user._id;
    } else {
      // If username not found, return empty result
      return res.status(200).json({
        success: true,
        blogs: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalBlogs: 0,
        },
      });
    }
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const blogs = await Blog.find(query)
    .populate(
      "author",
      "personal_info.name personal_info.username personal_info.profile_img"
    )
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean() // Use lean for faster queries when not modifying docs
    .catch((err) => {
      throw databaseError("fetching all blogs", err);
    });

  const totalBlogs = await Blog.countDocuments(query).catch((err) => {
    throw databaseError("counting blogs", err);
  });

  const totalPages = Math.ceil(totalBlogs / parseInt(limit));

  // Map blogs to set author to "Admin" if null
  const blogsWithAdmin = blogs.map((blog) => ({
    ...blog,
    author: blog.author || { personal_info: { name: "Admin" } },
  }));

  res.status(200).json({
    success: true,
    blogs: blogsWithAdmin,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalBlogs,
    },
  });
};

// @route   GET /api/blogs/my-blogs
// @desc    Get all blogs (published and drafts) for the logged-in author or admin
// @access  Private (Author, Admin)
export const getAuthorBlogs = async (req, res, next) => {
  const { id: authorId } = req.user;
  const { page = 1, limit = 10 } = req.query;

  const query = { author: authorId };
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const blogs = await Blog.find(query)
    .populate(
      "author",
      "personal_info.name personal_info.username personal_info.profile_img"
    )
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean()
    .catch((err) => {
      throw databaseError("fetching author blogs", err);
    });

  const totalBlogs = await Blog.countDocuments(query).catch((err) => {
    throw databaseError("counting author blogs", err);
  });

  const totalPages = Math.ceil(totalBlogs / parseInt(limit));

  res.status(200).json({
    success: true,
    blogs,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalBlogs,
    },
  });
};

// @route   GET /api/blogs/author/:username
// @desc    Get all published blogs by a specific author's username
// @access  Public
export const getBlogsByAuthor = async (req, res, next) => {
  const { username } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const author = await User.findOne({
    "personal_info.username": username,
  }).catch((err) => {
    throw databaseError("finding author", err);
  });

  if (!author) {
    return next(notFoundError("Author"));
  }

  const query = { author: author._id, draft: false };
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const blogs = await Blog.find(query)
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean()
    .catch((err) => {
      throw databaseError("fetching blogs by author", err);
    });

  const totalBlogs = await Blog.countDocuments(query).catch((err) => {
    throw databaseError("counting blogs by author", err);
  });

  const totalPages = Math.ceil(totalBlogs / parseInt(limit));

  res.status(200).json({
    success: true,
    blogs,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalBlogs,
    },
  });
};

// @route   GET /api/blogs/admin/author/:authorId
// @desc    Get all blogs (published and drafts) by a specific author ID
// @access  Private (Admin)
export const getBlogsByAuthorForAdmin = async (req, res, next) => {
  const { authorId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const author = await User.findById(authorId).catch((err) => {
    if (err.name === "CastError")
      throw handleError(400, "Invalid Author ID format");
    throw databaseError("finding author", err);
  });

  if (!author) {
    return next(notFoundError("Author"));
  }

  const query = { author: authorId };
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const blogs = await Blog.find(query)
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean()
    .catch((err) => {
      throw databaseError("fetching blogs for admin view", err);
    });

  const totalBlogs = await Blog.countDocuments(query).catch((err) => {
    throw databaseError("counting blogs for admin view", err);
  });

  const totalPages = Math.ceil(totalBlogs / parseInt(limit));

  res.status(200).json({
    success: true,
    author: {
      name: author.personal_info.name,
      username: author.personal_info.username,
    },
    blogs,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalBlogs,
    },
  });
};

// @route   GET /api/blogs/edit/:id
// @desc    Get a single blog by its ID for editing (without incrementing read count)
// @access  Private (Author, Admin)
export const getBlogById = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId, role: userRole } = req.user;

  const blog = await Blog.findById(id)
    .populate(
      "author",
      "personal_info.name personal_info.username personal_info.profile_img"
    )
    .populate("category", "name slug")
    .catch((err) => {
      if (err.name === "CastError")
        throw handleError(400, "Invalid Blog ID format");
      throw databaseError("finding blog by ID", err);
    });

  if (!blog) {
    return next(notFoundError("Blog"));
  }

  // Check if user has permission to edit this blog
  if (blog.author._id.toString() !== userId && userRole !== "admin") {
    return next(forbiddenError("You are not authorized to edit this blog."));
  }

  // Calculate real-time comment and like counts
  const [commentCount, likeCount] = await Promise.all([
    Comment.countDocuments({ blog_id: blog._id, is_deleted: false }),
    Like.countDocuments({ blog_id: blog._id, is_liked: true }),
  ]);

  res.status(200).json({
    success: true,
    blog: {
      ...blog.toObject(),
      author: blog.author || { personal_info: { name: "Admin" } },
      activity: {
        ...blog.activity,
        total_comments: commentCount,
        total_likes: likeCount,
      },
    },
  });
};

// @route   GET /api/blogs/slug/:slug
// @desc    Get a single blog by its slug and increment read count
// @access  Public
export const getBlogBySlug = async (req, res, next) => {
  const { slug } = req.params;

  const blog = await Blog.findOneAndUpdate(
    { slug, draft: false },
    { $inc: { "activity.total_reads": 1 } },
    { new: true }
  )
    .populate(
      "author",
      "personal_info.name personal_info.username personal_info.profile_img social_links"
    )
    .populate("category", "name slug")
    .catch((err) => {
      throw databaseError("finding blog by slug", err);
    });

  if (!blog) {
    return next(notFoundError("Blog"));
  }

  // Increment the author's total read count if author exists
  if (blog.author) {
    await User.findByIdAndUpdate(blog.author._id, {
      $inc: { "account_info.total_reads": 1 },
    }).catch((err) => {
      throw databaseError("updating author's read count", err);
    });
  }

  // Calculate real-time comment and like counts
  const [commentCount, likeCount] = await Promise.all([
    Comment.countDocuments({ blog_id: blog._id, is_deleted: false }),
    Like.countDocuments({ blog_id: blog._id, is_liked: true }),
  ]);

  res.status(200).json({
    success: true,
    blog: {
      ...blog.toObject(),
      author: blog.author || { personal_info: { name: "Admin" } },
      activity: {
        ...blog.activity,
        total_comments: commentCount,
        total_likes: likeCount,
      },
    },
  });
};

// @route   PUT /api/blogs/:id
// @desc    Update a blog post
// @access  Private (Author, Admin)
export const updateBlog = async (req, res, next) => {
  const { id } = req.params;
  const { title, content, excerpt, tags, category, draft } = req.body;
  const { id: userId, role: userRole } = req.user;

  const blog = await Blog.findById(id).catch((err) => {
    if (err.name === "CastError")
      throw handleError(400, "Invalid Blog ID format");
    throw databaseError("finding blog to update", err);
  });

  if (!blog) {
    return next(notFoundError("Blog"));
  }

  if (blog.author.toString() !== userId && userRole !== "admin") {
    return next(forbiddenError("You are not authorized to update this blog."));
  }

  if (title) blog.title = title;
  if (content) blog.content = content;
  if (excerpt !== undefined) blog.excerpt = excerpt;
  if (category) blog.category = category;
  if (draft !== undefined) blog.draft = draft;
  if (tags) blog.tags = tags.split(",").map((tag) => tag.trim());

  // Ensure authorInfo exists for validation (for blogs created before authorInfo was added)
  if (!blog.authorInfo || !blog.authorInfo.username || !blog.authorInfo.name) {
    const author = await User.findById(blog.author).catch((err) => {
      throw databaseError("finding blog author for backup info", err);
    });

    if (author) {
      blog.authorInfo = {
        username: author.personal_info.username,
        name: author.personal_info.name,
        profile_img: author.personal_info.profile_img || "",
      };
    } else {
      // If author is deleted, use fallback values
      blog.authorInfo = {
        username: blog.authorInfo?.username || "deleted_user",
        name: blog.authorInfo?.name || "Deleted User",
        profile_img: blog.authorInfo?.profile_img || "",
      };
    }
  }

  if (req.file) {
    // If there's an old banner, delete it from Cloudinary
    if (blog.banner) {
      const publicId = blog.banner.split("/").pop().split(".")[0];
      await deleteImage(`notion-blog-app/banners/${publicId}`);
    }

    const uploadResult = await uploadImage(req.file.path, {
      folder: "notion-blog-app/banners",
    });
    if (!uploadResult.success) {
      return next(
        handleError(500, "Failed to upload new banner.", uploadResult.error)
      );
    }
    blog.banner = uploadResult.url;
  }

  const updatedBlog = await blog.save().catch((err) => {
    throw databaseError("updating blog", err);
  });

  res.status(200).json({
    success: true,
    message: "Blog updated successfully.",
    blog: updatedBlog,
  });
};

// @route   DELETE /api/blogs/:id
// @desc    Delete a blog post
// @access  Private (Author, Admin)
export const deleteBlog = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId, role: userRole } = req.user;

  const blog = await Blog.findById(id).catch((err) => {
    if (err.name === "CastError")
      throw handleError(400, "Invalid Blog ID format");
    throw databaseError("finding blog to delete", err);
  });

  if (!blog) {
    return next(notFoundError("Blog"));
  }

  if (blog.author.toString() !== userId && userRole !== "admin") {
    return next(forbiddenError("You are not authorized to delete this blog."));
  }

  // Delete banner from Cloudinary if it exists
  if (blog.banner) {
    const publicId = blog.banner.split("/").pop().split(".")[0];
    await deleteImage(`notion-blog-app/banners/${publicId}`);
  }

  // --- Perform cascading delete ---
  // 1. Delete all comments associated with the blog
  await Comment.deleteMany({ blog_id: id }).catch((err) => {
    throw databaseError("deleting blog comments", err);
  });
  // 2. Delete all likes associated with the blog
  await Like.deleteMany({ likeable: id, onModel: "Blog" }).catch((err) => {
    throw databaseError("deleting blog likes", err);
  });
  // 3. Delete the blog itself
  await Blog.findByIdAndDelete(id);
  // 4. Decrement user's total post count
  await User.findByIdAndUpdate(blog.author, {
    $inc: { "account_info.total_posts": -1 },
  }).catch((err) => {
    throw databaseError("updating user post count", err);
  });

  res.status(200).json({
    success: true,
    message: "Blog and all associated data deleted successfully.",
  });
};

// @route   GET /api/blogs/admin/recalculate-comment-counts
// @desc    Recalculate all blog comment counts (admin only)
// @access  Private (Admin)
export const recalculateAllCommentCounts = async (req, res, next) => {
  try {
    const Blog = mongoose.model("Blog");
    const result = await Blog.recalculateAllCommentCounts();

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(serverError("Failed to recalculate comment counts", error));
  }
};
