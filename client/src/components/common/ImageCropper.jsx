import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import Slider from "@mui/material/Slider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
    { label: "Free", value: null },
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
    <Dialog open={true} onOpenChange={handleClose}>
      <div className="fixed inset-0 z-[150] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogContent
        className="max-w-4xl w-[92vw] sm:w-[90vw] max-h-[85vh] overflow-y-auto p-0 gap-0 z-[150] flex flex-col"
        showCloseButton={false}
      >
        <DialogHeader className="px-3 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5 border-b relative">
          <DialogTitle className="text-sm sm:text-base md:text-lg pr-8 sm:pr-10">
            Crop Image
          </DialogTitle>
          <DialogDescription className="sr-only">
            Adjust the crop area, zoom level, and aspect ratio for your image
          </DialogDescription>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="absolute top-1 right-1.5 sm:top-2 sm:right-3 md:top-2.5 md:right-3.5 p-1.5 rounded-sm opacity-70 hover:opacity-100 transition-opacity disabled:pointer-events-none cursor-pointer"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="sm:w-5 sm:h-5"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </DialogHeader>

        <div className="px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-3 space-y-2 sm:space-y-3 flex-1 overflow-y-auto">
          {/* Cropper Container */}
          <div className="relative w-full h-72 sm:h-80 md:h-96 lg:h-[28rem] bg-muted rounded-md sm:rounded-lg overflow-hidden touch-none">
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
                className="text-[10px] sm:text-xs tabular-nums px-1.5 sm:px-2"
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
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5 sm:gap-2">
              {aspectOptions.map((option) => (
                <Button
                  key={option.label}
                  variant={aspect === option.value ? "default" : "outline"}
                  onClick={() => handleAspectChange(option.value)}
                  className="text-[9px] sm:text-[10px] md:text-xs h-5 sm:h-6 md:h-7 touch-manipulation px-0.5 sm:px-1 md:px-2 py-0.5 rounded-md"
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
              className="w-full sm:w-auto min-w-[100px] sm:min-w-[120px] md:min-w-[140px] h-7 sm:h-8 md:h-9 text-[11px] sm:text-xs md:text-sm touch-manipulation py-0.5"
            >
              {isProcessing ? "Processing..." : "Crop & Apply"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropper;
