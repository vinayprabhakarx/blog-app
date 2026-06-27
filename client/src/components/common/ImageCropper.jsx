import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import Slider from "@mui/material/Slider";
import { Button } from "@/components/ui/button";
import { CustomDialog } from "@/components/common/CustomDialog";
import { Badge } from "@/components/ui/badge";

const getCroppedImg = (imageSrc, pixelCrop) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"));
            return;
          }
          const fileUrl = URL.createObjectURL(blob);
          resolve(fileUrl);
        },
        "image/jpeg",
        0.95
      );
    };
    image.onerror = () => {
      reject(new Error("Failed to load image"));
    };
    image.src = imageSrc;
  });
};

const ImageCropper = ({ imageUrl, onClose, onCrop }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [aspect, setAspect] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const aspectOptions = [
    { label: "1:1", value: 1 },
    { label: "4:3", value: 4 / 3 },
    { label: "3:4", value: 3 / 4 },
    { label: "16:9", value: 16 / 9 },
  ];

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = useCallback(async () => {
    if (!croppedAreaPixels) {
      console.error("No crop area defined");
      return;
    }
    setIsProcessing(true);
    try {
      const croppedImageUrl = await getCroppedImg(imageUrl, croppedAreaPixels);
      onCrop(croppedImageUrl);
    } catch (error) {
      console.error("Cropping failed:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [croppedAreaPixels, imageUrl, onCrop]);

  const handleClose = useCallback(() => {
    if (!isProcessing) {
      onClose();
    }
  }, [isProcessing, onClose]);

  const handleAspectChange = useCallback((newAspect) => {
    setAspect(newAspect);
  }, []);

  return (
    <CustomDialog
      isOpen={true}
      onClose={handleClose}
      title="Crop Image"
      description="Adjust the crop area, zoom level, and aspect ratio for your image"
      maxWidth="48rem"
    >

        <div className="space-y-2 sm:space-y-3">
          {/* Cropper Container */}
          <div className="relative w-full h-64 sm:h-72 md:h-80 lg:h-96 bg-muted rounded-md sm:rounded-lg overflow-hidden touch-none">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspect || undefined}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid={true}
              cropShape="rect"
              objectFit="contain"
              zoomWithScroll={false}
              style={{
                containerStyle: {
                  width: "100%",
                  height: "100%",
                  position: "relative",
                },
              }}
            />
          </div>

          {/* Zoom Control */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-medium text-foreground">
                Zoom
              </label>
              <Badge
                variant="secondary"
                className="text-micro sm:text-xs tabular-nums px-1.5 sm:px-2"
              >
                {zoom.toFixed(1)}x
              </Badge>
            </div>
            <div className="px-0.5 sm:px-1">
              <Slider
                value={zoom}
                min={1}
                max={3}
                step={0.05}
                onChange={(e, newZoom) => setZoom(newZoom)}
                sx={{
                  color: "#3b82f6",
                  height: 5,
                  "& .MuiSlider-thumb": {
                    backgroundColor: "#3b82f6",
                    border: "2px solid #ffffff",
                    width: 16,
                    height: 16,
                    transition: "box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
                      boxShadow: "0 0 0 8px rgba(59, 130, 246, 0.16)",
                    },
                  },
                  "& .MuiSlider-track": {
                    backgroundColor: "#3b82f6",
                    border: "none",
                    height: 5,
                  },
                  "& .MuiSlider-rail": {
                    backgroundColor: "#e2e8f0",
                    height: 5,
                    opacity: 1,
                  },
                }}
              />
            </div>
          </div>

          {/* Aspect Ratio Selection */}
          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-medium text-foreground block">
              Aspect Ratio
            </label>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {aspectOptions.map((option) => (
                <Button
                  key={option.label}
                  variant={aspect === option.value ? "default" : "outline"}
                  onClick={() => handleAspectChange(option.value)}
                  className="text-tiny sm:text-micro md:text-xs h-5 sm:h-6 md:h-7 touch-manipulation px-0.5 sm:px-1 md:px-2 py-0.5 rounded-md"
                  type="button"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 sm:gap-3 pt-2 sm:pt-3 border-t">
            <Button
              onClick={handleCrop}
              disabled={isProcessing || !croppedAreaPixels}
              type="button"
              className="w-full sm:w-auto min-w-25 sm:min-w-30 md:min-w-35 h-7 sm:h-8 md:h-9 text-xs sm:text-xs md:text-sm touch-manipulation py-0.5"
            >
              {isProcessing ? "Processing..." : "Crop & Apply"}
            </Button>
          </div>
        </div>
      </CustomDialog>
  );
};

export default ImageCropper;
