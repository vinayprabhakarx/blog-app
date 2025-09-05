import React, { useState, useRef } from "react";
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
} from "lucide-react";
import MdRenderCardWrapper from "./MdRenderCardWrapper";
import { useTheme } from "../../utils/ThemeContext";
const ToolButton = ({ onClick, title, children }) => (
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
);

const BlogEditor = ({
  value = "",
  onChange,
  height = 500,
  placeholder = "Write your blog content using Markdown...",
  className = "",
}) => {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState("split");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef(null);

  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  // Insert text at cursor position with proper cursor placement
  const insertAtCursor = (before, after = "", placeholder = "") => {
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
  };

  // Formatting functions
  const formatBold = () => insertAtCursor("**", "**", "bold text");
  const formatItalic = () => insertAtCursor("*", "*", "italic text");
  const formatStrikethrough = () =>
    insertAtCursor("~~", "~~", "strikethrough text");
  const formatInlineCode = () => insertAtCursor("`", "`", "code");
  const formatH1 = () => insertAtCursor("# ", "", "Heading 1");
  const formatH2 = () => insertAtCursor("## ", "", "Heading 2");
  const formatH3 = () => insertAtCursor("### ", "", "Heading 3");
  const formatQuote = () => insertAtCursor("> ", "", "Quote text");
  const formatUnorderedList = () => insertAtCursor("- ", "", "List item");
  const formatOrderedList = () => insertAtCursor("1. ", "", "List item");
  const formatHorizontalRule = () => insertAtCursor("\n---\n", "", "");

  const formatLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      insertAtCursor("[", `](${url})`, "link text");
    }
  };

  const formatImage = () => {
    const url = prompt("Enter image URL:");
    const alt = prompt("Enter alt text (optional):") || "image";
    if (url) {
      insertAtCursor(`![${alt}](${url})`, "", "");
    }
  };

  const formatCodeBlock = () => {
    const language = prompt("Enter language (optional):") || "";
    insertAtCursor("\n```" + language + "\n", "\n```\n", "Your code here");
  };

  const formatTable = () => {
    const tableTemplate =
      "\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n";
    insertAtCursor(tableTemplate, "", "");
  };

  const toggleViewMode = () => {
    const modes = ["edit", "split", "preview"];
    const currentIndex = modes.indexOf(viewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setViewMode(modes[nextIndex]);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getViewModeIcon = () => {
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
  };

  const editorStyle = {
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
  };

  return (
    <div
      data-color-mode={theme}
      className={`blog-editor ${className}`}
      style={editorStyle}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between p-2 border-b sticky top-0"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--muted)",
          zIndex: 10,
        }}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleViewMode}
            className="flex items-center gap-1 px-2 py-1 rounded text-sm hover:bg-opacity-80 cursor-pointer"
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--accent-foreground)",
            }}
          >
            {getViewModeIcon()}
            <span className="capitalize">{viewMode}</span>
          </button>
        </div>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="flex items-center gap-1 px-2 py-1 rounded text-sm hover:bg-opacity-80 cursor-pointer"
          style={{
            backgroundColor: "var(--secondary)",
            color: "var(--secondary-foreground)",
          }}
        >
          {isFullscreen ? (
            <Minimize className="w-3 h-3 sm:w-4 sm:h-4" />
          ) : (
            <Maximize className="w-3 h-3 sm:w-4 sm:h-4" />
          )}
        </button>
      </div>

      {/* Formatting Toolbar */}
      {(viewMode === "edit" || viewMode === "split") && (
        <div
          className="flex items-center gap-1 p-2 border-b overflow-x-auto sticky top-[48px] whitespace-nowrap"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--background)",
            zIndex: 10,
          }}
        >
          <div className="flex items-center gap-2 min-w-fit">
            {/* Headings */}
            <div
              className="flex items-center gap-1 pr-2 border-r"
              style={{ borderColor: "var(--border)" }}
            >
              <ToolButton onClick={formatH1} title="Heading 1">
                <Heading1 className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolButton>
              <ToolButton onClick={formatH2} title="Heading 2">
                <Heading2 className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolButton>
              <ToolButton onClick={formatH3} title="Heading 3">
                <Heading3 className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolButton>
            </div>

            {/* Text Formatting */}
            <div
              className="flex items-center gap-1 pr-2 border-r"
              style={{ borderColor: "var(--border)" }}
            >
              <ToolButton onClick={formatBold} title="Bold">
                <Bold className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolButton>
              <ToolButton onClick={formatItalic} title="Italic">
                <Italic className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolButton>
              <ToolButton onClick={formatStrikethrough} title="Strikethrough">
                <Strikethrough className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolButton>
            </div>

            {/* Links and Images */}
            <div
              className="flex items-center gap-1 pr-2 border-r"
              style={{ borderColor: "var(--border)" }}
            >
              <ToolButton onClick={formatLink} title="Link">
                <Link className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolButton>
              <ToolButton onClick={formatImage} title="Image">
                <Image className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolButton>
            </div>

            {/* Lists */}
            <div
              className="flex items-center gap-1 pr-2 border-r"
              style={{ borderColor: "var(--border)" }}
            >
              <ToolButton onClick={formatUnorderedList} title="Bullet List">
                <List className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolButton>
              <ToolButton onClick={formatOrderedList} title="Numbered List">
                <ListOrdered className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolButton>
            </div>

            {/* Code and Quote */}
            <div
              className="flex items-center gap-1 pr-2 border-r"
              style={{ borderColor: "var(--border)" }}
            >
              <ToolButton onClick={formatInlineCode} title="Inline Code">
                <Code className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolButton>
              <ToolButton onClick={formatCodeBlock} title="Code Block">
                <Code2 className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolButton>
              <ToolButton onClick={formatQuote} title="Quote">
                <Quote className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolButton>
            </div>

            {/* Table and Horizontal Rule */}
            <div className="flex items-center gap-1">
              <ToolButton onClick={formatTable} title="Table">
                <Table className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolButton>
              <ToolButton
                onClick={formatHorizontalRule}
                title="Horizontal Rule"
              >
                <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolButton>
            </div>
          </div>
        </div>
      )}

      {/* Editor Area */}
      <div
        className="flex"
        style={{
          height: `calc(${isFullscreen ? "80vh" : height + "px"} - 48px)`,
        }}
      >
        {/* Editor Panel */}
        {(viewMode === "edit" || viewMode === "split") && (
          <div
            className={`${viewMode === "split" ? "w-1/2" : "w-full"} relative`}
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
          <div className="w-px" style={{ backgroundColor: "var(--border)" }} />
        )}

        {/* Preview Panel */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div
            className={`${
              viewMode === "split" ? "w-1/2" : "w-full"
            } overflow-auto`}
          >
            <div className="p-4">
              <MdRenderCardWrapper
                content={value || "*Preview will appear here...*"}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogEditor;
