import React, { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import slugify from "slugify";
import { showToast } from "@/utils/showToast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BlogEditor from "./BlogEditor";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createBlog, updateBlog } from "./blogSlice";
import { fetchAllCategories } from "@/features/category/categoriesSlice";
import { useCategories } from "@/hooks/useRedux";
import LoadingButton from "@/components/common/LoadingButton";
import ImageCropper from "@/components/common/ImageCropper";
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

  // --- Auto-save constants ---
  const STORAGE_KEY = "blog-form-draft";
  const EXPIRY_HOURS = 12;
  const AUTO_SAVE_DELAY = 1000; // 1 second debounce
  const autoSaveTimerRef = useRef(null);
  const isRestoringRef = useRef(false); // Prevent auto-save during restore

  const defaultFormData = {
    category: "",
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    tags: "",
    draft: false,
    isFeatured: false,
  };

  const [formData, setFormData] = useState(defaultFormData);

  const [formErrors, setFormErrors] = useState({});

  // Image state
  const [filePreview, setPreview] = useState();
  const [file, setFile] = useState();
  const [croppedFile, setCroppedFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [imageRemoved, setImageRemoved] = useState(false); // Track if user removed existing banner

  // Reset Key to force component remounting
  const [resetKey, setResetKey] = useState(0);

  // --- Auto-save helpers ---
  const clearSavedFormData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const saveFormData = useCallback((data) => {
    if (isEditing) return;
    const hasContent = data.title || data.content || data.excerpt || data.tags || data.category;
    if (!hasContent) {
      clearSavedFormData();
      return;
    }
    const payload = {
      formData: data,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage errors
    }
  }, [isEditing, clearSavedFormData]);

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
        isFeatured: existingBlog.isFeatured || false,
      });

      if (existingBlog.banner) {
        setPreview(existingBlog.banner);
      }
    } else {
      // For new blogs, try to restore all form fields from localStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const { formData: savedData, timestamp } = JSON.parse(saved);
          const hoursSinceLastSave =
            (Date.now() - timestamp) / (1000 * 60 * 60);

          if (hoursSinceLastSave < EXPIRY_HOURS) {
            isRestoringRef.current = true;
            setFormData(savedData);
            showToast("success", "Draft form restored!");
            // Allow auto-save again after restore settles
            setTimeout(() => { isRestoringRef.current = false; }, 500);
          } else {
            // Auto-clear expired drafts
            clearSavedFormData();
          }
        }
      } catch {
        clearSavedFormData();
      }

      // Also migrate old content-only draft if it exists
      const oldContent = localStorage.getItem("blog-draft-content");
      if (oldContent) {
        localStorage.removeItem("blog-draft-content");
        localStorage.removeItem("blog-draft-content-timestamp");
      }
    }
  }, [existingBlog, clearSavedFormData]);

  // Auto-save form data on change (debounced)
  useEffect(() => {
    if (isEditing || isRestoringRef.current) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveFormData(formData);
    }, AUTO_SAVE_DELAY);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData, isEditing, saveFormData]);

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
    if (name === "excerpt" && value.length > 500) {
      value = value.substring(0, 500);
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
    } else if (formData.title.trim().length > 200) {
      errors.title = "Title must be less than 200 characters long";
    }

    if (!formData.slug.trim()) {
      errors.slug = "Slug is required";
    } else if (formData.slug.trim().length < 3) {
      errors.slug = "Slug must be at least 3 characters long";
    }

    if (formData.excerpt.trim().length > 500) {
      errors.excerpt = "Excerpt must be less than 500 characters long";
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
        isFeatured: formData.isFeatured,
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

      // Handle banner image
      const fileToUpload = croppedFile || file;
      if (fileToUpload) {
        // New image uploaded
        submitData.banner = fileToUpload;
      } else if (isEditing && imageRemoved) {
        // User explicitly removed existing banner - send empty string to delete it
        submitData.removeBanner = true;
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
        setFormData(defaultFormData);
        clearSavedFormData();
        setResetKey((prev) => prev + 1); // Force remount of editors to clear internal state/timers
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
      return; // Stop execution on error
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
    setImageRemoved(true); // Mark that image was intentionally removed
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
    <div className="p-2 sm:p-4 md:p-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h1 className="text-2xl md:text-2xl font-bold">
            {isEditing ? "Edit Blog" : "Create Blog"}
          </h1>
        </div>
      </div>
      <Card className="w-full">
        <CardContent className="p-3 sm:p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">
                Category <span className="text-destructive">*</span>
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
                <p className="text-destructive text-sm mt-1">
                  {formErrors.category}
                </p>
              )}
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Enter blog title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                disabled={isEditing ? updateLoading : createLoading}
              />
              {formErrors.title && (
                <p className="text-destructive text-sm mt-1">
                  {formErrors.title}
                </p>
              )}
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">
                Slug <span className="text-destructive">*</span>
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
                <p className="text-destructive text-sm mt-1">
                  {formErrors.slug}
                </p>
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
                    formData.excerpt.length > 450
                      ? "text-warning"
                      : formData.excerpt.length === 500
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {formData.excerpt.length}/500 characters
                </span>
                {formData.excerpt.length >= 500 && (
                  <span className="text-destructive text-sm">
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
                } border-border`}
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
                      <div className="absolute inset-0 bg-foreground/30 rounded hidden group-hover:flex justify-center items-center">
                        <IoCameraOutline className="text-background text-xl" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
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
                  className="mt-2 text-sm text-destructive hover:text-destructive/90 cursor-pointer"
                  disabled={isEditing ? updateLoading : createLoading}
                >
                  Remove Image
                </button>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Blog Content{" "}
                {!formData.draft && <span className="text-destructive">*</span>}
              </label>
              <BlogEditor
                key={`editor-${resetKey}`}
                value={formData.content}
                onChange={(value) => handleInputChange("content", value)}
                disabled={isEditing ? updateLoading : createLoading}
              />
              <div className="mt-1">
                <span className="text-sm text-muted-foreground">
                  {formData.content.replace(/<[^>]*>/g, "").length} characters
                </span>
              </div>
              {formErrors.content && (
                <p className="text-destructive text-sm mt-1">
                  {formErrors.content}
                </p>
              )}
            </div>
            


            {/* Draft Toggle */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="draft"
                    checked={formData.draft}
                    onChange={handleToggleDraft}
                    disabled={isEditing ? updateLoading : createLoading}
                    className="mr-2 h-4 w-4 text-primary focus:ring-primary border-input rounded cursor-pointer"
                  />
                  <label htmlFor="draft" className="text-sm text-foreground">
                    Save as Draft
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onChange={() => setFormData(prev => ({ ...prev, isFeatured: !prev.isFeatured }))}
                    disabled={isEditing ? updateLoading : createLoading}
                    className="mr-2 h-4 w-4 text-primary focus:ring-primary border-input rounded cursor-pointer"
                  />
                  <label htmlFor="isFeatured" className="text-sm text-foreground">
                    Feature Post
                  </label>
                </div>
              </div>

              {!isEditing && (
                <button
                  type="button"
                  onClick={() => {
                      setFormData(defaultFormData);
                      setResetKey((prev) => prev + 1); // Force remount of editors
                      setFormErrors({});
                      setFile(null);
                      setCroppedFile(null);
                      setPreview(null);
                      setSelectedImage(null);
                      clearSavedFormData();
                      showToast("success", "Form cleared successfully!");
                  }}
                  className="text-sm text-destructive hover:underline cursor-pointer"
                  disabled={
                    (isEditing ? updateLoading : createLoading) || submitSuccess
                  }
                >
                  Clear Form
                </button>
              )}
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
