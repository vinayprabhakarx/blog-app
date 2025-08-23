import React from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../../components/ui/avatar";
import { Calendar, Clock, User2 } from "lucide-react";
import { cn } from "@/lib/utils";

const BlogCard = ({
  blog,
  variant = "default",
  showAuthor = true,
  className,
  ...props
}) => {
  // Format date to be more readable
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate read time
  const calculateReadTime = (content) => {
    const wordsPerMinute = 200;
    const wordCount = content?.replace(/<[^>]*>/g, "").split(/\s+/).length || 0;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readTime} min read`;
  };

  // Truncate content
  const truncateText = (text, maxLength = 120) => {
    const cleanText = text?.replace(/<[^>]*>/g, "") || "";
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength).trim() + "...";
  };

  const imageVariants = {
    default: "aspect-[4/3] sm:aspect-[16/10]",
    compact: "aspect-video",
    featured: "aspect-[4/3] sm:aspect-[16/9]",
  };

  return (
    <div
      className={cn("group transition-all duration-300", className)}
      {...props}
    >
      {/* Featured Image */}
      {blog.banner && (
        <Link to={`/blog/${blog.slug}`} className="block">
          <div
            className={cn(
              "relative overflow-hidden bg-muted rounded-lg border border-border/50 mb-3 sm:mb-4 cursor-pointer",
              imageVariants[variant]
            )}
          >
            <img
              src={
                blog.banner.startsWith("http")
                  ? blog.banner
                  : `/api${blog.banner}`
              }
              alt={blog.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = "none";
              }}
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

      {/* Read time on mobile (since it's hidden in image overlay) */}
      <div className="flex items-center gap-1 sm:hidden mb-2">
        <Clock className="w-3 h-3" />
        <span className="text-xs text-muted-foreground">
          {calculateReadTime(blog.content)}
        </span>
      </div>

      {/* Content */}
      <div
        className={cn(
          "space-y-2 sm:space-y-3",
          variant === "compact" && "space-y-2"
        )}
      >
        {/* Title - Clickable */}
        <Link to={`/blog/${blog.slug}`} className="block">
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
            {blog.title}
          </h3>
        </Link>

        {/* Author and Date - Between title and excerpt */}
        {showAuthor && (
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Author Avatar */}
              <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                {blog.author?.personal_info?.profile_img ||
                blog.author?.avatar ? (
                  <img
                    src={
                      blog.author?.personal_info?.profile_img ||
                      blog.author?.avatar
                    }
                    alt={blog.author.personal_info.username || "Author"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                    <User2 className="h-3 w-3 sm:h-3 sm:w-3 text-primary" />
                  </div>
                )}
              </Avatar>

              {/* Author Name */}
              <Link
                to={`/${
                  blog.author?.personal_info?.username ||
                  blog.author?.username ||
                  "anonymous"
                }`}
                className="text-xs sm:text-sm font-medium text-muted-foreground truncate hover:text-primary transition-colors duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {blog.author?.name ||
                  blog.author?.personal_info?.username ||
                  "Anonymous"}
              </Link>
            </div>

            {/* Date */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                {formatDate(blog.createdAt)}
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
          {truncateText(
            blog.excerpt || blog.content,
            variant === "compact" ? 100 : 150
          )}
        </p>
      </div>

      {/* Bright separation line below each blog card */}
      <div className="mt-4 h-0.5 bg-border/70 w-full rounded-full"></div>
    </div>
  );
};

export default BlogCard;
