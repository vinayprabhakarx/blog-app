import React, { useState, useEffect, useRef } from "react";
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

const BlogHeader = ({ blog, onCommentClick }) => {
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

  const isAdmin = user?.role === "admin";
  const currentUserId = user?._id || user?.id;
  const blogAuthorId =
    blog?.author?._id || blog?.author?.id || blog?.author || null;
  const isAuthorOfBlog =
    currentUserId &&
    blogAuthorId &&
    String(blogAuthorId) === String(currentUserId);
  const canEdit = Boolean(isAdmin || isAuthorOfBlog);

  useEffect(() => {
    if (blog?._id) {
      dispatch(
        getLikeCount({
          likeableId: blog._id,
          onModel: "Blog",
        })
      );

      if (user) {
        dispatch(
          getUserLikeStatus({
            likeableId: blog._id,
            onModel: "Blog",
          })
        );
      }
    }
  }, [blog?._id, user, dispatch]);

  const handleLike = async () => {
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
          categoryId: blog.category?._id || blog.category || "uncategorized",
        })
      ).unwrap();

      refreshNotificationsAfterAction("like");
    } catch (error) {
      console.error("❌ Failed to toggle like:", error);
      dispatch(toggleBlogLikeFrontend({ blogId: blog._id }));
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsShareDropdownOpen((prev) => !prev);
  };

  const handleShareMouseEnter = () => {
    if (!("ontouchstart" in window)) {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
      setIsShareDropdownOpen(true);
    }
  };

  const handleShareMouseLeave = () => {
    if (!("ontouchstart" in window)) {
      const timeout = setTimeout(() => {
        setIsShareDropdownOpen(false);
      }, 200);
      setHoverTimeout(timeout);
    }
  };

  const handleDropdownMouseEnter = () => {
    if (!("ontouchstart" in window) && hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
  };

  const handleDropdownMouseLeave = () => {
    if (!("ontouchstart" in window)) {
      setIsShareDropdownOpen(false);
    }
  };

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

  const handleCommentClick = () => {
    if (onCommentClick) {
      onCommentClick();
    }

    setTimeout(() => {
      const commentSection = document.getElementById("comment-section");
      if (commentSection) {
        commentSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const calculateReadTime = (content) => {
    const wordsPerMinute = 200;
    const wordCount = content?.replace(/<[^>]*>/g, "").split(/\s+/).length || 0;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readTime} min read`;
  };

  return (
    <div className="w-full max-w-[75ch] md:max-w-[80ch] mx-auto px-4 sm:px-6 pb-8 sm:pb-12">
      <header className="mb-8">
        <h1
          className="text-4xl font-bold mb-6 leading-tight"
          style={{ color: "var(--foreground)" }}
        >
          {blog.title}
        </h1>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
          <div
            className="flex flex-wrap items-center gap-4 lg:gap-6 text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                <AvatarImage
                  src={
                    blog.author?.personal_info?.profile_img ||
                    blog.author?.avatar
                  }
                />
                <AvatarFallback>
                  <User className="h-3 w-3 sm:h-3 sm:w-3" />
                </AvatarFallback>
              </Avatar>
              <Link
                to={`/${
                  blog.author?.personal_info?.username || "vinayprabhakarx"
                }`}
                className="truncate hover:text-primary transition-colors duration-200 cursor-pointer"
              >
                {blog.author?.personal_info?.username || "vinayprabhakarx"}
              </Link>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Calendar size={16} />
              <span>{formatDate(blog.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 no-print whitespace-nowrap">
              <Clock size={16} />
              <span>{calculateReadTime(blog.content)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground no-print flex-wrap lg:flex-nowrap">
            <div className="flex items-center gap-1">
              <Eye size={16} />
              <span>{blog.activity?.total_reads || 0}</span>
            </div>
            <button
              onClick={handleCommentClick}
              className="flex items-center gap-1 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-colors"
            >
              <MessageCircle size={16} />
              <span>{blog.activity?.total_comments || 0}</span>
            </button>
            <button
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
                url={window.location.href}
                title={blog?.title || "Check out this blog"}
                description={
                  blog?.excerpt ||
                  blog?.content?.substring(0, 150) + "..." ||
                  ""
                }
                buttonRef={shareButtonRef}
              />
            </div>
            {canEdit &&
              (blog?.draft ? (
                <Link
                  to={`/editor/${blog._id}`}
                  className="flex items-center gap-1 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-colors"
                  aria-label="Edit draft"
                >
                  <Pencil size={16} />
                  <span>Edit</span>
                </Link>
              ) : (
                blog?.slug && (
                  <Link
                    to={`/blogs/edit/${blog.slug}`}
                    className="flex items-center gap-1 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-colors"
                    aria-label="Edit blog"
                  >
                    <Pencil size={16} />
                    <span>Edit</span>
                  </Link>
                )
              ))}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-colors"
            >
              <Printer size={16} />
              <span>Print</span>
            </button>
          </div>
        </div>

        {blog.tags && blog.tags.length > 0 && (
          <div className="flex items-start gap-2 mb-6">
            <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 mt-1">
              <Tag className="inline mr-1" size={16} />
            </span>
            <div className="flex flex-wrap gap-2">
              {blog.tags.map((tag, index) => (
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

      {blog.banner && (
        <div className="mb-8">
          <div className="relative w-full pt-[56.25%] rounded-lg shadow-lg overflow-hidden">
            <img
              src={blog.banner}
              alt={blog.title}
              className="absolute top-0 left-0 w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogHeader;
