import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchBlogBySlug, fetchBlogById, clearCurrentBlog } from "./blogSlice";
import BlogForm from "./BlogForm";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const BlogFormWrapper = () => {
  const { slug, id } = useParams();
  const dispatch = useDispatch();
  const { currentBlog, currentBlogLoading, currentBlogError } = useSelector(
    (state) => state.blog
  );
  const user = useSelector((state) => state.auth.user);

  const isEditing = Boolean(slug || id);
  const editParam = slug || id;

  useEffect(() => {
    if (isEditing) {
      dispatch(clearCurrentBlog());
      // Use ID endpoint for MongoDB ObjectIds, slug endpoint for readable URLs
      if (id || (slug && /^[0-9a-fA-F]{24}$/.test(slug))) {
        dispatch(fetchBlogById(editParam));
      } else {
        dispatch(fetchBlogBySlug(editParam));
      }
    }
  }, [dispatch, slug, id, editParam, isEditing]);

  if (isEditing && (currentBlogLoading || !currentBlog || !user)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (isEditing && currentBlogError) {
    return (
      <div className="text-center content-center justify-center mt-30">
        <h2 className="flex text-center justify-center text-2xl font-bold text-destructive">
          Blog not found
        </h2>
        <p className="text-foreground mt-2">
          The blog you're trying to edit doesn't exist.
        </p>
      </div>
    );
  }

  if (
    isEditing &&
    currentBlog &&
    user &&
    (currentBlog.author?._id ||
      currentBlog.author?.id ||
      currentBlog.author) !== (user?._id || user?.id) &&
    user.role !== "admin"
  ) {
    return (
      <div className="text-center content-center justify-center mt-30">
        <h2 className="flex text-center justify-center text-2xl font-bold text-destructive">
          Unauthorized
        </h2>
        <p className="text-foreground mt-2">
          You don't have permission to edit this blog.
        </p>
      </div>
    );
  }

  return <BlogForm existingBlog={isEditing ? currentBlog : null} />;
};

export default BlogFormWrapper;
