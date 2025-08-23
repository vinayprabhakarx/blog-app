import React, { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { cn } from "@/lib/utils";
// Redux and hooks
import { useBlog } from "../hooks/useRedux";
import { fetchBlogBySlug, fetchBlogById } from "../features/blog/blogSlice";
// Icons
import { MessageCircle, MessageCircleOff } from "lucide-react";
// Components
import BlogHeader from "../features/blog/BlogHeader";
import BlogDisplay from "../features/blog/BlogDisplay";
import { CommentSection } from "../features/comment";
import LoadingSpinner from "../components/common/LoadingSpinner";
import NotFound from "../components/common/NotFound";

const BlogPage = () => {
  const { slug, id } = useParams();
  const { currentBlog, currentBlogLoading, currentBlogError, dispatch } =
    useBlog();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (id) {
      // Fetch by ID (for notifications or preview mode)
      dispatch(fetchBlogById(id));
    } else if (slug) {
      dispatch(fetchBlogBySlug(slug));
    }
  }, [slug, id, dispatch]);

  // Loading state
  if (currentBlogLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex justify-center items-center min-h-[50vh]">
          <LoadingSpinner size="lg" message="Loading blog post..." />
        </div>
      </div>
    );
  }

  // Error state
  if (currentBlogError) {
    return (
      <NotFound
        title="Blog Not Found"
        message="The blog post you're looking for doesn't exist or has been removed."
        backPath="/"
        backText="Back to Home"
      />
    );
  }

  // No blog found (show loader first navigation frame to avoid flicker)
  if (!currentBlog) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex justify-center items-center min-h-[50vh]">
          <LoadingSpinner size="lg" message="Loading blog post..." />
        </div>
      </div>
    );
  }

  // If blog is draft, only author or admin can view
  if (
    currentBlog?.draft === true &&
    (!isAuthenticated ||
      !user ||
      (user.role !== "admin" &&
        (user._id || user.id) !==
          (currentBlog.author?._id || currentBlog.author)))
  ) {
    return (
      <NotFound
        title="Not Authorized"
        message="This draft is only visible to its author or an admin."
        backPath="/"
        backText="Back to Home"
      />
    );
  }

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  // Handle comment click from header - show comments and scroll to them
  const handleCommentClick = () => {
    if (!showComments) {
      setShowComments(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-10 sm:pt-14 md:pt-20">
        {/* Breadcrumb */}
        <nav
          className="max-w-[75ch] md:max-w-[80ch] mx-auto mb-8 text-sm"
          aria-label="Breadcrumb"
        >
          <ol className="flex items-center gap-2 text-muted-foreground">
            <li>
              <a href="/" className="hover:underline">
                Home
              </a>
            </li>
            <li>/</li>
            <li>
              <a href="/blogs" className="hover:underline">
                Blogs
              </a>
            </li>
            {currentBlog?.category && (
              <>
                <li>/</li>
                <li>
                  <a
                    href={`/category/${
                      currentBlog.category?.slug || currentBlog.category
                    }`}
                    className="hover:underline"
                  >
                    {currentBlog.category?.name ||
                      currentBlog.category?.slug ||
                      "Category"}
                  </a>
                </li>
              </>
            )}
            <li>/</li>
            <li className="truncate max-w-[40ch]" title={currentBlog?.title}>
              {currentBlog?.title}
            </li>
          </ol>
        </nav>
        <BlogHeader blog={currentBlog} onCommentClick={handleCommentClick} />
        <BlogDisplay blog={currentBlog} />

        {/* Comment Toggle Button - Now directly after blog content */}
        <div className="px-4 sm:px-6 pb-4">
          <div className="max-w-[75ch] md:max-w-[80ch] mx-auto">
            <div className="flex justify-center items-center gap-4">
              <button
                type="button"
                onClick={toggleComments}
                className="cursor-pointer inline-flex items-center gap-2 group"
                aria-label={
                  showComments
                    ? "Hide comments"
                    : `Show ${
                        currentBlog?.activity?.total_comments || 0
                      } comments`
                }
              >
                {showComments ? (
                  <>
                    <MessageCircleOff className="w-5 h-5" />
                    <span>Hide Comments</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    <span>
                      {currentBlog?.activity?.total_comments || 0}{" "}
                      {currentBlog?.activity?.total_comments === 1
                        ? "Comment"
                        : "Comments"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section - Full width outside the constrained container */}
      {showComments && (
        <div id="comment-section" className="w-full px-4 sm:px-6 pb-8 sm:pb-12">
          <CommentSection
            blogId={currentBlog._id}
            categoryId={
              currentBlog.category?._id ||
              currentBlog.category ||
              "uncategorized"
            }
            showCreateForm={true}
            maxNestingLevel={2}
            className="border-border p-6"
          />
        </div>
      )}

      {/* Back to Top Button */}
      <BackToTopButton />
    </div>
  );
};

// Back to Top Button Component
const BackToTopButton = () => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!showButton) return null;

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-lg transition-all duration-300",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        "hover:scale-110 active:scale-95 touch-manipulation",
        "border border-border/20 backdrop-blur-sm cursor-pointer"
      )}
      aria-label="Back to top"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  );
};

export default BlogPage;
