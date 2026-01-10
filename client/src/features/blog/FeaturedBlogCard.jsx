import React, { useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";

const FeaturedBlogCard = React.memo(({ blog, className, ...props }) => {
  // Memoize utility functions
  const formatDate = useCallback((date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const truncateText = useCallback((text, maxLength = 250) => {
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
    }),
    [blog?.author, blog?.authorInfo]
  );

  // Memoize computed display values
  const formattedDate = useMemo(
    () => formatDate(blogCreatedAt),
    [formatDate, blogCreatedAt]
  );

  const excerptText = useMemo(() => {
    return truncateText(blogExcerpt || blogContent, 500);
  }, [truncateText, blogExcerpt, blogContent]);

  // Memoize image source
  const imageSrc = useMemo(() => {
    if (!blogBanner) return null;
    return blogBanner.startsWith("http") ? blogBanner : `/api${blogBanner}`;
  }, [blogBanner]);

  const hasImage = Boolean(blogBanner && imageSrc);

  // Memoize image error handler
  const handleImageError = useCallback((e) => {
    e.target.style.display = "none";
  }, []);

  if (!blog) return null;

  return (
    <article
      className={cn("group w-full mb-8", className)}
      {...props}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Image or Title */}
        <div className={cn("order-1 lg:order-1 w-full flex flex-col justify-center", "lg:col-span-4")}>
          {hasImage ? (
             <Link to={`/blog/${blogSlug}`} className="block relative overflow-hidden rounded-xl group/image">
               <div className="aspect-video w-full bg-muted overflow-hidden">
                 <img
                    src={imageSrc}
                    alt={blogTitle}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover/image:scale-105"
                    loading="eager"
                    onError={handleImageError}
                  />
                  {/* Click indicator - same as BlogCard */}
                  <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover/image:opacity-100 transition-opacity duration-200">
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
          ) : (
             <Link to={`/blog/${blogSlug}`} className="block group-hover:text-primary transition-colors duration-300 py-2">
               <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-foreground tracking-tight">
                 {blogTitle}
               </h2>
             </Link>
          )}
        </div>

        {/* Right Column: Content */}
        <div className={cn("order-2 lg:order-2 flex flex-col justify-center h-full space-y-4 lg:py-2", "lg:col-span-8")}>

          {/* Title - Show here only if Image is present */}
          {hasImage && (
            <Link to={`/blog/${blogSlug}`} className="block group-hover:text-primary transition-colors duration-300">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-foreground tracking-tight">
                {blogTitle}
              </h2>
            </Link>
          )}



          {/* Excerpt */}
          <p className="text-lg text-muted-foreground leading-relaxed line-clamp-4 lg:line-clamp-6">
            {excerptText}
          </p>

          {/* Metadata - Below Excerpt */}
          <div className="flex flex-col gap-3">
             <div className="flex flex-wrap items-center gap-2 text-base text-muted-foreground">
                <span>By</span>
                <Link
                  to={`/${authorData.username}`}
                  className="font-medium text-foreground hover:text-primary transition-colors hover:underline"
                >
                  {authorData.displayName}
                </Link>
                <span className="text-muted-foreground italic">
                   &nbsp;|&nbsp;{formattedDate}
                </span>
             </div>
          </div>

          {/* Read More Button */}
          <div className="pt-1">
            <Link 
              to={`/blog/${blogSlug}`}
              className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all duration-300 group/btn"
            >
              <span className="group-hover/btn:underline">Continue Reading</span>
              <svg className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Separator */}
      <div className="w-full h-px bg-border my-12 opacity-50" />
    </article>
  );
});

FeaturedBlogCard.displayName = "FeaturedBlogCard";

export default FeaturedBlogCard;
