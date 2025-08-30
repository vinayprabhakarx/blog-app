import React, { useState } from "react";
import Cropper from "react-easy-crop";
import Slider from "@mui/material/Slider";
import { Button } from "../../components/ui/button";

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
    { label: "16:8", value: 16 / 8 },
    { label: "9:16", value: 9 / 16 },
    { label: "2:3", value: 2 / 3 },
    { label: "3:2", value: 3 / 2 },
    { label: "Free", value: null },
  ];

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCrop = async () => {
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
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4">
      <div className="bg-card text-card-foreground w-full max-w-md p-4 rounded-lg shadow-lg border relative z-[201]">
        <div className="relative w-full h-64 bg-muted rounded-md overflow-hidden">
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
          />
        </div>
        <div className="mt-4">
          <label className="block mb-2 text-sm font-medium text-muted-foreground">
            Zoom: {zoom.toFixed(1)}x
          </label>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(e, newZoom) => setZoom(newZoom)}
            className="w-full"
          />
        </div>
        <div className="mt-4">
          <label className="block mb-2 text-sm font-medium text-muted-foreground">
            Aspect Ratio
          </label>
          <div className="grid grid-cols-4 gap-2">
            {aspectOptions.map((option) => (
              <Button
                key={option.label}
                size="sm"
                variant={aspect === option.value ? "default" : "outline"}
                onClick={() => setAspect(option.value)}
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex justify-between mt-6 gap-2">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCrop}
            disabled={isProcessing || !croppedAreaPixels}
          >
            {isProcessing ? "Processing..." : "Crop & Use"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
