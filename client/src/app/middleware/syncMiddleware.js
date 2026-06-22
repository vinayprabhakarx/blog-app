import { setLikeData, getLikeCount } from "@/features/like/likesSlice";
import {
  fetchBlogBySlug,
  fetchBlogById,
  fetchAllBlogs,
  fetchMyBlogs,
  fetchBlogsByAuthor,
} from "@/features/blog/blogSlice";

export const syncMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  // Cross-feature synchronization
  switch (action.type) {
    case "comments/createComment/fulfilled": {
      const comment = action.payload;
      if (comment?.blog_id) {
        const currentBlog = store.getState().blog.currentBlog;
        if (currentBlog && currentBlog._id === comment.blog_id) {
          if (currentBlog.slug) {
            store.dispatch(fetchBlogBySlug(currentBlog.slug));
          } else if (currentBlog._id) {
            store.dispatch(fetchBlogById(currentBlog._id));
          }
        }
      }
      break;
    }

    // Delete comment
    case "comments/deleteComment/fulfilled": {
      const currentBlog = store.getState().blog.currentBlog;
      if (currentBlog) {
        if (currentBlog.slug) {
          store.dispatch(fetchBlogBySlug(currentBlog.slug));
        } else if (currentBlog._id) {
          store.dispatch(fetchBlogById(currentBlog._id));
        }
      }
      const { allBlogs, myBlogs, authorBlogs } = store.getState().blog;
      if (allBlogs.length > 0) {
        store.dispatch(fetchAllBlogs({ page: 1, limit: 20 }));
      }
      if (myBlogs.length > 0) {
        store.dispatch(fetchMyBlogs({ page: 1, limit: 20 }));
      }
      if (authorBlogs.length > 0) {
        store.dispatch(fetchBlogsByAuthor({ page: 1, limit: 20 }));
      }
      break;
    }

    // Update comment
    case "comments/updateComment/fulfilled": {
      const currentBlog = store.getState().blog.currentBlog;
      if (currentBlog) {
        if (currentBlog.slug) {
          store.dispatch(fetchBlogBySlug(currentBlog.slug));
        } else if (currentBlog._id) {
          store.dispatch(fetchBlogById(currentBlog._id));
        }
      }
      break;
    }

    // Report comment
    case "comments/reportComment/fulfilled": {
      const currentBlog = store.getState().blog.currentBlog;
      if (currentBlog) {
        if (currentBlog.slug) {
          store.dispatch(fetchBlogBySlug(currentBlog.slug));
        } else if (currentBlog._id) {
          store.dispatch(fetchBlogById(currentBlog._id));
        }
      }
      break;
    }

    // Toggle blog like
    case "likes/toggleBlogLike/fulfilled": {
      const { blogId, totalLikes, message } = action.payload;
      const isLiked = message && message.includes("liked");

      store.dispatch(
        setLikeData({
          items: [
            {
              id: blogId,
              type: "blog",
              count: totalLikes,
              isLiked,
            },
          ],
        })
      );
      break;
    }

    case "comments/toggleCommentLike/fulfilled": {
      // Comment likes handled in comment slice - no sync needed
      break;
    }

    // Sync like counts when blog data is fetched
    case "blog/fetchBlogBySlug/fulfilled":
    case "blog/fetchBlogById/fulfilled": {
      const blog = action.payload.blog || action.payload;
      if (blog && blog.activity) {
        store.dispatch(
          getLikeCount({
            likeableId: blog._id,
            onModel: "Blog",
          })
        );
      }
      break;
    }

    // Clear user data on logout
    case "auth/logout": {
      store.dispatch({ type: "likes/clearUserData" });
      break;
    }

    default:
      break;
  }

  return result;
};

// Optimistic updates middleware - currently disabled for stability
export const optimisticMiddleware = () => (next) => (action) => {
  return next(action);
};

export default syncMiddleware;
