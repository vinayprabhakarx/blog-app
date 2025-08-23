import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import slugify from "slugify";
import { showToast } from "../../utils/showToast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import BlogEditor from "./BlogEditor";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createBlog, updateBlog } from "./blogSlice";
import { fetchAllCategories } from "../category/categoriesSlice";
import { useCategories } from "../../hooks/useRedux";
import LoadingButton from "../../components/common/LoadingButton";
import ImageCropper from "../../components/common/ImageCropper";
import { IoCameraOutline } from "react-icons/io5";

const BlogForm = ({ existingBlog }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const { createLoading, updateLoading } = useSelector((state) => state.blog);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    categories: categoryData,
    loading: loadingCategories,
    dispatch: categoriesDispatch,
  } = useCategories();

  const isEditing = Boolean(existingBlog);

  const [formData, setFormData] = useState({
    category: "",
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    tags: "",
    draft: false,
  });

  const [formErrors, setFormErrors] = useState({});

  // Image state
  const [filePreview, setPreview] = useState();
  const [file, setFile] = useState();
  const [croppedFile, setCroppedFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  useEffect(() => {
    if (existingBlog) {
      const categoryId =
        typeof existingBlog.category === "object"
          ? existingBlog.category._id
          : existingBlog.category;
      setFormData({
        category: categoryId || "",
        title: existingBlog.title || "",
        slug: existingBlog.slug || "",
        content: existingBlog.content || "",
        excerpt: existingBlog.excerpt || "",
        tags: Array.isArray(existingBlog.tags)
          ? existingBlog.tags.join(", ")
          : "",
        draft: existingBlog.draft || false,
      });

      if (existingBlog.banner) {
        setPreview(existingBlog.banner);
      }
    }
  }, [existingBlog]);

  useEffect(() => {
    if (categoryData.length === 0 && !loadingCategories) {
      categoriesDispatch(fetchAllCategories());
    }
  }, [categoriesDispatch, categoryData.length, loadingCategories]);

  useEffect(() => {
    if (formData.title && !isEditing) {
      const slug = slugify(formData.title, { lower: true });
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.title, isEditing]);

  const handleInputChange = (name, value) => {
    if (name === "excerpt" && value.length > 200) {
      value = value.substring(0, 200);
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleToggleDraft = () => {
    setFormData((prev) => ({ ...prev, draft: !prev.draft }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.category.trim()) {
      errors.category = "Category is required";
    }

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    } else if (formData.title.trim().length < 10) {
      errors.title = "Title must be at least 10 characters long";
    } else if (formData.title.trim().length > 200) {
      errors.title = "Title must be less than 200 characters long";
    }

    if (!formData.slug.trim()) {
      errors.slug = "Slug is required";
    } else if (formData.slug.trim().length < 3) {
      errors.slug = "Slug must be at least 3 characters long";
    }

    if (formData.excerpt.trim().length > 200) {
      errors.excerpt = "Excerpt must be less than 200 characters long";
    }

    if (!formData.draft) {
      if (!formData.content.trim()) {
        errors.content = "Blog content is required";
      } else if (formData.content.trim().length < 10) {
        errors.content = "Blog content must be at least 10 characters long";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const currentLoading = isEditing ? updateLoading : createLoading;

    // Prevent multiple simultaneous submissions
    if (currentLoading || submitSuccess) {
      return;
    }

    // Validate form
    if (!validateForm()) {
      showToast("error", "Please fix the form errors before submitting");
      return;
    }

    try {
      // Create data object for the service
      const submitData = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        draft: formData.draft.toString(),
        category: formData.category,
        content: formData.content.trim(),
      };

      // Add optional fields if they exist
      if (formData.excerpt.trim()) {
        submitData.excerpt = formData.excerpt.trim();
      }

      // Handle tags - send as comma-separated string as expected by backend
      if (formData.tags.trim()) {
        submitData.tags = formData.tags.trim();
      }

      // Use cropped file if available, otherwise use original file
      const fileToUpload = croppedFile || file;
      if (fileToUpload) {
        submitData.banner = fileToUpload;
      }

      let result;
      if (isEditing) {
        result = await dispatch(
          updateBlog({ id: existingBlog._id, blogData: submitData })
        ).unwrap();
      } else {
        result = await dispatch(createBlog(submitData)).unwrap();
      }

      // Set success state temporarily
      setSubmitSuccess(true);

      // Success handling - cleanup states (only for new blogs)
      if (!isEditing) {
        setFormData({
          category: "",
          title: "",
          slug: "",
          content: "",
          excerpt: "",
          tags: "",
          draft: false,
        });
      }
      setFormErrors({});
      setFile(null);
      setCroppedFile(null);

      // Don't clear preview for existing blogs to show current image
      if (!isEditing) {
        setPreview(null);
      }

      // Clean up any blob URLs
      if (filePreview && filePreview.startsWith("blob:")) {
        URL.revokeObjectURL(filePreview);
      }
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }

      // Show success message
      showToast(
        "success",
        isEditing
          ? isPublishing
            ? "Blog published successfully!"
            : "Blog updated successfully!"
          : "Blog created successfully!"
      );

      // Navigate after a delay and reset success state
      setTimeout(() => {
        setSubmitSuccess(false);
        const isResultDraft =
          result?.blog?.draft === true || result?.blog?.draft === "true";
        const roleBase = user?.role === "admin" ? "/admin" : "/author";
        if (isEditing) {
          if (isResultDraft) {
            navigate(`${roleBase}/my-blogs`);
          } else {
            const nextSlug =
              result.blog?.slug || existingBlog.slug || formData.slug;
            navigate(`/blog/${nextSlug}`);
          }
        } else {
          if (isResultDraft) {
            navigate(`${roleBase}/my-blogs`);
          } else {
            const createdSlug = result.blog?.slug || formData.slug;
            navigate(`/blog/${createdSlug}`);
          }
        }
      }, 1500);
    } catch (error) {
      console.error("Blog submission error:", error);
      setSubmitSuccess(false);

      // Better error message handling
      let errorMessage = isEditing
        ? "Failed to update blog"
        : "Failed to create blog";
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage = error.error;
      }

      showToast("error", errorMessage);
    }
  };

  const handleFileSelection = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const preview = URL.createObjectURL(selectedFile);
      setSelectedImage(preview);
      setIsCropping(true);
      setFile(selectedFile);
      // Clear previous cropped file when new file is selected
      setCroppedFile(null);
    }
  };

  // Convert blob URL to File object
  const blobToFile = async (blobUrl, fileName) => {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type });
  };

  const handleCropDone = async (croppedImageUrl) => {
    try {
      // Set preview to show cropped image
      setPreview(croppedImageUrl);

      // Convert the cropped image URL to a File object - keep original filename
      const fileName = file?.name || "blog-banner.jpg";
      const croppedFileObject = await blobToFile(croppedImageUrl, fileName);
      setCroppedFile(croppedFileObject);

      // Close the cropper
      setIsCropping(false);

      // Clean up the selected image URL
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
        setSelectedImage(null);
      }

      showToast("success", "Image cropped successfully!");
    } catch (error) {
      console.error("Error processing cropped image:", error);
      showToast("error", "Failed to process cropped image");
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    // Clean up URLs
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    }
    // Reset file states
    setFile(null);
  };

  const handleRemoveImage = () => {
    if (filePreview && filePreview.startsWith("blob:")) {
      URL.revokeObjectURL(filePreview);
    }
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
    }
    setFile(null);
    setCroppedFile(null);
    setPreview(null);
    showToast("success", "Image removed successfully!");
  };

  // Clean up URLs on component unmount
  useEffect(() => {
    return () => {
      if (filePreview && filePreview.startsWith("blob:")) {
        URL.revokeObjectURL(filePreview);
      }
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [filePreview, selectedImage]);

  // Derived UI state for labels
  const wasDraft = Boolean(existingBlog?.draft);
  const isPublishing = Boolean(
    isEditing && wasDraft && formData.draft === false
  );
  const isSavingDraft = Boolean(formData.draft === true);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-center">
        {isEditing ? "Edit Blog" : "Add Blog"}
      </h1>
      <Card className="pt-5">
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
                disabled={isEditing ? updateLoading : createLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {loadingCategories ? (
                    <SelectItem disabled value="loading">
                      Loading categories...
                    </SelectItem>
                  ) : categoryData && categoryData.length > 0 ? (
                    categoryData.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem disabled value="no-categories">
                      No categories available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {formErrors.category && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.category}
                </p>
              )}
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter blog title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                disabled={isEditing ? updateLoading : createLoading}
              />
              {formErrors.title && (
                <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
              )}
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">
                Slug <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Slug"
                value={formData.slug}
                onChange={(e) => handleInputChange("slug", e.target.value)}
                disabled={
                  (isEditing ? updateLoading : createLoading) ||
                  (isEditing && user?.role !== "admin")
                }
              />
              {formErrors.slug && (
                <p className="text-red-500 text-sm mt-1">{formErrors.slug}</p>
              )}
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">
                Excerpt (Optional)
              </label>
              <Input
                placeholder="Brief description of the blog post"
                value={formData.excerpt}
                onChange={(e) => handleInputChange("excerpt", e.target.value)}
                disabled={isEditing ? updateLoading : createLoading}
              />
              <div className="flex justify-between items-center mt-1">
                <span
                  className={`text-sm ${
                    formData.excerpt.length > 180
                      ? "text-orange-500"
                      : formData.excerpt.length === 200
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  {formData.excerpt.length}/200 characters
                </span>
                {formData.excerpt.length >= 200 && (
                  <span className="text-red-500 text-sm">
                    Character limit reached
                  </span>
                )}
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">
                Tags (Optional)
              </label>
              <Input
                placeholder="Enter tags separated by commas (e.g., react, javascript, web)"
                value={formData.tags}
                onChange={(e) => handleInputChange("tags", e.target.value)}
                disabled={isEditing ? updateLoading : createLoading}
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">
                Featured Image (Optional)
              </label>
              <div
                className={`group cursor-pointer relative w-36 h-28 border-2 border-dashed rounded flex justify-center items-center ${
                  (isEditing ? updateLoading : createLoading)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                } border-gray-300`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelection}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isEditing ? updateLoading : createLoading}
                />
                {filePreview ? (
                  <>
                    <img
                      src={filePreview}
                      className="w-full h-full object-cover rounded"
                      alt="Preview"
                    />
                    {!(isEditing ? updateLoading : createLoading) && (
                      <div className="absolute inset-0 bg-black/30 rounded hidden group-hover:flex justify-center items-center">
                        <IoCameraOutline className="text-white text-xl" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <IoCameraOutline className="text-2xl mb-1" />
                    <span className="text-xs">
                      {(isEditing ? updateLoading : createLoading)
                        ? "Disabled"
                        : "Add Image (Optional)"}
                    </span>
                  </div>
                )}
              </div>
              {filePreview && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 cursor-pointer"
                  disabled={isEditing ? updateLoading : createLoading}
                >
                  Remove Image
                </button>
              )}
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">
                Blog Content{" "}
                {!formData.draft && <span className="text-red-500">*</span>}
              </label>
              <BlogEditor
                value={formData.content}
                onChange={(value) => handleInputChange("content", value)}
                disabled={isEditing ? updateLoading : createLoading}
              />
              <div className="mt-1">
                <span className="text-sm text-gray-500">
                  {formData.content.replace(/<[^>]*>/g, "").length} characters
                </span>
              </div>
              {formErrors.content && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.content}
                </p>
              )}
            </div>

            {/* Draft Toggle */}
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="draft"
                checked={formData.draft}
                onChange={handleToggleDraft}
                disabled={isEditing ? updateLoading : createLoading}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded  cursor-pointer"
              />
              <label htmlFor="draft" className="text-sm text-gray-700">
                Save as Draft
              </label>
            </div>

            <LoadingButton
              type="submit"
              className="w-full"
              isLoading={isEditing ? updateLoading : createLoading}
              loadingText={
                submitSuccess
                  ? "Success! Redirecting..."
                  : isEditing
                  ? isPublishing
                    ? "Publishing Blog..."
                    : isSavingDraft
                    ? "Saving Draft..."
                    : "Updating Blog..."
                  : isSavingDraft
                  ? "Saving Draft..."
                  : "Creating Blog..."
              }
              disabled={
                (isEditing ? updateLoading : createLoading) || submitSuccess
              }
            >
              {submitSuccess
                ? "Success! Redirecting..."
                : isEditing
                ? isPublishing
                  ? "Publish Blog"
                  : isSavingDraft
                  ? "Save Draft"
                  : "Update Blog"
                : isSavingDraft
                ? "Save Draft"
                : "Create Blog"}
            </LoadingButton>
          </form>
        </CardContent>
      </Card>

      {/* Image Cropper Modal */}
      {isCropping && selectedImage && (
        <ImageCropper
          imageUrl={selectedImage}
          onClose={handleCropCancel}
          onCrop={handleCropDone}
        />
      )}
    </div>
  );
};

export default BlogForm;
