import mongoose from "mongoose";

const blogLikeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    blog_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
      index: true,
    },
    // Source tracking for analytics
    source: {
      type: String,
      enum: ["web", "mobile", "api", "social_share"],
      default: "web",
    },
    // Device and location info for analytics
    metadata: {
      user_agent: String,
      ip_address: String,
      device_type: String,
      browser: String,
      os: String,
      country: String,
      city: String,
    },
    // Interaction context for marketing analytics
    interaction_context: {
      referrer: String,
      utm_source: String,
      utm_medium: String,
      utm_campaign: String,
    },
    // Privacy settings
    is_public: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: {
      createdAt: "liked_at",
      updatedAt: "updated_at",
    },
  }
);

// Compound index to ensure one like per user per blog
blogLikeSchema.index({ user_id: 1, blog_id: 1 }, { unique: true });

// Indexes for performance and analytics
blogLikeSchema.index({ blog_id: 1, liked_at: -1 }); // Get likes for a blog
blogLikeSchema.index({ user_id: 1, liked_at: -1 }); // Get user's likes
blogLikeSchema.index({ source: 1, liked_at: -1 }); // Analytics by source
blogLikeSchema.index({ "metadata.country": 1 }); // Geographic analytics
blogLikeSchema.index({ liked_at: -1 }); // Time-based queries
blogLikeSchema.index({ is_public: 1, user_id: 1 }); // Public likes

// Static method to toggle like/unlike
blogLikeSchema.statics.toggleLike = async function (
  userId,
  blogId,
  options = {}
) {
  try {
    const {
      metadata = {},
      source = "web",
      interactionContext = {},
      isPublic = true,
    } = options;

    // Check if like already exists
    const existingLike = await this.findOne({
      user_id: userId,
      blog_id: blogId,
    });

    if (existingLike) {
      // Unlike: Remove the like
      await this.deleteOne({ _id: existingLike._id });
      return { action: "unliked", like: null };
    } else {
      // Like: Create new like
      const newLike = new this({
        user_id: userId,
        blog_id: blogId,
        source,
        interaction_context: interactionContext,
        metadata,
        is_public: isPublic,
      });

      const savedLike = await newLike.save();
      return { action: "liked", like: savedLike };
    }
  } catch (error) {
    throw error;
  }
};

// Static method to get like count for a blog
blogLikeSchema.statics.getLikeCount = async function (blogId) {
  try {
    const count = await this.countDocuments({ blog_id: blogId });
    return count;
  } catch (error) {
    throw error;
  }
};

// Static method to check if user has liked a blog
blogLikeSchema.statics.hasUserLiked = async function (userId, blogId) {
  try {
    const like = await this.findOne({
      user_id: userId,
      blog_id: blogId,
    });
    return !!like;
  } catch (error) {
    throw error;
  }
};

// Static method to get all likes for a blog with user details
blogLikeSchema.statics.getBlogLikes = async function (blogId, options = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      publicOnly = true,
      sortBy = "liked_at",
      sortOrder = -1,
      includeMetadata = false,
    } = options;

    const skip = (page - 1) * limit;

    let matchQuery = { blog_id: blogId };
    if (publicOnly) matchQuery.is_public = true;

    const selectFields =
      "user_id liked_at source" +
      (includeMetadata ? " metadata interaction_context" : "");

    const likes = await this.find(matchQuery)
      .populate({
        path: "user_id",
        select:
          "personal_info.name personal_info.username personal_info.profile_img",
      })
      .select(selectFields)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await this.countDocuments(matchQuery);

    return {
      likes,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    };
  } catch (error) {
    throw error;
  }
};

