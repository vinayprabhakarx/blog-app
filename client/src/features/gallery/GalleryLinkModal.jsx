import React, { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Copy,
  Check,
  Download,
  Image as ImageIcon,
  Code,
  FileText,
  Crop,
} from "lucide-react";
import { showToast } from "../../utils/showToast";

const GalleryLinkModal = ({ open, onClose, image, onGetLink }) => {
  const [copiedField, setCopiedField] = useState(null);
  const [transformOptions, setTransformOptions] = useState({
    width: "",
    height: "",
    quality: "auto",
    format: "auto",
  });
  const [linkData, setLinkData] = useState(null);
  const [activeTab, setActiveTab] = useState("original");

  const qualityOptions = [
    { value: "auto", label: "Auto" },
    { value: "auto:best", label: "Best" },
    { value: "auto:good", label: "Good" },
    { value: "auto:eco", label: "Eco" },
    { value: "100", label: "100%" },
    { value: "80", label: "80%" },
    { value: "60", label: "60%" },
  ];

  const formatOptions = [
    { value: "auto", label: "Auto" },
    { value: "webp", label: "WebP" },
    { value: "jpg", label: "JPEG" },
    { value: "png", label: "PNG" },
  ];

  const aspectRatios = [
    { label: "Original", width: "", height: "" },
    { label: "1:1 Square", width: "400", height: "400" },
    { label: "16:9 Wide", width: "640", height: "360" },
    { label: "4:3 Standard", width: "640", height: "480" },
    { label: "3:2 Photo", width: "600", height: "400" },
    { label: "9:16 Portrait", width: "360", height: "640" },
  ];

  // Fetch link data when transform options change
  useEffect(() => {
    if (image && open) {
      const options = {};
      if (transformOptions.width) options.width = transformOptions.width;
      if (transformOptions.height) options.height = transformOptions.height;
      if (transformOptions.quality !== "auto")
        options.quality = transformOptions.quality;
      if (transformOptions.format !== "auto")
        options.format = transformOptions.format;

      onGetLink(image._id, options)
        .then((result) => {
          if (result) {
            setLinkData(result.data || result);
          }
        })
        .catch((error) => {
          console.error("Failed to get link:", error);
          showToast("error", "Failed to generate link");
        });
    }
  }, [image, transformOptions, open, onGetLink]);

  const handleCopy = useCallback(async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      showToast("success", "Copied to clipboard!");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      showToast("error", "Failed to copy to clipboard");
    }
  }, []);

  const handleTransformOptionChange = useCallback((field, value) => {
    setTransformOptions((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleAspectRatioSelect = useCallback((ratio) => {
    setTransformOptions((prev) => ({
      ...prev,
      width: ratio.width,
      height: ratio.height,
    }));
  }, []);

  const handleClose = useCallback(() => {
    setLinkData(null);
    setCopiedField(null);
    setTransformOptions({
      width: "",
      height: "",
      quality: "auto",
      format: "auto",
    });
    setActiveTab("original");
    onClose();
  }, [onClose]);

  const handleDownload = useCallback(() => {
    if (linkData?.transformedUrl || linkData?.originalUrl) {
      const url = linkData.transformedUrl || linkData.originalUrl;
      const link = document.createElement("a");
      link.href = url;
      link.download = image?.title || "image";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [linkData, image?.title]);

  if (!image) return null;

  const originalUrl = image.imageUrl;
  const transformedUrl = linkData?.transformedUrl || originalUrl;
  const markdownCode =
    linkData?.markdownCode || `![${image.title}](${originalUrl})`;
  const htmlCode =
    linkData?.htmlCode || `<img src="${originalUrl}" alt="${image.title}" />`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Image Links & Code - {image.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Preview */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <img
                  src={transformedUrl}
                  alt={image.title}
                  className="w-32 h-32 object-cover rounded-lg border"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-2">{image.title}</h3>
                  {image.description && (
                    <p className="text-muted-foreground text-sm mb-2">
                      {image.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="secondary">{image.category}</Badge>
                    <Badge variant="outline">
                      {image.format?.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      {image.dimensions.width} × {image.dimensions.height}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Used {image.usage || 0} times
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transform Options */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Crop className="h-4 w-4" />
                Transform Options
              </h4>

              <div className="space-y-4">
                {/* Aspect Ratio Presets */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Aspect Ratio Presets
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {aspectRatios.map((ratio, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAspectRatioSelect(ratio)}
                        className="text-xs"
                      >
                        {ratio.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="width">Width (px)</Label>
                    <Input
                      id="width"
                      type="number"
                      placeholder="Auto"
                      value={transformOptions.width}
                      onChange={(e) =>
                        handleTransformOptionChange("width", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (px)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="Auto"
                      value={transformOptions.height}
                      onChange={(e) =>
                        handleTransformOptionChange("height", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quality</Label>
                    <Select
                      value={transformOptions.quality}
                      onValueChange={(value) =>
                        handleTransformOptionChange("quality", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {qualityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select
                      value={transformOptions.format}
                      onValueChange={(value) =>
                        handleTransformOptionChange("format", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {formatOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Links and Code */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="original">Original</TabsTrigger>
              <TabsTrigger value="markdown">Markdown</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
            </TabsList>

            <TabsContent value="original" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Image URL
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={transformedUrl}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleCopy(transformedUrl, "url")}
                          className="flex items-center gap-1 flex-shrink-0"
                        >
                          {copiedField === "url" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="markdown" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Markdown Code
                      </Label>
                      <div className="space-y-2">
                        <Textarea
                          value={markdownCode}
                          readOnly
                          className="font-mono text-sm"
                          rows={3}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleCopy(markdownCode, "markdown")}
                          className="flex items-center gap-1"
                        >
                          {copiedField === "markdown" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          Copy Markdown
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="html" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        HTML Code
                      </Label>
                      <div className="space-y-2">
                        <Textarea
                          value={htmlCode}
                          readOnly
                          className="font-mono text-sm"
                          rows={3}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleCopy(htmlCode, "html")}
                          className="flex items-center gap-1"
                        >
                          {copiedField === "html" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          Copy HTML
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-between gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Image
            </Button>
            <Button onClick={handleClose}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GalleryLinkModal;
