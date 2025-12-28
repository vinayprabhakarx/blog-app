import mongoose from "mongoose";
import { nanoid } from "nanoid";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Title must be less than 200 characters long"],
    },
    banner: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: [500, "Excerpt must be less than 500 characters long"],
      default: "",
    },
    tags: {
      type: [String],
      validate: [(v) => v.length <= 10, "You can add a maximum of 10 tags"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Backup author info in case the user is deleted
    authorInfo: {
      username: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      profile_img: {
        type: String,
        default: "",
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    activity: {
      total_reads: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    draft: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique slug from title
blogSchema.pre("validate", async function (next) {
  if (this.isNew || this.isModified("title")) {
    // Create URL-friendly slug
    const titleSlug = this.title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    // Check if slug already exists
    let uniqueSlug = titleSlug;
    const existingBlog = await mongoose.model("Blog").findOne({
      slug: uniqueSlug,
      _id: { $ne: this._id },
    });

    if (existingBlog) {
      uniqueSlug = `${titleSlug}-${nanoid(5)}`;
    }

    this.slug = uniqueSlug;
  }
  next();
});

// Ensure read count is never negative
blogSchema.pre("save", function (next) {
  if (this.activity) {
    this.activity.total_reads = Math.max(0, this.activity.total_reads || 0);
  }
  next();
});

export default mongoose.model("Blog", blogSchema);