// Static method to get user's liked blogs
blogLikeSchema.statics.getUserLikedBlogs = async function (
  userId,
  options = {}
) {
  try {
    const {
      page = 1,
      limit = 20,
      includePrivate = false,
      sortBy = "liked_at",
      sortOrder = -1,
    } = options;

    const skip = (page - 1) * limit;

    let matchQuery = { user_id: userId };
    if (!includePrivate) matchQuery.is_public = true;

    const likes = await this.find(matchQuery)
      .populate({
        path: "blog_id",
        select:
          "title slug banner excerpt author activity.total_likes activity.total_comments createdAt draft",
        populate: {
          path: "author",
          select:
            "personal_info.name personal_info.username personal_info.profile_img",
        },
      })
      .select("blog_id liked_at source")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Filter out null blog_id entries and draft blogs
    const filteredLikes = likes.filter(
      (like) => like.blog_id && !like.blog_id.draft
    );

    const total = await this.countDocuments(matchQuery);

    return {
      likes: filteredLikes,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    };
  } catch (error) {
    throw error;
  }
};

// Static method to get blog analytics
blogLikeSchema.statics.getBlogLikeAnalytics = async function (
  blogId,
  options = {}
) {
  try {
    const { timeframe = "30d", includeGeographic = false } = options;

    // Calculate date range
    const now = new Date();
    let startDate;

    switch (timeframe) {
      case "1d":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    const pipeline = [
      {
        $match: {
          blog_id: new mongoose.Types.ObjectId(blogId),
          liked_at: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          total_likes: { $sum: 1 },
          unique_users: { $addToSet: "$user_id" },
          sources: { $push: "$source" },
          first_like: { $min: "$liked_at" },
          latest_like: { $max: "$liked_at" },
        },
      },
      {
        $project: {
          total_likes: 1,
          unique_users: { $size: "$unique_users" },
          sources: 1,
          first_like: 1,
          latest_like: 1,
        },
      },
    ];

    const analytics = await this.aggregate(pipeline);

    // Get source breakdown
    const sourceBreakdown = await this.aggregate([
      {
        $match: {
          blog_id: new mongoose.Types.ObjectId(blogId),
          liked_at: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get daily breakdown for the timeframe
    const dailyBreakdown = await this.aggregate([
      {
        $match: {
          blog_id: new mongoose.Types.ObjectId(blogId),
          liked_at: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$liked_at" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    let geographicData = null;
    if (includeGeographic) {
      geographicData = await this.aggregate([
        {
          $match: {
            blog_id: new mongoose.Types.ObjectId(blogId),
            liked_at: { $gte: startDate },
            "metadata.country": { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: "$metadata.country",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);
    }

    return {
      summary: analytics[0] || {
        total_likes: 0,
        unique_users: 0,
      },
      source_breakdown: sourceBreakdown,
      daily_breakdown: dailyBreakdown,
      geographic_data: geographicData,
      timeframe,
      analysis_date: new Date(),
    };
  } catch (error) {
    throw error;
  }
};

// Static method to get trending blogs
blogLikeSchema.statics.getTrendingBlogs = async function (options = {}) {
  try {
    const { timeframe = "7d", limit = 10, minLikes = 5 } = options;

    const now = new Date();
    let startDate;

    switch (timeframe) {
      case "1d":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const pipeline = [
      {
        $match: {
          liked_at: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$blog_id",
          total_likes: { $sum: 1 },
          unique_users: { $addToSet: "$user_id" },
          latest_like: { $max: "$liked_at" },
          first_like: { $min: "$liked_at" },
        },
      },
      {
        $match: {
          total_likes: { $gte: minLikes },
        },
      },
      {
        $addFields: {
          // Calculate trending score based on likes and recency
          trending_score: {
            $add: [
              { $multiply: ["$total_likes", 10] },
              {
                $divide: [
                  { $subtract: [new Date(), "$latest_like"] },
                  -3600000, // Negative hours (more recent = higher score)
                ],
              },
            ],
          },
          like_velocity: {
            $divide: [
              "$total_likes",
              {
                $max: [
                  {
                    $divide: [
                      { $subtract: ["$latest_like", "$first_like"] },
                      3600000,
                    ],
                  },
                  1,
                ],
              },
            ],
          },
        },
      },
      {
        $lookup: {
          from: "blogs",
          localField: "_id",
          foreignField: "_id",
          as: "blog",
        },
      },
      { $unwind: "$blog" },
      {
        $match: {
          "blog.draft": { $ne: true },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "blog.author",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      {
        $project: {
          blog_id: "$_id",
          total_likes: 1,
          unique_users: { $size: "$unique_users" },
          latest_like: 1,
          trending_score: 1,
          like_velocity: 1,
          blog: {
            _id: 1,
            title: 1,
            slug: 1,
            banner: 1,
            excerpt: 1,
            createdAt: 1,
            "activity.total_likes": 1,
            "activity.total_comments": 1,
            "activity.total_reads": 1,
          },
          author: {
            _id: 1,
            "personal_info.name": 1,
            "personal_info.username": 1,
            "personal_info.profile_img": 1,
          },
        },
      },
      { $sort: { trending_score: -1 } },
      { $limit: parseInt(limit) },
    ];

    const trendingBlogs = await this.aggregate(pipeline);

    return {
      blogs: trendingBlogs,
      timeframe,
      criteria: { minLikes },
      generated_at: new Date(),
    };
  } catch (error) {
    throw error;
  }
};

// Static method to get user's like statistics
blogLikeSchema.statics.getUserLikeStats = async function (
  userId,
  options = {}
) {
  try {
    const { timeframe = "30d" } = options;

    const now = new Date();
    let startDate;

    switch (timeframe) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    const pipeline = [
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(userId),
          liked_at: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          total_likes: { $sum: 1 },
          sources_used: { $addToSet: "$source" },
          first_like: { $min: "$liked_at" },
          latest_like: { $max: "$liked_at" },
          daily_activity: {
            $push: {
              $dayOfWeek: "$liked_at",
            },
          },
        },
      },
    ];

    const stats = await this.aggregate(pipeline);

    // Get source breakdown
    const sourceBreakdown = await this.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(userId),
          liked_at: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get most liked categories (through blogs)
    const categoryStats = await this.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(userId),
          liked_at: { $gte: startDate },
        },
      },
      {
        $lookup: {
          from: "blogs",
          localField: "blog_id",
          foreignField: "_id",
          as: "blog",
        },
      },
      { $unwind: "$blog" },
      {
        $lookup: {
          from: "categories",
          localField: "blog.category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $group: {
          _id: "$category.name",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    return {
      summary: stats[0] || { total_likes: 0 },
      source_breakdown: sourceBreakdown,
      favorite_categories: categoryStats,
      timeframe,
      generated_at: new Date(),
    };
  } catch (error) {
    throw error;
  }
};

// Static methods for bulk operations (Admin use)
blogLikeSchema.statics.removeUserLikes = async function (userIds) {
  const result = await this.deleteMany({
    user_id: { $in: userIds },
  });
  return result;
};

blogLikeSchema.statics.removeBlogLikes = async function (blogIds) {
  const result = await this.deleteMany({
    blog_id: { $in: blogIds },
  });
  return result;
};

blogLikeSchema.statics.transferLikes = async function (fromUserId, toUserId) {
  const result = await this.updateMany(
    { user_id: fromUserId },
    { user_id: toUserId }
  );
  return result;
};

// Instance method to get like details with populated data
blogLikeSchema.methods.getPopulatedDetails = async function () {
  try {
    const populatedLike = await this.populate([
      {
        path: "user_id",
        select:
          "personal_info.name personal_info.username personal_info.profile_img role",
      },
      {
        path: "blog_id",
        select: "title slug author",
        populate: {
          path: "author",
          select: "personal_info.name personal_info.username",
        },
      },
    ]);
    return populatedLike;
  } catch (error) {
    throw error;
  }
};

// Virtual for calculating like age in days
blogLikeSchema.virtual("age_in_days").get(function () {
  const now = new Date();
  const diffTime = Math.abs(now - this.liked_at);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

export default mongoose.model("BlogLike", blogLikeSchema);
