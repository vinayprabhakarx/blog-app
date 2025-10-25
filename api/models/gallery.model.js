import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    dimensions: {
      width: {
        type: Number,
        required: true,
      },
      height: {
        type: Number,
        required: true,
      },
    },
    format: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    category: {
      type: String,
      enum: ["blog", "profile", "banner", "thumbnail", "general"],
      default: "general",
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    usage: {
      type: Number,
      default: 0,
    },
    lastUsed: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
gallerySchema.index({ uploadedBy: 1, createdAt: -1 });
gallerySchema.index({ category: 1, createdAt: -1 });
gallerySchema.index({ tags: 1 });
gallerySchema.index({ isPublic: 1, createdAt: -1 });

// Pre-remove middleware to clean up Cloudinary image
gallerySchema.pre("remove", async function (next) {
  try {
    const { deleteImage } = await import("../config/cloudinary.js");
    await deleteImage(this.publicId);
    next();
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    next(error);
  }
});

// Static method to increment usage count
gallerySchema.statics.incrementUsage = function (imageId) {
  return this.findByIdAndUpdate(
    imageId,
    {
      $inc: { usage: 1 },
      lastUsed: new Date(),
    },
    { new: true }
  );
};

const Gallery = mongoose.model("Gallery", gallerySchema);

export default Gallery;
