import React, { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";

const BlogCard = React.memo(
  ({ blog, variant = "default", showAuthor = true, className, ...props }) => {
    // Memoize utility functions
    const formatDate = useCallback((date) => {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }, []);

    const truncateText = useCallback((text, maxLength = 120) => {
      const cleanText = text?.replace(/<[^>]*>/g, "") || "";
      if (cleanText.length <= maxLength) return cleanText;
      return cleanText.substring(0, maxLength).trim() + "...";
    }, []);

    // Memoize computed values
    const blogSlug = useMemo(() => blog?.slug, [blog?.slug]);
    const blogTitle = useMemo(() => blog?.title, [blog?.title]);
    const blogBanner = useMemo(() => blog?.banner, [blog?.banner]);
    const blogCreatedAt = useMemo(() => blog?.createdAt, [blog?.createdAt]);
    const blogContent = useMemo(() => blog?.content, [blog?.content]);
    const blogExcerpt = useMemo(() => blog?.excerpt, [blog?.excerpt]);

    // Memoize author data
    const authorData = useMemo(
      () => ({
        avatar:
          blog?.author?.personal_info?.profile_img ||
          blog?.author?.avatar ||
          blog?.authorInfo?.profile_img,
        username:
          blog?.author?.personal_info?.username ||
          blog?.author?.username ||
          blog?.authorInfo?.username ||
          "vianyprabhakarx",
        displayName:
          blog?.author?.personal_info?.username ||
          blog?.authorInfo?.username ||
          blog?.author?.username ||
          "vianyprabhakarx",
        altText:
          blog?.author?.personal_info?.username ||
          blog?.authorInfo?.username ||
          "vianyprabhakarx",
      }),
      [blog?.author, blog?.authorInfo]
    );

    // Memoize computed display values
    const formattedDate = useMemo(
      () => formatDate(blogCreatedAt),
      [formatDate, blogCreatedAt]
    );
    // Extract category information with fallbacks
    const categoryInfo = useMemo(() => {
      const primaryCategory =
        blog?.category || blog?.categories?.[0] || blog?.Category;
      const name =
        primaryCategory?.name ||
        primaryCategory?.title ||
        primaryCategory?.slug ||
        null;
      const slug = primaryCategory?.slug || null;
      return { name, slug };
    }, [blog?.category, blog?.categories, blog?.Category]);
    const excerptText = useMemo(() => {
      const maxLength = variant === "compact" ? 100 : 150;
      return truncateText(blogExcerpt || blogContent, maxLength);
    }, [truncateText, blogExcerpt, blogContent, variant]);

    // Memoize image source
    const imageSrc = useMemo(() => {
      if (!blogBanner) return null;
      return blogBanner.startsWith("http") ? blogBanner : `/api${blogBanner}`;
    }, [blogBanner]);

    // Memoize image variants
    const imageVariants = useMemo(
      () => ({
        default: "aspect-[4/3] sm:aspect-[16/10]",
        compact: "aspect-video",
        featured: "aspect-[4/3] sm:aspect-[16/9]",
      }),
      []
    );

    // Memoize image error handler
    const handleImageError = useCallback((e) => {
      e.target.style.display = "none";
    }, []);

    return (
      <div
        className={cn("group transition-all duration-300", className)}
        {...props}
      >
        {/* Featured Image */}
        {blogBanner && imageSrc && (
          <Link to={`/blog/${blogSlug}`} className="block">
            <div
              className={cn(
                "relative overflow-hidden bg-muted rounded-lg border border-border/50 mb-3 sm:mb-4 cursor-pointer",
                imageVariants[variant]
              )}
            >
              <img
                src={imageSrc}
                alt={blogTitle}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={handleImageError}
                crossOrigin="anonymous"
              />

              {/* Hover overlay - Only on non-touch devices */}
              <div className="absolute inset-0 bg-background/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block" />

              {/* Click indicator - subtle arrow icon */}
              <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <svg
                  className="w-3 h-3 text-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
            </div>
          </Link>
        )}

        {/* Category pill - visible on all breakpoints */}
        {categoryInfo?.name && (
          <div className="mb-2 text-xs text-muted-foreground">
            {categoryInfo.name}
          </div>
        )}

        {/* Content */}
        <div
          className={cn(
            "space-y-2 sm:space-y-3",
            variant === "compact" && "space-y-2"
          )}
        >
          {/* Title - Clickable */}
          <Link to={`/blog/${blogSlug}`} className="block">
            <h3
              className={cn(
                "font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200 cursor-pointer",
                // Responsive text sizes
                variant === "featured"
                  ? "text-lg sm:text-xl md:text-2xl lg:text-3xl"
                  : "text-lg sm:text-xl lg:text-2xl",
                variant === "compact" && "text-base sm:text-lg lg:text-xl"
              )}
            >
              {blogTitle}
            </h3>
          </Link>

          {/* Author and Date - Between title and excerpt */}
          {showAuthor && (
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Author Avatar */}
                <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                  <AvatarImage src={authorData.avatar} />
                  <AvatarFallback>
                    <User className="h-3 w-3 sm:h-3 sm:w-3" />
                  </AvatarFallback>
                </Avatar>

                {/* Author Name */}
                <Link
                  to={`/${authorData.username}`}
                  className="text-xs sm:text-sm font-medium text-muted-foreground truncate hover:text-primary transition-colors duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {authorData.displayName}
                </Link>
              </div>

              {/* Date */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {formattedDate}
                </span>
              </div>
            </div>
          )}

          {/* Excerpt */}
          <p
            className={cn(
              "text-muted-foreground line-clamp-3 sm:line-clamp-4 lg:line-clamp-5 text-sm sm:text-base",
              variant === "compact" && "line-clamp-2 text-sm"
            )}
          >
            {excerptText}
          </p>
        </div>

        {/* Bright separation line below each blog card */}
        <div className="mt-4 h-0.5 bg-border/70 w-full rounded-full"></div>
      </div>
    );
  }
);

BlogCard.displayName = "BlogCard";

export default BlogCard;
