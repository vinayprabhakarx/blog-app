import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import {
  Eye,
  EyeOff,
  Type,
  Maximize,
  Minimize,
  Bold,
  Italic,
  Strikethrough,
  Link,
  Image,
  List,
  ListOrdered,
  Quote,
  Code,
  Code2,
  Table,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Trash2,
} from "lucide-react";
import VirtualizedMdPreview from "./VirtualizedMdPreview";

// ... (other imports)

// ... inside component ...


import { useTheme } from "../../utils/ThemeContext";
import ImageCropper from "../../components/common/ImageCropper";
import { showToast } from "../../utils/showToast";
const ToolButton = React.memo(({ onClick, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded hover:bg-opacity-80 transition-colors cursor-pointer"
    style={{
      backgroundColor: "var(--muted)",
      color: "var(--foreground)",
    }}
    title={title}
  >
    {children}
  </button>
));

const BlogEditor = ({
  value = "",
  onChange,
  height = 500,
  placeholder = "Write your blog content using Markdown...",
  className = "",
  autoSaveKey = "blog-draft-content", // Unique key for localStorage
}) => {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState("split");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const textareaRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  // Auto-save content to localStorage with debouncing
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      if (value && value.trim()) {
        localStorage.setItem(autoSaveKey, value);
        localStorage.setItem(`${autoSaveKey}-timestamp`, Date.now().toString());
      }
    }, 1000); // Save after 1 second of inactivity

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [value, autoSaveKey]);

  const handleChange = useCallback(
    (e) => {
      if (onChange) {
        onChange(e.target.value);
      }
    },
    [onChange]
  );

  // Insert text at cursor position with proper cursor placement
  const insertAtCursor = useCallback(
    (before, after = "", placeholder = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const textToInsert = selectedText || placeholder;

      const newValue =
        value.substring(0, start) +
        before +
        textToInsert +
        after +
        value.substring(end);

      if (onChange) {
        onChange(newValue);
      }

      // Set cursor position after insertion
      setTimeout(() => {
        const newPosition = start + before.length + textToInsert.length;
        textarea.setSelectionRange(newPosition, newPosition);
        textarea.focus();
      }, 0);
    },
    [value, onChange]
  );

  // Formatting functions (memoized)
  const formatBold = useCallback(
    () => insertAtCursor("**", "**", "bold text"),
    [insertAtCursor]
  );
  const formatItalic = useCallback(
    () => insertAtCursor("*", "*", "italic text"),
    [insertAtCursor]
  );
  const formatStrikethrough = useCallback(
    () => insertAtCursor("~~", "~~", "strikethrough text"),
    [insertAtCursor]
  );
  const formatInlineCode = useCallback(
    () => insertAtCursor("`", "`", "code"),
    [insertAtCursor]
  );
  const formatH1 = useCallback(
    () => insertAtCursor("# ", "", "Heading 1"),
    [insertAtCursor]
  );
  const formatH2 = useCallback(
    () => insertAtCursor("## ", "", "Heading 2"),
    [insertAtCursor]
  );
  const formatH3 = useCallback(
    () => insertAtCursor("### ", "", "Heading 3"),
    [insertAtCursor]
  );
  const formatQuote = useCallback(
    () => insertAtCursor("> ", "", "Quote text"),
    [insertAtCursor]
  );
  const formatUnorderedList = useCallback(
    () => insertAtCursor("- ", "", "List item"),
    [insertAtCursor]
  );
  const formatOrderedList = useCallback(
    () => insertAtCursor("1. ", "", "List item"),
    [insertAtCursor]
  );
  const formatHorizontalRule = useCallback(
    () => insertAtCursor("\n---\n", "", ""),
    [insertAtCursor]
  );

  const formatLink = useCallback(() => {
    const url = prompt("Enter URL:");
    if (url) {
      insertAtCursor("[", `](${url})`, "link text");
    }
  }, [insertAtCursor]);

  const formatImage = () => {
    // Create a file input element
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Show cropper
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImageForCrop(reader.result);
        setSelectedFile(file);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    };

    input.click();
  };

  const handleCropComplete = async (croppedImageUrl) => {
    setShowCropper(false);

    // Convert cropped image URL to blob
    const response = await fetch(croppedImageUrl);
    const blob = await response.blob();
    const file = new File([blob], selectedFile.name, { type: "image/jpeg" });

    // Get current cursor position
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const loadingId = Date.now(); // Unique identifier for this upload
    const loadingText = `\n![Uploading-${loadingId}...]()\n`;

    // Insert loading indicator at cursor position
    const textBeforeCursor = value.substring(0, cursorPos);
    const textAfterCursor = value.substring(cursorPos);
    const valueWithLoading = textBeforeCursor + loadingText + textAfterCursor;

    if (onChange) {
      onChange(valueWithLoading);
    }

    try {
      // Upload the image
      const formData = new FormData();
      formData.append("image", file);

      const token = localStorage.getItem("token");
      const uploadResponse = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
        }/api/blogs/upload-image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await uploadResponse.json();

      if (data.success && data.url) {
        // Replace loading text with actual image using the callback pattern
        const alt = selectedFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
        const imageMarkdown = `\n![${alt}](${data.url})\n`;

        // Use a callback to ensure we're working with the latest value
        if (onChange) {
          // Get the current content from textarea
          const currentContent = textareaRef.current.value;
          const finalValue = currentContent.replace(loadingText, imageMarkdown);
          onChange(finalValue);
        }
        showToast("success", "Image uploaded successfully!");
      } else {
        // Remove loading text on error
        if (onChange) {
          const currentContent = textareaRef.current.value;
          const finalValue = currentContent.replace(loadingText, "");
          onChange(finalValue);
        }
        showToast(
          "error",
          "Failed to upload image: " + (data.message || "Unknown error")
        );
      }
    } catch (error) {
      // Remove loading text on error
      if (onChange) {
        const currentContent = textareaRef.current.value;
        const finalValue = currentContent.replace(loadingText, "");
        onChange(finalValue);
      }
      console.error("Upload error:", error);
      showToast("error", "Failed to upload image. Please try again.");
    }
  };

  const handleDeleteImage = async (imageUrl) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this image from the server?"
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
        }/api/blogs/delete-image`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageUrl }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Remove the image markdown from the content
        const imageRegex = new RegExp(
          `!\\[[^\\]]*\\]\\(${imageUrl.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}\\)`,
          "g"
        );
        const newValue = value.replace(imageRegex, "");
        if (onChange) {
          onChange(newValue);
        }
        showToast("success", "Image deleted successfully!");
      } else {
        showToast(
          "error",
          "Failed to delete image: " + (data.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Delete error:", error);
      showToast("error", "Failed to delete image. Please try again.");
    }
  };

  // Extract image URLs from markdown content (memoized)
  const getImagesFromContent = useCallback(() => {
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images = [];
    let match;
    while ((match = imageRegex.exec(value)) !== null) {
      images.push({
        alt: match[1],
        url: match[2],
        fullMatch: match[0],
      });
    }
    return images;
  }, [value]);

  const formatCodeBlock = useCallback(() => {
    const language = prompt("Enter language (optional):") || "";
    insertAtCursor("\n```" + language + "\n", "\n```\n", "Your code here");
  }, [insertAtCursor]);

  const formatTable = useCallback(() => {
    const tableTemplate =
      "\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n";
    insertAtCursor(tableTemplate, "", "");
  }, [insertAtCursor]);

  const toggleViewMode = useCallback(() => {
    const modes = ["edit", "split", "preview"];
    const currentIndex = modes.indexOf(viewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setViewMode(modes[nextIndex]);
  }, [viewMode]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const getViewModeIcon = useMemo(() => {
    switch (viewMode) {
      case "edit":
        return <Type className="w-3 h-3 sm:w-4 sm:h-4" />;
      case "preview":
        return <Eye className="w-3 h-3 sm:w-4 sm:h-4" />;
      case "split":
        return <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />;
      default:
        return <Type className="w-3 h-3 sm:w-4 sm:h-4" />;
    }
  }, [viewMode]);

  const editorStyle = useMemo(
    () => ({
      height: isFullscreen ? "100vh" : `${height}px`,
      border: "1px solid var(--border)",
      borderRadius: "8px",
      overflow: "hidden",
      backgroundColor: "var(--card)",
      position: isFullscreen ? "fixed" : "relative",
      top: isFullscreen ? "0" : "auto",
      left: isFullscreen ? "0" : "auto",
      width: isFullscreen ? "100vw" : "100%",
      zIndex: isFullscreen ? 9999 : "auto",
    }),
    [isFullscreen, height]
  );

  // Debounce preview content to prevent lag during typing
  const [previewContent, setPreviewContent] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setPreviewContent(value);
    }, 500); // 500ms delay for heavy content

    return () => {
      clearTimeout(handler);
    };
  }, [value]);

  return (
    <div
      data-color-mode={theme}
      className={`blog-editor ${className}`}
      style={editorStyle}
    >
      {/* (Toolbar code omitted for brevity as it is unchanged, but we are inside the component) */}
      
      {/* ... Toolbar ... */}
      <div
        className="flex items-center justify-between p-2 border-b sticky top-0 gap-2"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--muted)",
          zIndex: 10,
          overflowX: "auto",
        }}
      >
        {/* ... Toolbar content same as before ... */}
        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto">
           {(viewMode === "edit" || viewMode === "split") && (
             <div className="flex items-center gap-1 flex-1 min-w-0">
               {/* Headings */}
               <div className="flex items-center gap-1 pr-2 border-r" style={{ borderColor: "var(--border)" }}>
                 <ToolButton onClick={formatH1} title="Heading 1"><Heading1 className="w-3 h-3 sm:w-4 sm:h-4" /></ToolButton>
                 <ToolButton onClick={formatH2} title="Heading 2"><Heading2 className="w-3 h-3 sm:w-4 sm:h-4" /></ToolButton>
                 <ToolButton onClick={formatH3} title="Heading 3"><Heading3 className="w-3 h-3 sm:w-4 sm:h-4" /></ToolButton>
               </div>
               {/* Text Formatting */}
               <div className="flex items-center gap-1 pr-2 border-r" style={{ borderColor: "var(--border)" }}>
                 <ToolButton onClick={formatBold} title="Bold"><Bold className="w-3 h-3 sm:w-4 sm:h-4" /></ToolButton>
                 <ToolButton onClick={formatItalic} title="Italic"><Italic className="w-3 h-3 sm:w-4 sm:h-4" /></ToolButton>
                 <ToolButton onClick={formatStrikethrough} title="Strikethrough"><Strikethrough className="w-3 h-3 sm:w-4 sm:h-4" /></ToolButton>
               </div>
               {/* Links/Images */}
               <div className="flex items-center gap-1 pr-2 border-r" style={{ borderColor: "var(--border)" }}>
                 <ToolButton onClick={formatLink} title="Link"><Link className="w-3 h-3 sm:w-4 sm:h-4" /></ToolButton>
                 <ToolButton onClick={formatImage} title="Image"><Image className="w-3 h-3 sm:w-4 sm:h-4" /></ToolButton>
               </div>
               {/* Lists */}
               <div className="flex items-center gap-1 pr-2 border-r" style={{ borderColor: "var(--border)" }}>
                 <ToolButton onClick={formatUnorderedList} title="Bullet List"><List className="w-3 h-3 sm:w-4 sm:h-4" /></ToolButton>
                 <ToolButton onClick={formatOrderedList} title="Numbered List"><ListOrdered className="w-3 h-3 sm:w-4 sm:h-4" /></ToolButton>
               </div>
               {/* Code/Quote */}
               <div className="flex items-center gap-1 pr-2 border-r" style={{ borderColor: "var(--border)" }}>
                 <ToolButton onClick={formatInlineCode} title="Inline Code"><Code className="w-3 h-3 sm:w-4 sm:h-4" /></ToolButton>
                 <ToolButton onClick={formatCodeBlock} title="Code Block"><Code2 className="w-3 h-3 sm:w-4 sm:h-4" /></ToolButton>
                 <ToolButton onClick={formatQuote} title="Quote"><Quote className="w-3 h-3 sm:w-4 sm:h-4" /></ToolButton>
               </div>
               {/* Table/HR */}
               <div className="flex items-center gap-1">
                 <ToolButton onClick={formatTable} title="Table"><Table className="w-3 h-3 sm:w-4 sm:h-4" /></ToolButton>
                 <ToolButton onClick={formatHorizontalRule} title="Horizontal Rule"><Minus className="w-3 h-3 sm:w-4 sm:h-4" /></ToolButton>
               </div>
             </div>
           )}
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
           <button type="button" onClick={toggleViewMode} className="flex items-center gap-1 px-2 py-1 rounded text-sm hover:bg-opacity-80 cursor-pointer" style={{ backgroundColor: "var(--accent)", color: "var(--accent-foreground)" }}>
             {getViewModeIcon}
             <span className="capitalize hidden sm:inline">{viewMode}</span>
           </button>
           <button type="button" onClick={toggleFullscreen} className="flex items-center gap-1 px-2 py-1 rounded text-sm hover:bg-opacity-80 cursor-pointer" style={{ backgroundColor: "var(--secondary)", color: "var(--secondary-foreground)" }}>
             {isFullscreen ? <Minimize className="w-3 h-3 sm:w-4 sm:h-4" /> : <Maximize className="w-3 h-3 sm:w-4 sm:h-4" />}
           </button>
        </div>
      </div>

      {/* Editor Area */}
      <div
        className="flex gap-2"
        style={{
          height: isFullscreen
            ? "calc(100vh - 48px)"
            : `calc(${height}px - 48px)`,
        }}
      >
        {/* Main Editor and Preview Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Editor Panel */}
          {(viewMode === "edit" || viewMode === "split") && (
            <div
              className={`${
                viewMode === "split" ? "w-1/2" : "w-full"
              } relative`}
            >
              <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                className="w-full h-full p-4 resize-none focus:outline-none"
                style={{
                  backgroundColor: "var(--card)",
                  color: "var(--foreground)",
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                  fontSize: "14px",
                  lineHeight: "1.6",
                  border: "none",
                }}
              />
            </div>
          )}

          {/* Divider */}
          {viewMode === "split" && (
            <div
              className="w-px"
              style={{ backgroundColor: "var(--border)" }}
            />
          )}

          {/* Preview Panel */}
          {(viewMode === "preview" || viewMode === "split") && (
            <div
              className={`${
                viewMode === "split" ? "w-1/2" : "w-full"
              }`}
            >
              <div className="h-full p-4">
                 {/* Virtualized Preview handles its own scrolling */}
                <VirtualizedMdPreview
                  content={previewContent || "*Preview will appear here...*"}
                />
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Image Cropper Modal */}
      {showCropper && selectedImageForCrop && (
        <ImageCropper
          imageUrl={selectedImageForCrop}
          onClose={() => {
            setShowCropper(false);
            setSelectedImageForCrop(null);
            setSelectedFile(null);
          }}
          onCrop={handleCropComplete}
        />
      )}
    </div>
  );
};

export default BlogEditor;
