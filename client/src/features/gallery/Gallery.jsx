import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import {
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Upload,
  FileImage,
  Trash2,
  X,
  Calendar,
  Tag,
  User,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useGallery } from "../../hooks/useRedux";
import {
  fetchGalleryImages,
  uploadGalleryImage,
  deleteGalleryImage,
  getImageLink,
  fetchGalleryStats,
  setFilters,
  resetFilters,
  clearSelection,
  toggleImageSelection,
  selectAllImages,
  setUploadModalOpen,
  setLinkModalOpen,
} from "./gallerySlice";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Pagination from "../../components/common/Pagination";
import GalleryCard from "./GalleryCard";
import GalleryUploadModal from "./GalleryUploadModal";
import GalleryLinkModal from "./GalleryLinkModal";
import { showToast } from "../../utils/showToast";

const Gallery = () => {
  const { user, isAuthenticated } = useAuth();
  const {
    images,
    imagesLoading,
    imagesError,
    pagination,
    filters,
    uploadLoading,
    uploadModalOpen,
    linkModalOpen,
    linkModalImage,
    selectedImages,
    stats,
    dispatch,
  } = useGallery();

  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);

  const imagesPerPage = 20;

  // Check permissions
  const canUpload =
    isAuthenticated && (user?.role === "admin" || user?.role === "author");
  const isAdmin = user?.role === "admin";

  const canModifyImage = useCallback(
    (image) => {
      if (!isAuthenticated || !user) return false;
      if (isAdmin) return true;
      return image.uploadedBy._id === user._id;
    },
    [isAuthenticated, user, isAdmin]
  );

  // Fetch images on component mount and when filters change
  useEffect(() => {
    const params = {
      page: currentPage,
      limit: imagesPerPage,
      ...filters,
    };

    // Remove empty filters
    Object.keys(params).forEach((key) => {
      if (params[key] === "" || params[key] === "all") {
        delete params[key];
      }
    });

    dispatch(fetchGalleryImages(params));
  }, [dispatch, currentPage, filters]);

  // Fetch stats on mount
  useEffect(() => {
    if (canUpload) {
      dispatch(fetchGalleryStats());
    }
  }, [dispatch, canUpload]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleFilterChange = useCallback(
    (field, value) => {
      dispatch(setFilters({ [field]: value }));
    },
    [dispatch]
  );

  const handleSearchChange = useCallback(
    (value) => {
      dispatch(setFilters({ search: value }));
    },
    [dispatch]
  );

  const handleClearFilters = useCallback(() => {
    dispatch(resetFilters());
    setCurrentPage(1);
  }, [dispatch]);

  const handleUpload = useCallback(
    async (formData) => {
      try {
        await dispatch(uploadGalleryImage(formData)).unwrap();
        showToast("success", "Image uploaded successfully!");
        // Refresh images
        const params = {
          page: 1,
          limit: imagesPerPage,
          ...filters,
        };
        dispatch(fetchGalleryImages(params));
        setCurrentPage(1);
      } catch (error) {
        console.error("Upload failed:", error);
        throw error;
      }
    },
    [dispatch, filters]
  );

  const handleGetLink = useCallback(
    async (imageId, options = {}) => {
      try {
        const result = await dispatch(
          getImageLink({ id: imageId, options })
        ).unwrap();
        const image = images.find((img) => img._id === imageId);
        if (image) {
          dispatch(setLinkModalOpen({ open: true, image }));
        }
        return result;
      } catch (error) {
        console.error("Failed to get link:", error);
        showToast("error", "Failed to get image link");
        throw error;
      }
    },
    [dispatch, images]
  );

  const handleDelete = useCallback(
    async (imageId, imageTitle) => {
      if (
        window.confirm(
          `Are you sure you want to delete "${imageTitle}"? This action cannot be undone.`
        )
      ) {
        try {
          await dispatch(deleteGalleryImage(imageId)).unwrap();
          showToast("success", "Image deleted successfully!");
        } catch (error) {
          console.error("Delete failed:", error);
          showToast("error", error.message || "Failed to delete image");
        }
      }
    },
    [dispatch]
  );

  const handleSelectImage = useCallback(
    (imageId) => {
      dispatch(toggleImageSelection(imageId));
    },
    [dispatch]
  );

  const handleSelectAll = useCallback(() => {
    if (selectedImages.length === images.length) {
      dispatch(clearSelection());
    } else {
      dispatch(selectAllImages());
    }
  }, [dispatch, selectedImages.length, images.length]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedImages.length === 0) return;

    const confirmMessage = `Are you sure you want to delete ${selectedImages.length} selected image(s)? This action cannot be undone.`;
    if (window.confirm(confirmMessage)) {
      try {
        await Promise.all(
          selectedImages.map((imageId) =>
            dispatch(deleteGalleryImage(imageId)).unwrap()
          )
        );
        showToast(
          "success",
          `${selectedImages.length} images deleted successfully!`
        );
        dispatch(clearSelection());
      } catch (error) {
        console.error("Bulk delete failed:", error);
        showToast("error", "Some images failed to delete");
      }
    }
  }, [dispatch, selectedImages]);

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "blog", label: "Blog" },
    { value: "profile", label: "Profile" },
    { value: "banner", label: "Banner" },
    { value: "thumbnail", label: "Thumbnail" },
    { value: "general", label: "General" },
  ];

  const sortOptions = [
    { value: "createdAt", label: "Date Created" },
    { value: "title", label: "Title" },
    { value: "usage", label: "Usage Count" },
    { value: "fileSize", label: "File Size" },
  ];

  const totalImages = pagination?.totalCount || images.length;
  const totalPages = Math.ceil(totalImages / imagesPerPage);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search ||
      filters.category !== "all" ||
      filters.tags ||
      filters.uploadedBy ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.sortBy !== "createdAt" ||
      filters.sortOrder !== "desc"
    );
  }, [filters]);

  if (!canUpload) {
    return (
      <div className="p-6 text-center">
        <FileImage className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Gallery Access Required</h2>
        <p className="text-muted-foreground">
          You need author or admin privileges to access the gallery.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileImage className="h-6 w-6" />
              Image Gallery
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span>{totalImages} images</span>
              {stats && (
                <>
                  <span>•</span>
                  <span>
                    {(stats.overall?.totalSize / 1024 / 1024).toFixed(1)} MB
                    used
                  </span>
                  <span>•</span>
                  <span>{stats.overall?.totalUsage || 0} total uses</span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  Active
                </Badge>
              )}
            </Button>
            <Button
              onClick={() => dispatch(setUploadModalOpen(true))}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Upload Image
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileImage className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Images
                    </p>
                    <p className="text-lg font-semibold">
                      {stats.overall?.totalImages || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Uses</p>
                    <p className="text-lg font-semibold">
                      {stats.overall?.totalUsage || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Storage Used
                    </p>
                    <p className="text-lg font-semibold">
                      {(stats.overall?.totalSize / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Categories</p>
                    <p className="text-lg font-semibold">
                      {stats.byCategory?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search images..."
                      value={filters.search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) =>
                      handleFilterChange("category", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) =>
                      handleFilterChange("sortBy", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Order</label>
                  <Select
                    value={filters.sortOrder}
                    onValueChange={(value) =>
                      handleFilterChange("sortOrder", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags</label>
                  <Input
                    placeholder="Enter tags separated by commas"
                    value={filters.tags}
                    onChange={(e) => handleFilterChange("tags", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date From</label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      handleFilterChange("dateFrom", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date To</label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) =>
                      handleFilterChange("dateTo", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Actions */}
      {selectedImages.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedImages.length} image(s) selected
                </span>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedImages.length === images.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => dispatch(clearSelection())}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Selection
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Mode Toggle */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Showing {images.length} of {totalImages} images
        </div>
        <div className="flex gap-1">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {imagesLoading && (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {imagesError && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileImage className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-destructive mb-4">
              Error loading images: {imagesError}
            </p>
            <Button
              onClick={() =>
                dispatch(
                  fetchGalleryImages({
                    page: currentPage,
                    limit: imagesPerPage,
                  })
                )
              }
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!imagesLoading && !imagesError && images.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileImage className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No images found</h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters
                ? "No images match your current filters. Try adjusting your search criteria."
                : "Get started by uploading your first image to the gallery."}
            </p>
            {hasActiveFilters ? (
              <Button onClick={handleClearFilters} variant="outline">
                Clear Filters
              </Button>
            ) : (
              <Button onClick={() => dispatch(setUploadModalOpen(true))}>
                <Plus className="h-4 w-4 mr-2" />
                Upload First Image
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Images Grid */}
      {!imagesLoading && !imagesError && images.length > 0 && (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "space-y-4"
          }
        >
          {images.map((image) => (
            <GalleryCard
              key={image._id}
              image={image}
              variant={viewMode === "list" ? "compact" : "default"}
              onGetLink={handleGetLink}
              onDelete={handleDelete}
              onSelect={handleSelectImage}
              isSelected={selectedImages.includes(image._id)}
              canModify={canModifyImage(image)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalBlogs={totalImages}
          paginationThreshold={9}
        />
      )}

      {/* Upload Modal */}
      <GalleryUploadModal
        open={uploadModalOpen}
        onClose={() => dispatch(setUploadModalOpen(false))}
        onUpload={handleUpload}
        uploading={uploadLoading}
      />

      {/* Link Modal */}
      <GalleryLinkModal
        open={linkModalOpen}
        onClose={() => dispatch(setLinkModalOpen({ open: false }))}
        image={linkModalImage}
        onGetLink={handleGetLink}
      />
    </div>
  );
};

export default Gallery;
