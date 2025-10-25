import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Upload, X, FileImage, Crop, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { showToast } from "../../utils/showToast";
import ImageCropper from "../../components/common/ImageCropper";

const GalleryUploadModal = ({ open, onClose, onUpload, uploading = false }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: "",
    category: "general",
  });

  const categories = [
    { value: "blog", label: "Blog" },
    { value: "profile", label: "Profile" },
    { value: "banner", label: "Banner" },
    { value: "thumbnail", label: "Thumbnail" },
    { value: "general", label: "General" },
  ];

  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          showToast("error", "Please select an image file");
          return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          showToast("error", "Image size must be less than 5MB");
          return;
        }

        setSelectedFile(file);

        // Create preview URL
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);

        // Auto-fill title from filename
        if (!formData.title) {
          const fileName = file.name.replace(/\.[^/.]+$/, "");
          setFormData((prev) => ({
            ...prev,
            title: fileName.charAt(0).toUpperCase() + fileName.slice(1),
          }));
        }
      }
    },
    [formData.title]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"],
    },
    multiple: false,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCroppedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  const handleCrop = useCallback(() => {
    if (previewUrl) {
      setShowCropper(true);
    }
  }, [previewUrl]);

  const handleCropComplete = useCallback((croppedImageUrl) => {
    setCroppedImage(croppedImageUrl);
    setShowCropper(false);
    showToast("success", "Image cropped successfully");
  }, []);

  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
  }, []);

  const handleClose = useCallback(() => {
    if (!uploading) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setCroppedImage(null);
      setShowCropper(false);
      setFormData({
        title: "",
        description: "",
        tags: "",
        category: "general",
      });
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      onClose();
    }
  }, [uploading, previewUrl, onClose]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!selectedFile) {
        showToast("error", "Please select an image");
        return;
      }

      if (!formData.title.trim()) {
        showToast("error", "Please enter a title");
        return;
      }

      try {
        // Create FormData
        const uploadData = new FormData();

        // If we have a cropped image, convert it to a file
        if (croppedImage) {
          const response = await fetch(croppedImage);
          const blob = await response.blob();
          const file = new File([blob], selectedFile.name, {
            type: selectedFile.type,
          });
          uploadData.append("image", file);
        } else {
          uploadData.append("image", selectedFile);
        }

        uploadData.append("title", formData.title.trim());
        uploadData.append("description", formData.description.trim());
        uploadData.append("category", formData.category);

        if (formData.tags.trim()) {
          uploadData.append("tags", formData.tags.trim());
        }

        await onUpload(uploadData);

        // Reset form
        handleClose();
      } catch (error) {
        console.error("Upload error:", error);
        showToast("error", error.message || "Failed to upload image");
      }
    },
    [selectedFile, croppedImage, formData, onUpload, handleClose]
  );

  const displayTags = formData.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Image to Gallery
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Area */}
            <div className="space-y-4">
              {!selectedFile ? (
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    "hover:border-primary/50 hover:bg-muted/50",
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-muted">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-lg font-medium">
                        {isDragActive ? "Drop image here" : "Upload an image"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Drag & drop or click to select • Max 5MB • JPG, PNG,
                        WebP, GIF
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <img
                          src={croppedImage || previewUrl}
                          alt="Preview"
                          className="w-24 h-24 object-cover rounded-lg border"
                        />
                        {croppedImage && (
                          <Badge className="absolute -top-2 -right-2 text-xs">
                            Cropped
                          </Badge>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">
                          {selectedFile.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCrop}
                            className="flex items-center gap-1"
                          >
                            <Crop className="h-3 w-3" />
                            {croppedImage ? "Re-crop" : "Crop"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveFile}
                            className="flex items-center gap-1"
                          >
                            <X className="h-3 w-3" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Form Fields */}
            {selectedFile && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter image title"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        handleInputChange("category", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter image description (optional)"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    placeholder="Enter tags separated by commas"
                    value={formData.tags}
                    onChange={(e) => handleInputChange("tags", e.target.value)}
                  />
                  {displayTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {displayTags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedFile || !formData.title.trim() || uploading}
                className="flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload Image
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Cropper Modal */}
      {showCropper && previewUrl && (
        <ImageCropper
          imageUrl={previewUrl}
          onClose={handleCropCancel}
          onCrop={handleCropComplete}
        />
      )}
    </>
  );
};

export default GalleryUploadModal;
