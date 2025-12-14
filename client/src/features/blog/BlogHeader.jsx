import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useSelector } from "react-redux";
import {
  Eye,
  MessageCircle,
  Heart,
  Share2,
  Clock,
  Printer,
  Pencil,
} from "lucide-react";
import { Link } from "react-router-dom";

import ShareDropdown from "../../components/common/ShareDropdown";
import LikeButton from "../../components/common/LikeButton";
import useBlogLike from "../../hooks/useBlogLike";

const handlePrint = () => {
  window.print();
};

const BlogHeader = ({ blog, onCommentClick }) => {
  const [isShareDropdownOpen, setIsShareDropdownOpen] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const shareButtonRef = useRef(null);

  // Use custom hook for optimized like functionality
  const blogId = blog?._id;
  const likeButtonState = useBlogLike(blogId, blog?.category);
  const { user } = useSelector((state) => state.auth);

  // Computed values
  const isAdmin = user?.role === "admin";
  const currentUserId = user?._id || user?.id;
  const blogAuthorId =
    blog?.author?._id || blog?.author?.id || blog?.author || null;
  const isAuthorOfBlog =
    currentUserId &&
    blogAuthorId &&
    String(blogAuthorId) === String(currentUserId);
  const canEdit = Boolean(isAdmin || isAuthorOfBlog);

  // Data objects and computed values
  const blogMetadata = {
    title: blog?.title || "",
    createdAt: blog?.createdAt,
    content: blog?.content,
    banner: blog?.banner,
    tags: blog?.tags || [],
    slug: blog?.slug,
    draft: blog?.draft,
    excerpt: blog?.excerpt,
    category: blog?.category,
  };

  const authorInfo = {
    username:
      blog?.author?.personal_info?.username ||
      blog?.authorInfo?.username ||
      "vinayprabhakarx",
    profileImg:
      blog?.author?.personal_info?.profile_img ||
      blog?.author?.avatar ||
      blog?.authorInfo?.profile_img,
  };

  const activityStats = {
    totalReads: blog?.activity?.total_reads || 0,
    totalComments: blog?.activity?.total_comments || 0,
  };

  // Memoize utility functions
  const formatDate = useCallback((date, short = false) => {
    if (!date) return "";
    const d = new Date(date);
    if (short) {
      const day = d.getDate();
      const month = d.toLocaleString("default", { month: "short" });
      const year = d.getFullYear();
      return `${day} ${month}, ${year}`;
    }
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  // Format read time as '1 m' for mobile
  const calculateReadTime = useCallback((content, short = false) => {
    const wordsPerMinute = 200;
    const wordCount = content?.replace(/<[^>]*>/g, "").split(/\s+/).length || 0;
    const readTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    if (short) {
      return `${readTime} m`;
    }
    return `${readTime} min read`;
  }, []);

  // Memoize computed display values
  const formattedDateMobile = useMemo(
    () =>
      blogMetadata.createdAt ? formatDate(blogMetadata.createdAt, true) : "",
    [blogMetadata.createdAt, formatDate]
  );
  const readTimeTextMobile = useMemo(
    () => calculateReadTime(blogMetadata.content, true),
    [blogMetadata.content, calculateReadTime]
  );

  // For sharing
  const shareData = useMemo(
    () => ({
      url: window.location.href,
      title: blogMetadata.title || "Check out this blog",
      description:
        blogMetadata.excerpt ||
        blogMetadata.content?.substring(0, 150) + "..." ||
        "",
    }),
    [blogMetadata.title, blogMetadata.excerpt, blogMetadata.content]
  );

  // Memoize callback functions
  const handleShare = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsShareDropdownOpen((prev) => !prev);
  }, []);

  const handleShareMouseEnter = useCallback(() => {
    if (!("ontouchstart" in window)) {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
      setIsShareDropdownOpen(true);
    }
  }, [hoverTimeout]);

  const handleShareMouseLeave = useCallback(() => {
    if (!("ontouchstart" in window)) {
      const timeout = setTimeout(() => {
        setIsShareDropdownOpen(false);
      }, 200);
      setHoverTimeout(timeout);
    }
  }, []);

  const handleDropdownMouseEnter = useCallback(() => {
    if (!("ontouchstart" in window) && hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
  }, [hoverTimeout]);

  const handleDropdownMouseLeave = useCallback(() => {
    if (!("ontouchstart" in window)) {
      setIsShareDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if ("ontouchstart" in window && isShareDropdownOpen) {
        if (
          shareButtonRef.current &&
          !shareButtonRef.current.contains(event.target)
        ) {
          const dropdownElement = document.querySelector(
            "[data-share-dropdown]"
          );
          if (dropdownElement && !dropdownElement.contains(event.target)) {
            setIsShareDropdownOpen(false);
          }
        }
      }
    };

    if (isShareDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isShareDropdownOpen]);

  const handleCommentClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (onCommentClick) {
        onCommentClick(e);
      }
    },
    [onCommentClick]
  );

  // Inline styles
  const containerStyle = {
    maxWidth: window.innerWidth < 768 ? "100%" : "800px",
    margin: window.innerWidth < 768 ? 0 : "0 auto",
  };

  // Image source with error handling
  const bannerImageSrc = !blogMetadata.banner
    ? null
    : blogMetadata.banner.startsWith("http")
    ? blogMetadata.banner
    : `/api${blogMetadata.banner}`;

  // Memoize image error handler
  const handleImageError = useCallback((e) => {
    e.target.style.display = "none";
  }, []);

  return (
    <div className="w-full overflow-hidden">
      <div className="w-full px-2 sm:px-4 md:px-0 pb-6" style={containerStyle}>
        <header className="mb-6 border-b border-border pb-4">
          {/* Title */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-2 text-foreground">
            {blogMetadata.title}
          </h1>
          {/* Subtitle/Excerpt */}
          {blogMetadata.excerpt && (
            <div className="text-base md:text-lg text-muted-foreground mb-4">
              {blogMetadata.excerpt}
            </div>
          )}
          {/* Byline and Date */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>By&nbsp;</span>
            <Link
              to={`/${authorInfo.username}`}
              className="font-semibold hover:underline"
            >
              {authorInfo.username}
            </Link>
            <span className="italic">&nbsp;|&nbsp;{formattedDateMobile}</span>
          </div>
          {/* Stats Row */}
          <div className="flex flex-nowrap items-center gap-4 md:gap-6 lg:gap-8 text-sm sm:text-base text-muted-foreground mt-4 min-w-0">
            <div className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="flex-shrink-0">{activityStats.totalReads}</span>
            </div>
            <button
              type="button"
              onClick={handleCommentClick}
              className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap hover:text-primary cursor-pointer transition-colors"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{activityStats.totalComments}</span>
            </button>
            <LikeButton
              count={likeButtonState.count}
              isLiked={likeButtonState.isLiked}
              isToggling={likeButtonState.isToggling}
              isDisabled={likeButtonState.isDisabled}
              onLike={likeButtonState.handleLike}
            />
            <div className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{readTimeTextMobile}</span>
            </div>
            <div className="relative flex items-center gap-1">
              <button
                type="button"
                ref={shareButtonRef}
                onClick={handleShare}
                onMouseEnter={handleShareMouseEnter}
                onMouseLeave={handleShareMouseLeave}
                className="flex items-center hover:text-primary transition-colors cursor-pointer"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <ShareDropdown
                isOpen={isShareDropdownOpen}
                onClose={() => setIsShareDropdownOpen(false)}
                onMouseEnter={handleDropdownMouseEnter}
                onMouseLeave={handleDropdownMouseLeave}
                url={shareData.url}
                title={shareData.title}
                description={shareData.description}
                buttonRef={shareButtonRef}
              />
              {canEdit &&
                (blogMetadata.draft ? (
                  <Link
                    to={`/editor/${blog._id}`}
                    className="flex items-center gap-1 hover:text-primary cursor-pointer transition-colors"
                    aria-label="Edit draft"
                  >
                    <Pencil className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="hidden xs:inline">Edit</span>
                  </Link>
                ) : (
                  blogMetadata.slug && (
                    <Link
                      to={`/blogs/edit/${blogMetadata.slug}`}
                      className="flex items-center gap-1 hover:text-primary cursor-pointer transition-colors"
                      aria-label="Edit blog"
                    >
                      <Pencil className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="hidden xs:inline">Edit</span>
                    </Link>
                  )
                ))}
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex items-center hover:text-primary cursor-pointer transition-colors"
              aria-label="Print"
            >
              <Printer className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            </button>
          </div>
        </header>
        {/* Banner image below header */}
        {bannerImageSrc && (
          <div className="mt-6">
            <div className="relative overflow-hidden bg-muted rounded-lg border border-border/50 aspect-video">
              <img
                src={bannerImageSrc}
                alt={blogMetadata.title}
                className="h-full w-full object-cover"
                loading="lazy"
                onError={handleImageError}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

BlogHeader.displayName = "BlogHeader";

export default BlogHeader;
