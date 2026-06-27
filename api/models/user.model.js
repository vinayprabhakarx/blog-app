import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Social media username validator
const socialLinkValidator = {
  validator: function (v) {
    // Prevents full URLs - usernames only
    if (v == null || v.length === 0) {
      return true;
    }
    return !/https?|www|\//.test(v);
  },
  message: (props) => `Please enter a valid username only, not a full URL.`,
};

const userSchema = new mongoose.Schema(
  {
    manual_avatar_update: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "author", "admin"],
      required: true,
      trim: true,
      validate: {
        validator: function (value) {
          if (this.isNew && value !== "user") {
            return false;
          }
          return true;
        },
        message: "New users can only be created with 'user' role",
      },
    },
    personal_info: {
      name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters long"],
        maxlength: [50, "Name cannot exceed 50 characters"],
      },
      username: {
        type: String,
        required: false,
        trim: true,
        unique: true,
        index: true,
        minlength: [3, "Username must be at least 3 characters long"],
        maxlength: [50, "Username cannot exceed 50 characters"],
        lowercase: true,
      },
      email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
          validator: function (email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
          },
          message: "Please enter a valid email address",
        },
      },
      bio: {
        type: String,
        trim: true,
        maxlength: [500, "Bio cannot exceed 500 characters"],
        default: "",
      },
      profile_img: {
        type: String,
        trim: true,
        default: "",
      },
      password: {
        type: String,
        required: function () {
          return !this.google_auth;
        },
        minlength: [8, "Password must be at least 8 characters long"],
        trim: true,
      },
      profile_is_public: {
        type: Boolean,
        default: true,
      },
    },
    // Social media links
    social_links: {
      youtube: { type: String, default: "", validate: socialLinkValidator },
      instagram: { type: String, default: "", validate: socialLinkValidator },
      facebook: { type: String, default: "", validate: socialLinkValidator },
      twitter: {
        type: String,
        trim: true,
        default: "",
        validate: socialLinkValidator,
      },
      linkedin: { type: String, trim: true, default: "" },
      github: { type: String, default: "", validate: socialLinkValidator },
      website: { type: String, trim: true, default: "" },
    },
    // Password reset fields
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    account_info: {
      total_posts: {
        type: Number,
        default: 0,
      },
      total_reads: {
        type: Number,
        default: 0,
      },
    },
    // Authentication & security
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verificationEmailSentCount: {
      type: Number,
      default: 0,
    },
    lastVerificationEmailSentAt: {
      type: Date,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
      default: Date.now,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    // Existing fields preserved
    username_change_history: [
      {
        old_username: String,
        new_username: String,
        changed_at: { type: Date, default: Date.now },
      },
    ],
    last_username_change_date: {
      type: Date,
    },
    google_auth: {
      type: Boolean,
      default: false,
    },
    // User preferences
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      profileVisibility: {
        type: String,
        enum: ["public", "private"],
        default: "public",
      },
    },
  },
  {
    timestamps: true,
    indexes: [{ "personal_info.email": 1 }, { role: 1 }, { createdAt: -1 }],

    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual properties for full social media URLs

userSchema.virtual("social_links_full.youtube").get(function () {
  const username = this.social_links?.youtube;
  return username ? `https://youtube.com/@${username}` : null;
});

userSchema.virtual("social_links_full.instagram").get(function () {
  const username = this.social_links?.instagram;
  return username ? `https://instagram.com/${username}` : null;
});

userSchema.virtual("social_links_full.facebook").get(function () {
  const username = this.social_links?.facebook;
  return username ? `https://facebook.com/${username}` : null;
});

userSchema.virtual("social_links_full.twitter").get(function () {
  const username = this.social_links?.twitter;
  return username ? `https://x.com/${username}` : null;
});

userSchema.virtual("social_links_full.github").get(function () {
  const username = this.social_links?.github;
  return username ? `https://github.com/${username}` : null;
});

userSchema.virtual("social_links_full.linkedin").get(function () {
  const username = this.social_links?.linkedin;
  return username ? `https://linkedin.com/in/${username}` : null;
});

userSchema.virtual("social_links_full.website").get(function () {
  const website = this.social_links?.website;
  if (!website) return null;

  // If website already has a protocol, return as is
  if (website.startsWith("http://") || website.startsWith("https://")) {
    return website;
  }

  // If no protocol, add https://
  return `https://${website}`;
});

// Pre-save middleware for role validation
userSchema.pre("save", function (next) {
  if (!this.isNew && this.isModified("role")) {
    if (!this.bypassRoleValidation) {
      const error = new Error("Role cannot be modified via API");
      error.status = 403;
      return next(error);
    }
  }

  if (this.isModified("personal_info.password") && !this.isNew) {
    this.passwordChangedAt = Date.now();
  }

  next();
});

// Password hashing middleware
userSchema.pre("save", async function (next) {
  if (
    !this.isModified("personal_info.password") ||
    !this.personal_info.password
  ) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.personal_info.password = await bcrypt.hash(
      this.personal_info.password,
      salt
    );
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check if user is locked
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts for 30 minutes
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 };
  }

  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: Date.now() },
  });
};

// Admin method to change user role
userSchema.statics.changeUserRole = async function (userId, newRole) {
  const user = await this.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  user.bypassRoleValidation = true;
  user.role = newRole;

  await user.save();

  delete user.bypassRoleValidation;

  return user;
};

// Virtual for user initials
userSchema.virtual("initials").get(function () {
  return this.personal_info?.name
    ? this.personal_info.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";
});

// Exclude sensitive fields from JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  if (user.personal_info) {
    delete user.personal_info.password;
  }
  delete user.loginAttempts;
  delete user.lockUntil;
  delete user.bypassRoleValidation;
  return user;
};

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

export default mongoose.model("User", userSchema);
