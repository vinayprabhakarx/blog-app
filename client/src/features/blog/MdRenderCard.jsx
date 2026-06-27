import React, { useMemo, useCallback } from "react";
import MDEditor from "@uiw/react-md-editor";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import "katex/dist/katex.min.css";
import { useTheme } from "@/utils/ThemeContext";
import { Trash2 } from "lucide-react";

// Memoize markdown component renderers to prevent re-creation on every render
const MarkdownCode = React.memo(({ children = [], className }) => {
  return <code className={className}>{children}</code>;
});

const MarkdownHeading = React.memo(({ level, children, ...props }) => {
  const Tag = `h${level}`;

  // Memoize heading styles to remove default heading separators
  const headingStyle = useMemo(
    () => ({
      borderBottom: "none",
      paddingBottom: "0",
      marginBottom: level <= 2 ? "1rem" : "0.75rem",
    }),
    [level]
  );

  return React.createElement(Tag, { style: headingStyle, ...props }, children);
});

const MarkdownOrderedList = React.memo(({ children, ...props }) => {
  // Memoize inline style
  const listStyle = useMemo(
    () => ({
      listStyleType: "decimal",
      paddingLeft: "2.5rem",
      marginBottom: "1rem",
    }),
    []
  );

  return (
    <ol style={listStyle} {...props}>
      {children}
    </ol>
  );
});

const MarkdownUnorderedList = React.memo(({ children, ...props }) => {
  // Memoize inline style
  const listStyle = useMemo(
    () => ({
      listStyleType: "disc",
      paddingLeft: "1.25rem",
      marginBottom: "1rem",
    }),
    []
  );

  return (
    <ul style={listStyle} {...props}>
      {children}
    </ul>
  );
});

const MarkdownListItem = React.memo(({ children, ...props }) => {
  // Memoize inline style
  const listItemStyle = useMemo(
    () => ({
      marginBottom: "0.25rem",
      lineHeight: "1.6",
    }),
    []
  );

  return (
    <li style={listItemStyle} {...props}>
      {children}
    </li>
  );
});

