import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { cn } from "@/lib/utils";
// Redux and hooks
import { useBlog } from "../hooks/useRedux";
import { fetchBlogBySlug, fetchBlogById } from "../features/blog/blogSlice";
import { setLikeData, getUserLikeStatus } from "../features/like/likesSlice";
// Icons
import { MessageCircle, MessageCircleOff } from "lucide-react";
// Components
import BlogHeader from "../features/blog/BlogHeader";
import BlogDisplay from "../features/blog/BlogDisplay";
import { CommentSection } from "../features/comment";
import NotFound from "../components/common/NotFound";

const BlogPage = React.memo(() => {
  const { slug, id } = useParams();
  const { currentBlog, currentBlogError, dispatch } = useBlog();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const mainDispatch = useDispatch();
  const [showComments, setShowComments] = useState(false);

  // Memoize blog data for stable references
  const blogData = useMemo(
    () => ({
      id: currentBlog?._id,
      title: currentBlog?.title,
      category: currentBlog?.category,
      author: currentBlog?.author,
      activity: currentBlog?.activity,
      draft: currentBlog?.draft,
    }),
    [currentBlog]
  );

  // Memoize user authentication check
  const isAuthorized = useMemo(() => {
    if (!blogData.draft) return true;
    if (!isAuthenticated || !user) return false;
    return (
      user.role === "admin" ||
      (user._id || user.id) === (blogData.author?._id || blogData.author)
    );
  }, [blogData.draft, blogData.author, isAuthenticated, user]);

  // Memoize comment data
  const commentData = useMemo(
    () => ({
      count: blogData.activity?.total_comments || 0,
      categoryId:
        blogData.category?._id || blogData.category || "uncategorized",
    }),
    [blogData.activity, blogData.category]
  );

  // Memoize breadcrumb data
  const breadcrumbData = useMemo(
    () => ({
      categoryName:
        blogData.category?.name || blogData.category?.slug || "Category",
      categorySlug: blogData.category?.slug || blogData.category,
      title: blogData.title,
    }),
    [blogData.category, blogData.title]
  );

  useEffect(() => {
    if (id) {
      // Fetch by ID (for notifications or preview mode)
      dispatch(fetchBlogById(id));
    } else if (slug) {
      dispatch(fetchBlogBySlug(slug));
    }
  }, [slug, id, dispatch]);

  // Memoize like data initialization to prevent unnecessary dispatches
  const likeInitData = useMemo(() => {
    if (!currentBlog?._id) return null;
    return {
      blogId: currentBlog._id,
      likeCount: currentBlog.activity?.total_likes || 0,
    };
  }, [currentBlog?._id, currentBlog?.activity?.total_likes]);

  // Memoize user authentication state for like initialization
  const userAuthState = useMemo(
    () => ({
      isAuthenticated,
      userId: user?._id || user?.id,
    }),
    [isAuthenticated, user?._id, user?.id]
  );

  // Initialize like data when blog is loaded (optimized to prevent unnecessary calls)
  useEffect(() => {
    if (likeInitData) {
      const likeItems = [
        {
          id: likeInitData.blogId,
          type: "blog",
          count: likeInitData.likeCount,
        },
      ];
      mainDispatch(setLikeData({ items: likeItems }));

      // Fetch user's like status if authenticated
      if (userAuthState.isAuthenticated && userAuthState.userId) {
        mainDispatch(
          getUserLikeStatus({
            likeableId: likeInitData.blogId,
            onModel: "Blog",
          })
        );
      }
    }
  }, [likeInitData, userAuthState, mainDispatch]);

  // Memoize callback functions
  const toggleComments = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowComments((prev) => !prev);
  }, []);

  const handleCommentClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Always show comments when clicked from header
      if (!showComments) {
        setShowComments(true);
        // Scroll to comments after they're shown
        setTimeout(() => {
          const commentSection = document.getElementById("comment-section");
          if (commentSection) {
            commentSection.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }, 200);
      } else {
        // If comments are already shown, just scroll to them
        const commentSection = document.getElementById("comment-section");
        if (commentSection) {
          commentSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
    },
    [showComments]
  );

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

  // No blog found - just return null or empty div instead of loading spinner
  if (!currentBlog) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex justify-center items-center min-h-[50vh]">
          {/* Blog content will appear here once loaded */}
        </div>
      </div>
    );
  }

  // If blog is draft, only author or admin can view
  if (!isAuthorized) {
    return (
      <NotFound
        title="Not Authorized"
        message="This draft is only visible to its author or an admin."
        backPath="/"
        backText="Back to Home"
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content Container */}
      <div className="w-full  sm:px-6 md:px-8 pt-10 sm:pt-14 md:pt-20">
        {/* Breadcrumb */}
        <nav className="max-w-2xl mx-auto mb-8 text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-muted-foreground flex-wrap">
            <li>
              <Link
                to="/"
                className="text-primary hover:text-primary/80 hover:underline"
              >
                Home
              </Link>
            </li>
            {blogData.category && (
              <>
                <li>/</li>
                <li>
                  <Link
                    to={`/category/${breadcrumbData.categorySlug}`}
                    className="text-primary hover:text-primary/80 hover:underline whitespace-nowrap"
                  >
                    {breadcrumbData.categoryName}
                  </Link>
                </li>
              </>
            )}
            <li>/</li>
            <li className="truncate max-w-[40ch]" title={breadcrumbData.title}>
              {breadcrumbData.title}
            </li>
          </ol>
        </nav>
        <BlogHeader blog={currentBlog} onCommentClick={handleCommentClick} />
        <BlogDisplay blog={currentBlog} />

        {/* Comment Toggle Button - Now directly after blog content */}
        <div className="px-1 sm:px-2 md:px-4 pb-4">
          <div className="max-w-[75ch] md:max-w-[80ch] mx-auto">
            <div className="flex justify-center items-center gap-4">
              <button
                type="button"
                onClick={toggleComments}
                className="cursor-pointer inline-flex items-center gap-2 group"
                aria-label={
                  showComments
                    ? "Hide comments"
                    : `Show ${commentData.count} comments`
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
                      {commentData.count}{" "}
                      {commentData.count === 1 ? "Comment" : "Comments"}
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
        <div
          id="comment-section"
          className="w-full px-1 sm:px-2 md:px-4 pb-8 sm:pb-12"
        >
          <CommentSection
            blogId={blogData.id}
            categoryId={commentData.categoryId}
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
});

BlogPage.displayName = "BlogPage";

// Back to Top Button Component
const BackToTopButton = React.memo(() => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

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
});

BackToTopButton.displayName = "BackToTopButton";

export default BlogPage;
