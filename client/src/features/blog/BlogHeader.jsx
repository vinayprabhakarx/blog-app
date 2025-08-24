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
  Calendar,
  Clock,
  User,
  Tag,
  Printer,
  Pencil,
} from "lucide-react";
import { Link } from "react-router-dom";

import { refreshNotificationsAfterAction } from "../../utils/notificationRefresh";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import ShareDropdown from "../../components/common/ShareDropdown";
import {
  toggleBlogLike,
  getUserLikeStatus,
  getLikeCount,
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
  const formatDate = useCallback(
    (date) =>
      new Date(date).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    []
  );

  const calculateReadTime = useCallback((content) => {
    const wordsPerMinute = 200;
    const wordCount = content?.replace(/<[^>]*>/g, "").split(/\s+/).length || 0;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readTime} min read`;
  }, []);

  // Memoize computed display values
  const formattedDate = useMemo(
    () => (blogMetadata.createdAt ? formatDate(blogMetadata.createdAt) : ""),
    [blogMetadata.createdAt, formatDate]
  );

  const readTimeText = useMemo(
    () => calculateReadTime(blogMetadata.content),
    [blogMetadata.content, calculateReadTime]
  );

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
    <div className="w-full max-w-[75ch] md:max-w-[80ch] mx-auto px-4 sm:px-6 pb-8 sm:pb-12">
      <header className="mb-8">
        <h1
          className="text-4xl font-bold mb-6 leading-tight"
          style={{ color: "var(--foreground)" }}
        >
          {blogMetadata.title}
        </h1>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
          <div
            className="flex flex-wrap items-center gap-4 lg:gap-6 text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                <AvatarImage src={authorInfo.profileImg} />
                <AvatarFallback>
                  <User className="h-3 w-3 sm:h-3 sm:w-3" />
                </AvatarFallback>
              </Avatar>
              <Link
                to={`/${authorInfo.username}`}
                className="truncate hover:text-primary transition-colors duration-200 cursor-pointer"
              >
                {authorInfo.username}
              </Link>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Calendar size={16} />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 no-print whitespace-nowrap">
              <Clock size={16} />
              <span>{readTimeText}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground no-print flex-wrap lg:flex-nowrap">
            <div className="flex items-center gap-1">
              <Eye size={16} />
              <span>{activityStats.totalReads}</span>
            </div>
            <button
              type="button"
              onClick={handleCommentClick}
              className="flex items-center gap-1 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-colors"
            >
              <MessageCircle size={16} />
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
              className={`flex items-center gap-1 transition-colors ${
                !user || isToggling
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:text-red-500 dark:hover:text-red-400 cursor-pointer"
              }`}
            >
              <Heart
                size={16}
                className={isLiked ? "fill-red-500 text-red-500" : ""}
              />
              <span>{likeCount}</span>
              {isToggling && <span className="text-xs">...</span>}
            </button>
            <div className="relative">
              <button
                type="button"
                ref={shareButtonRef}
                onClick={handleShare}
                onMouseEnter={handleShareMouseEnter}
                onMouseLeave={handleShareMouseLeave}
                className="flex items-center gap-1 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-colors"
              >
                <Share2 size={16} />
                <span>Share</span>
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
            </div>
            {canEdit &&
              (blogMetadata.draft ? (
                <Link
                  to={`/editor/${blog._id}`}
                  className="flex items-center gap-1 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-colors"
                  aria-label="Edit draft"
                >
                  <Pencil size={16} />
                  <span>Edit</span>
                </Link>
              ) : (
                blogMetadata.slug && (
                  <Link
                    to={`/blogs/edit/${blogMetadata.slug}`}
                    className="flex items-center gap-1 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-colors"
                    aria-label="Edit blog"
                  >
                    <Pencil size={16} />
                    <span>Edit</span>
                  </Link>
                )
              ))}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-colors"
            >
              <Printer size={16} />
              <span>Print</span>
            </button>
          </div>
        </div>

        {blogMetadata.tags && blogMetadata.tags.length > 0 && (
          <div className="flex items-start gap-2 mb-6">
            <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 mt-1">
              <Tag className="inline mr-1" size={16} />
            </span>
            <div className="flex flex-wrap gap-2">
              {blogMetadata.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap"
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "var(--accent-foreground)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </header>

      {blogMetadata.banner && (
        <div className="mb-8">
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
  );
});

export default BlogHeader;
