import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { cn } from "@/lib/utils";
// Redux and hooks
import { useBlog } from "@/hooks/useRedux";
import { fetchBlogBySlug, fetchBlogById, clearCurrentBlog } from "@/features/blog/blogSlice";
import { setLikeData, getUserLikeStatus } from "@/features/like/likesSlice";
// Icons
import { MessageCircle, MessageCircleOff } from "lucide-react";
// Components
import BlogHeader from "@/features/blog/BlogHeader";
import BlogDisplay from "@/features/blog/BlogDisplay";
import { CommentSection } from "@/features/comment";
import NotFound from "@/components/common/NotFound";
import BlogPageSkeleton from "@/components/common/BlogPageSkeleton";

const BlogPage = () => {
  const { slug, id } = useParams();
  const { currentBlog, currentBlogError, currentBlogLoading, dispatch } = useBlog();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const mainDispatch = useDispatch();
  const [showComments, setShowComments] = useState(false);

  // Blog data for stable references
  const blogData = {
    id: currentBlog?._id,
    title: currentBlog?.title,
    category: currentBlog?.category,
    author: currentBlog?.author,
    activity: currentBlog?.activity,
    draft: currentBlog?.draft,
  };

  // User authentication check
  const isAuthorized =
    !blogData.draft ||
    (isAuthenticated &&
      user &&
      (user.role === "admin" ||
        (user._id || user.id) === (blogData.author?._id || blogData.author)));

  // Comment data
  const commentData = {
    count: blogData.activity?.total_comments || 0,
    categoryId: blogData.category?._id || blogData.category || "uncategorized",
  };

  // Breadcrumb data
  const breadcrumbData = {
    categoryName:
      blogData.category?.name || blogData.category?.slug || "Category",
    categorySlug: blogData.category?.slug || blogData.category,
    title: blogData.title,
  };

  useEffect(() => {
    let isMounted = true;

    const fetchBlog = async () => {
      if (isMounted) {
        // Only clear if we're navigating to a different blog
        const currentSlug = currentBlog?.slug;
        const currentId = currentBlog?._id;
        const isDifferentBlog = (slug && slug !== currentSlug) || (id && id !== currentId);
        
        if (isDifferentBlog) {
          dispatch(clearCurrentBlog());
        }
        
        if (id) {
          // Fetch by ID (for notifications or preview mode)
          dispatch(fetchBlogById(id));
        } else if (slug) {
          dispatch(fetchBlogBySlug(slug));
        }
      }
    };

    fetchBlog();

    return () => {
      isMounted = false;
    };
  }, [slug, id, dispatch, currentBlog?.slug, currentBlog?._id]);

  // Initialize like data when blog is loaded
  useEffect(() => {
    if (!currentBlog?._id) return;

    const likeItems = [
      {
        id: currentBlog._id,
        type: "blog",
        count: currentBlog.activity?.total_likes || 0,
      },
    ];
    mainDispatch(setLikeData({ items: likeItems }));

    // Fetch user's like status if authenticated
    if (isAuthenticated && (user?._id || user?.id)) {
      mainDispatch(
        getUserLikeStatus({
          likeableId: currentBlog._id,
          onModel: "Blog",
        })
      );
    }
  }, [
    currentBlog?._id,
    currentBlog?.activity?.total_likes,
    isAuthenticated,
    user?._id,
    user?.id,
    mainDispatch,
  ]);

  // Set dynamic page title for SEO based on blog title
  useEffect(() => {
    if (blogData.title) {
      document.title = `${blogData.title} | VinayPrabhakarX-Blog`;
    }
    return () => {
      document.title = "VinayPrabhakarX-Blog";
    };
  }, [blogData.title]);

  // Callback functions
  const toggleComments = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowComments((prev) => !prev);
  }, []);



  const currentSlug = currentBlog?.slug;
  const currentId = currentBlog?._id;
  const isStaleBlog = (slug && slug !== currentSlug) || (id && id !== currentId);

  // Show skeleton while loading, if no blog data, OR if the loaded blog doesn't match the URL
  if (currentBlogLoading || (!currentBlog && !currentBlogError) || (isStaleBlog && !currentBlogError)) {
    return <BlogPageSkeleton />;
  }

  const handleCommentClick = (e) => {
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
  };

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
      <div className="w-full  sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8">
        {/* Breadcrumb */}
        <nav className="max-w-2xl mx-auto mb-6 text-sm" aria-label="Breadcrumb">
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
        <article className="w-full">
          <BlogHeader blog={currentBlog} onCommentClick={handleCommentClick} />
        
          {/* Main Blog Content - Centered by BlogDisplay internal styles */}
          {/* 
              LAYOUT EXPLANATION:
              The BlogDisplay component inside handles its own centering (max-width: 50vw, margin: 0 auto).
              We avoid wrapping it in flex/grid here to prevent interfering with that centering logic.
          */}
          <div className="relative">
            <BlogDisplay blog={currentBlog} />
          </div>
        </article>

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

    </div>
  );
};

export default BlogPage;