// Custom image component with delete button
const MarkdownImage = React.memo(({ src, alt, onDeleteImage, ...props }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const containerStyle = useMemo(
    () => ({
      position: "relative",
      display: "inline-block",
      maxWidth: "100%",
      margin: "1rem 0",
    }),
    []
  );

  const imageStyle = useMemo(
    () => ({
      maxWidth: "100%",
      maxHeight: onDeleteImage ? "18.75rem" : "none",
      width: "auto",
      height: "auto",
      display: "block",
      borderRadius: "8px",
      objectFit: "contain",
    }),
    [onDeleteImage]
  );

  const buttonStyle = useMemo(
    () => ({
      position: "absolute",
      top: "0.5rem",
      right: "0.5rem",
      padding: "0.5rem",
      borderRadius: "0.375rem",
      backgroundColor: "hsl(var(--warning))",
      color: "hsl(var(--warning-foreground))",
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: isHovered ? 1 : 0,
      transition: "all 0.2s ease",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
      zIndex: 10,
    }),
    [isHovered]
  );

  const handleDelete = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (onDeleteImage && src) {
        onDeleteImage(src);
      }
    },
    [onDeleteImage, src]
  );

  if (!onDeleteImage) {
    // If no delete handler, render normal image with lazy loading
    return (
      <img src={src} alt={alt} style={imageStyle} loading="lazy" {...props} />
    );
  }

  return (
    <div
      style={containerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img src={src} alt={alt} style={imageStyle} loading="lazy" {...props} />
      <button
        type="button"
        onClick={handleDelete}
        style={buttonStyle}
        title="Delete this image"
        onMouseOver={(e) => {
          e.currentTarget.style.opacity = "0.85";
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.opacity = "1";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
});

// Memoize table components for consistent theming
const MarkdownTable = React.memo(({ children, ...props }) => {
  const tableStyle = useMemo(
    () => ({
      backgroundColor: "transparent",
      margin: "1rem 0",
      width: "100%",
    }),
    []
  );

  return (
    <table style={tableStyle} {...props}>
      {children}
    </table>
  );
});

const MarkdownTableHeader = React.memo(({ children, ...props }) => {
  const thStyle = useMemo(
    () => ({
      backgroundColor: "var(--muted)",
      color: "var(--foreground)",
      padding: "0.75rem",
      border: "1px solid var(--border)",
      fontWeight: "600",
      textAlign: "left",
    }),
    []
  );

  return (
    <th style={thStyle} {...props}>
      {children}
    </th>
  );
});

const MarkdownTableData = React.memo(({ children, ...props }) => {
  const tdStyle = useMemo(
    () => ({
      backgroundColor: "var(--background)",
      color: "var(--foreground)",
      padding: "0.75rem",
      border: "1px solid var(--border)",
    }),
    []
  );

  return (
    <td style={tdStyle} {...props}>
      {children}
    </td>
  );
});

// Memoize horizontal rule (separator) component
const MarkdownHorizontalRule = React.memo((props) => {
  const hrStyle = useMemo(
    () => ({
      border: "none",
      borderTop: "2px solid var(--border)",
      margin: "2rem 0",
      width: "100%",
      backgroundColor: "transparent",
    }),
    []
  );

  return <hr style={hrStyle} {...props} />;
});

const MdRenderCard = React.memo(({ content = "", onDeleteImage }) => {
  const { theme } = useTheme();

  // Memoize content to prevent unnecessary re-renders
  const memoizedContent = useMemo(() => content, [content]);

  // Memoize theme data attribute
  const themeDataMode = useMemo(() => theme, [theme]);

  const overflowStyle = useMemo(() => ({ overflow: "hidden" }), []);

  // Memoize plugins arrays
  const remarkPlugins = useMemo(() => [remarkMath], []);
  const rehypePlugins = useMemo(() => [rehypeKatex, rehypeRaw], []);

  // Memoize CSS styles for markdown rendering
  const markdownStyles = useMemo(
    () => `
    /* Prose base styles */
    .prose {
      width: 100%;
      max-width: 100% !important;
    }

    .prose ol,
    .prose ul {
      list-style-position: outside;
      padding-left: 2.5rem;
      margin-bottom: 1rem;
      max-width: 100%;
      width: 100%;
    }

    .prose ol {
      list-style-type: decimal;
    }

    .prose ul {
      list-style-type: disc;
    }

    /* Re-enable pointer events for heading content but not links */
    .wmde-markdown h1 *:not(a),
    .wmde-markdown h2 *:not(a),
    .wmde-markdown h3 *:not(a),
    .wmde-markdown h4 *:not(a),
    .wmde-markdown h5 *:not(a),
    .wmde-markdown h6 *:not(a),
    .prose h1 *:not(a),
    .prose h2 *:not(a),
    .prose h3 *:not(a),
    .prose h4 *:not(a),
    .prose h5 *:not(a),
    .prose h6 *:not(a) {
      pointer-events: auto !important;
    }

    /* Table width and layout optimization */
    .prose table {
      width: 100% !important;
      table-layout: auto !important;
      border-collapse: collapse !important;
      margin: 1rem 0 !important;
    }

    .prose th,
    .prose td {
      border: 1px solid var(--border) !important;
      padding: 0.75rem !important;
      word-wrap: break-word !important;
    }

    .prose th {
      background-color: var(--muted) !important;
      font-weight: 600 !important;
    }

    .prose td {
      background-color: var(--background) !important;
    }

    /* Ensure tables expand on larger screens */
    @media (min-width: 768px) {
      .prose table {
        table-layout: fixed !important;
      }
    }

    /* Global code block wrapping rules */
    .prose pre {
      overflow-x: hidden !important;
      white-space: pre-wrap !important;
      word-break: break-all !important;
      overflow-wrap: break-word !important;
    }

    .prose pre code {
      white-space: pre-wrap !important;
      word-break: break-all !important;
      overflow-wrap: break-word !important;
    }

    .prose code {
      white-space: pre-wrap !important;
      word-break: break-all !important;
      overflow-wrap: break-word !important;
    }

    /* KaTeX math display centering */
    .katex-display {
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      margin: 1.5em 0 !important;
      text-align: center !important;
    }

    .katex {
      font-size: 1.5em;
      line-height: 1.5;
    }

    /* Mobile-specific optimizations */
    @media (max-width: 640px) {
      .prose blockquote {
        line-height: 1.5;
        padding-left: 1rem;
      }

      /* Fix markdown heading sizes */
      .prose h1 {
        font-size: 1.5rem !important;
        line-height: 1.3 !important;
      }

      .prose h2 {
        font-size: 1.25rem !important;
        line-height: 1.4 !important;
      }

      .prose h3 {
        font-size: 1.125rem !important;
        line-height: 1.4 !important;
      }

      .prose h4 {
        font-size: 1rem !important;
        line-height: 1.5 !important;
      }

      .prose h5 {
        font-size: 0.875rem !important;
        line-height: 1.5 !important;
      }

      .prose h6 {
        font-size: 0.75rem !important;
        line-height: 1.5 !important;
      }
    }
  `,
    []
  );

  // Memoize heading component factories to prevent recreation
  const createHeading = useCallback(
    (level) => (props) => <MarkdownHeading level={level} {...props} />,
    []
  );

  const h1Component = useMemo(() => createHeading(1), [createHeading]);
  const h2Component = useMemo(() => createHeading(2), [createHeading]);
  const h3Component = useMemo(() => createHeading(3), [createHeading]);
  const h4Component = useMemo(() => createHeading(4), [createHeading]);
  const h5Component = useMemo(() => createHeading(5), [createHeading]);
  const h6Component = useMemo(() => createHeading(6), [createHeading]);

  // Create image component with delete handler
  const imageComponent = useCallback(
    (props) => <MarkdownImage {...props} onDeleteImage={onDeleteImage} />,
    [onDeleteImage]
  );

  // Memoize components object
  const components = useMemo(
    () => ({
      code: MarkdownCode,
      h1: h1Component,
      h2: h2Component,
      h3: h3Component,
      h4: h4Component,
      h5: h5Component,
      h6: h6Component,
      ol: MarkdownOrderedList,
      ul: MarkdownUnorderedList,
      li: MarkdownListItem,
      table: MarkdownTable,
      th: MarkdownTableHeader,
      td: MarkdownTableData,
      hr: MarkdownHorizontalRule,
      img: imageComponent,
    }),
    [
      h1Component,
      h2Component,
      h3Component,
      h4Component,
      h5Component,
      h6Component,
      imageComponent,
    ]
  );

  // Memoize static styles and configurations
  const markdownStyle = useMemo(
    () => ({
      backgroundColor: "transparent",
      color: "inherit",
      maxWidth: "100%",
      overflowWrap: "break-word",
      wordWrap: "break-word",
      wordBreak: "break-word",
    }),
    []
  );

  // Memoize code block styles
  const preStyle = useMemo(
    () => ({
      overflowX: "hidden",
      whiteSpace: "pre-wrap",
      wordBreak: "break-all",
      overflowWrap: "break-word",
      margin: "1.5rem 0",
      padding: "1rem",
      borderRadius: "8px",
      backgroundColor: "var(--muted)",
      border: "1px solid var(--border)",
    }),
    []
  );

  const codeStyle = useMemo(
    () => ({
      whiteSpace: "pre-wrap",
      wordBreak: "break-all",
      overflowWrap: "break-word",
    }),
    []
  );

  return (
    <section className="w-full overflow-hidden">
      <style>{markdownStyles}</style>
      <div data-color-mode={themeDataMode} className="w-full">
        <div style={overflowStyle}>
          <MDEditor.Markdown
            source={memoizedContent}
            style={markdownStyle}
            remarkPlugins={remarkPlugins}
            rehypePlugins={rehypePlugins}
            components={{
              ...components,
              pre: ({ children, ...props }) => (
                <pre {...props} style={preStyle}>
                  {children}
                </pre>
              ),
              code: ({ inline, children, ...props }) =>
                inline ? (
                  <MarkdownCode {...props}>{children}</MarkdownCode>
                ) : (
                  <code {...props} style={codeStyle}>
                    {children}
                  </code>
                ),
            }}
          />
        </div>
      </div>
    </section>
  );
});

export default MdRenderCard;
