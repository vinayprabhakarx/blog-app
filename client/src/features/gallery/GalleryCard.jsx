import React, { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Calendar,
  User,
  Eye,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Download,
  ExternalLink,
  Image as ImageIcon,
  FileImage,
} from "lucide-react";
import { formatDate } from "../../utils/formatDate";

const GalleryCard = React.memo(
  ({
    image,
    variant = "default",
    showAuthor = true,
    className,
    onEdit,
    onDelete,
    onGetLink,
    onSelect,
    isSelected,
    canModify,
    ...props
  }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Memoize utility functions
    const formatFileSize = useCallback((bytes) => {
      const sizes = ["Bytes", "KB", "MB", "GB"];
      if (bytes === 0) return "0 Byte";
      const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
      return (
        Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
      );
    }, []);

    const formatUsage = useCallback((usage) => {
      if (usage === 0) return "Never used";
      if (usage === 1) return "Used once";
      return `Used ${usage} times`;
    }, []);

    const formatDimensions = useCallback((dimensions) => {
      return `${dimensions.width} × ${dimensions.height}`;
    }, []);

    // Memoize computed values
    const imageId = useMemo(() => image?._id, [image?._id]);
    const imageTitle = useMemo(() => image?.title, [image?.title]);
    const imageUrl = useMemo(() => image?.imageUrl, [image?.imageUrl]);
    const imageDescription = useMemo(
      () => image?.description,
      [image?.description]
    );
    const imageCreatedAt = useMemo(() => image?.createdAt, [image?.createdAt]);
    const imageTags = useMemo(() => image?.tags || [], [image?.tags]);
    const imageCategory = useMemo(() => image?.category, [image?.category]);
    const imageUsage = useMemo(() => image?.usage || 0, [image?.usage]);
    const imageFileSize = useMemo(() => image?.fileSize, [image?.fileSize]);
    const imageDimensions = useMemo(
      () => image?.dimensions,
      [image?.dimensions]
    );
    const imageFormat = useMemo(
      () => image?.format?.toUpperCase(),
      [image?.format]
    );

    // Memoize author data
    const authorData = useMemo(
      () => ({
        avatar: image?.uploadedBy?.avatar || image?.uploadedBy?.profile_img,
        username:
          image?.uploadedBy?.username || image?.uploadedBy?.name || "Unknown",
        displayName:
          image?.uploadedBy?.name || image?.uploadedBy?.username || "Unknown",
      }),
      [image?.uploadedBy]
    );

    // Memoize computed display values
    const formattedDate = useMemo(
      () => formatDate(imageCreatedAt),
      [imageCreatedAt]
    );
    const formattedFileSize = useMemo(
      () => formatFileSize(imageFileSize),
      [formatFileSize, imageFileSize]
    );
    const formattedUsage = useMemo(
      () => formatUsage(imageUsage),
      [formatUsage, imageUsage]
    );
    const formattedDimensions = useMemo(
      () => formatDimensions(imageDimensions),
      [formatDimensions, imageDimensions]
    );

    // Memoize image variants
    const imageVariants = useMemo(
      () => ({
        default: "aspect-square",
        compact: "aspect-video",
        large: "aspect-[4/3]",
      }),
      []
    );

    // Memoize image error handler
    const handleImageError = useCallback(() => {
      setImageError(true);
      setImageLoaded(false);
    }, []);

    const handleImageLoad = useCallback(() => {
      setImageLoaded(true);
      setImageError(false);
    }, []);

    const handleCopyLink = useCallback(() => {
      if (onGetLink) {
        onGetLink(imageId);
      }
    }, [onGetLink, imageId]);

    const handleDownload = useCallback(() => {
      if (imageUrl) {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = imageTitle || "image";
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }, [imageUrl, imageTitle]);

    const handleOpenInNewTab = useCallback(() => {
      if (imageUrl) {
        window.open(imageUrl, "_blank");
      }
    }, [imageUrl]);

    const categoryColor = useMemo(() => {
      const colors = {
        blog: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        profile:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        banner:
          "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        thumbnail:
          "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
        general:
          "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      };
      return colors[imageCategory] || colors.general;
    }, [imageCategory]);

    return (
      <Card
        className={cn(
          "group transition-all duration-300 hover:shadow-lg",
          isSelected && "ring-2 ring-primary",
          className
        )}
        {...props}
      >
        <CardContent className="p-0">
          {/* Image Container */}
          <div
            className={cn(
              "relative overflow-hidden bg-muted rounded-t-lg border-b border-border/50",
              imageVariants[variant]
            )}
          >
            {!imageError ? (
              <img
                src={imageUrl}
                alt={imageTitle}
                className={cn(
                  "h-full w-full object-cover transition-all duration-300",
                  "group-hover:scale-105",
                  !imageLoaded && "opacity-0"
                )}
                loading="lazy"
                onError={handleImageError}
                onLoad={handleImageLoad}
                crossOrigin="anonymous"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-muted">
                <FileImage className="h-12 w-12 text-muted-foreground" />
              </div>
            )}

            {/* Loading overlay */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}

            {/* Selection overlay */}
            {onSelect && (
              <div
                className="absolute top-3 left-3 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(imageId);
                }}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded border-2 border-white bg-background/80 backdrop-blur-sm",
                    "flex items-center justify-center transition-all duration-200",
                    isSelected && "bg-primary border-primary"
                  )}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-primary-foreground"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
            )}

            {/* Actions overlay */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleCopyLink}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleOpenInNewTab}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in New Tab
                  </DropdownMenuItem>
                  {canModify && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit && onEdit(image)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          onDelete && onDelete(imageId, imageTitle)
                        }
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Category badge */}
            <div className="absolute bottom-3 left-3">
              <Badge className={cn("text-xs", categoryColor)}>
                {imageCategory}
              </Badge>
            </div>

            {/* Format badge */}
            <div className="absolute bottom-3 right-3">
              <Badge variant="secondary" className="text-xs">
                {imageFormat}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <h3 className="font-semibold text-foreground line-clamp-2 text-lg">
              {imageTitle}
            </h3>

            {/* Description */}
            {imageDescription && (
              <p className="text-muted-foreground text-sm line-clamp-2">
                {imageDescription}
              </p>
            )}

            {/* Tags */}
            {imageTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {imageTags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {imageTags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{imageTags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Author and Date */}
            {showAuthor && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={authorData.avatar} />
                    <AvatarFallback>
                      <User className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{authorData.displayName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formattedDate}</span>
                </div>
              </div>
            )}

            {/* Image Info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>{formattedDimensions}</span>
                <span>{formattedFileSize}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{formattedUsage}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

GalleryCard.displayName = "GalleryCard";

export default GalleryCard;
