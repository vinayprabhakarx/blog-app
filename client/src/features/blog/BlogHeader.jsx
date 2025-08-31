import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useDispatch, useSelector } from "react-redux";
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

import { refreshNotificationsAfterAction } from "../../utils/notificationRefresh";
import ShareDropdown from "../../components/common/ShareDropdown";
import {
  toggleBlogLike,
  selectLikeCount,
  selectUserLikeStatus,
  selectToggleLoading,
  toggleBlogLikeFrontend,
} from "../like/likesSlice";

const handlePrint = () => {
  window.print();
};

const BlogHeader = React.memo(({ blog, onCommentClick }) => {
  const dispatch = useDispatch();

  const [isShareDropdownOpen, setIsShareDropdownOpen] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const shareButtonRef = useRef(null);

  const likeCount = useSelector((state) =>
    selectLikeCount(state, blog?._id, "blog")
  );
  const isLiked = useSelector((state) =>
    selectUserLikeStatus(state, blog?._id, "blog")
  );
  const isToggling = useSelector((state) =>
    selectToggleLoading(state, blog?._id, "blog")
  );
  const { user } = useSelector((state) => state.auth);

  // Memoize computed values
  const isAdmin = useMemo(() => user?.role === "admin", [user?.role]);
  const currentUserId = useMemo(
    () => user?._id || user?.id,
    [user?._id, user?.id]
  );
  const blogAuthorId = useMemo(
    () => blog?.author?._id || blog?.author?.id || blog?.author || null,
    [blog?.author]
  );
  const isAuthorOfBlog = useMemo(
    () =>
      currentUserId &&
      blogAuthorId &&
      String(blogAuthorId) === String(currentUserId),
    [currentUserId, blogAuthorId]
  );
  const canEdit = useMemo(
    () => Boolean(isAdmin || isAuthorOfBlog),
    [isAdmin, isAuthorOfBlog]
  );

  // Memoize data objects and computed values
  const blogMetadata = useMemo(
    () => ({
      title: blog?.title || "",
      createdAt: blog?.createdAt,
      content: blog?.content,
      banner: blog?.banner,
      tags: blog?.tags || [],
      slug: blog?.slug,
      draft: blog?.draft,
      excerpt: blog?.excerpt,
      category: blog?.category,
    }),
    [blog]
  );

  const authorInfo = useMemo(
    () => ({
      username: blog?.author?.personal_info?.username || "vinayprabhakarx",
      profileImg:
        blog?.author?.personal_info?.profile_img || blog?.author?.avatar,
    }),
    [blog?.author]
  );

  const activityStats = useMemo(
    () => ({
      totalReads: blog?.activity?.total_reads || 0,
      totalComments: blog?.activity?.total_comments || 0,
    }),
    [blog?.activity]
  );

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
  const handleLike = useCallback(async () => {
    if (!user) {
      alert("Please log in to like this blog");
      return;
    }

    if (!blog?._id) return;

    dispatch(toggleBlogLikeFrontend({ blogId: blog._id }));

    try {
      await dispatch(
        toggleBlogLike({
          blogId: blog._id,
          categoryId:
            blogMetadata.category?._id ||
            blogMetadata.category ||
            "uncategorized",
        })
      ).unwrap();

      refreshNotificationsAfterAction("like");
    } catch (error) {
      dispatch(toggleBlogLikeFrontend({ blogId: blog._id }));
    }
  }, [user, blog?._id, dispatch, blogMetadata.category]);

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

  return (
    <div className="w-full overflow-hidden">
      <div
        className="w-full px-2 sm:px-4 md:px-0 pb-6"
        style={{
          maxWidth: window.innerWidth < 768 ? "100%" : "800px",
          margin: window.innerWidth < 768 ? 0 : "0 auto",
        }}
      >
        <header className="mb-6 border-b border-border pb-4">
          {/* Title */}
          <h1
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-2 text-foreground"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {blogMetadata.title}
          </h1>
          {/* Subtitle/Excerpt */}
          {blogMetadata.excerpt && (
            <div
              className="text-lg md:text-xl text-muted-foreground mb-4"
              style={{ fontFamily: "Georgia, serif" }}
            >
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
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLike();
              }}
              disabled={!user || isToggling}
              className={`flex items-center gap-2 flex-shrink-0 whitespace-nowrap transition-colors ${
                !user || isToggling
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:text-red-500 cursor-pointer"
              }`}
            >
              <Heart
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  isLiked ? "fill-red-500 text-red-500" : ""
                }`}
              />
              <span>{likeCount}</span>
              {isToggling && <span className="text-xs">...</span>}
            </button>
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
        {blogMetadata.banner && (
          <div className="mb-6">
            <div className="relative w-full pt-[56.25%] rounded-lg shadow-lg overflow-hidden">
              <img
                src={blogMetadata.banner}
                alt={blogMetadata.title}
                className="absolute top-0 left-0 w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default BlogHeader;
