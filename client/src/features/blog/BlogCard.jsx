import React, { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

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
      const maxLength = variant === "compact" ? 100 : 160;
      return truncateText(blogExcerpt || blogContent, maxLength);
    }, [truncateText, blogExcerpt, blogContent, variant]);



    return (
      <article
        className={cn("group transition-all duration-300 h-full flex flex-col", className)}
        {...props}
      >
        {/* Category pill - visible on all breakpoints */}
        {categoryInfo?.name && (
          <div className="mb-2">
            <Link
              to={`/category/${categoryInfo.slug || categoryInfo.name}`}
              className="text-sm font-medium text-primary hover:underline underline-offset-4 decoration-primary/30 transition-all uppercase tracking-wide"
              onClick={(e) => e.stopPropagation()}
            >
              {categoryInfo.name}
            </Link>
          </div>
        )}

        {/* Content */}
        <div
          className={cn(
            "space-y-2 sm:space-y-3 flex-1 flex flex-col",
            variant === "compact" && "space-y-2"
          )}
        >
          {/* Title - Clickable */}
          <Link to={`/blog/${blogSlug}`} className="block">
            <h3
              className={cn(
                "font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200 cursor-pointer min-h-14",
                // Responsive text sizes
                variant === "featured"
                  ? "text-lg sm:text-xl md:text-2xl lg:text-3xl"
                  : "text-lg sm:text-xl lg:text-2xl",
                variant === "compact" && "text-base sm:text-lg lg:text-xl min-h-0"
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
                <Link to={`/${authorData.username}`} onClick={(e) => e.stopPropagation()}>
                  <Avatar className="h-5 w-5 sm:h-6 sm:w-6 hover:opacity-80 transition-opacity">
                    <AvatarImage src={authorData.avatar} />
                    <AvatarFallback>
                      <User className="h-3 w-3 sm:h-3 sm:w-3" />
                    </AvatarFallback>
                  </Avatar>
                </Link>

                {/* Author Name */}
                <Link
                  to={`/${authorData.username}`}
                  className="text-base font-medium text-foreground hover:text-primary transition-colors duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {authorData.displayName}
                </Link>
              </div>

              {/* Date */}
              <div className="flex items-center gap-1 shrink-0">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-base text-muted-foreground">
                  {formattedDate}
                </span>
              </div>
            </div>
          )}

          {/* Excerpt */}
          <p
            className={cn(
              "text-muted-foreground line-clamp-3 text-base leading-relaxed",
              variant === "compact" && "line-clamp-2 text-sm"
            )}
          >
            {excerptText}
          </p>
        </div>

        {/* Bright separation line below each blog card */}
        <div className="mt-4 h-0.5 bg-border/70 w-full rounded-full"></div>
      </article>
    );
  }
);

BlogCard.displayName = "BlogCard";

export default BlogCard;
