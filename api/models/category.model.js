import mongoose from "mongoose";
import { nanoid } from "nanoid";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required."],
      trim: true,
      unique: true,
      maxlength: [50, "Category name cannot be more than 50 characters."],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot be more than 200 characters."],
      default: "",
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique slug from name
categorySchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("name")) {
    const nameSlug = this.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    // Check if slug already exists
    let uniqueSlug = nameSlug;
    const existingCategory = await mongoose.model("Category").findOne({
      slug: uniqueSlug,
      _id: { $ne: this._id },
    });

    if (existingCategory) {
      uniqueSlug = `${nameSlug}-${nanoid(5)}`;
    }

    this.slug = uniqueSlug;
  }
  next();
});

export default mongoose.model("Category", categorySchema);
