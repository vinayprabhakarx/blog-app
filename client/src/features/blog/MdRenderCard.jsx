import React, { useMemo, useCallback } from "react";
import MDEditor from "@uiw/react-md-editor";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import "katex/dist/katex.min.css";
import { useTheme } from "@/utils/ThemeContext";
import { Trash2, Copy, Check } from "lucide-react";

// CodeCopyButton receives a primitive string, so React.memo IS highly effective here!
const CodeCopyButton = React.memo(({ code }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 hover:bg-primary hover:text-primary-foreground text-muted-foreground border border-border backdrop-blur-sm shadow-sm transition-all duration-200 z-10 opacity-90 cursor-pointer"
      title="Copy code"
      aria-label="Copy code"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  );
});

// Static styles moved OUTSIDE the components to prevent re-creation completely (No useMemo needed!)
const staticStyles = {
  listDecimal: { listStyleType: "decimal", paddingLeft: "2.5rem", marginBottom: "1rem" },
  listDisc: { listStyleType: "disc", paddingLeft: "1.25rem", marginBottom: "1rem" },
  listItem: { marginBottom: "0.25rem", lineHeight: "1.6" },
  imageContainer: { position: "relative", display: "inline-block", maxWidth: "100%", margin: "1rem 0" },
  table: { backgroundColor: "transparent", margin: "1rem 0", width: "100%" },
  th: { backgroundColor: "var(--muted)", color: "var(--foreground)", padding: "0.75rem", border: "1px solid var(--border)", fontWeight: "600", textAlign: "left" },
  td: { backgroundColor: "var(--background)", color: "var(--foreground)", padding: "0.75rem", border: "1px solid var(--border)" },
  hr: { border: "none", borderTop: "2px solid var(--border)", margin: "2rem 0", width: "100%", backgroundColor: "transparent" },
  markdown: { backgroundColor: "transparent", color: "inherit", maxWidth: "100%", overflowWrap: "break-word", wordWrap: "break-word", wordBreak: "break-word" },
  pre: { overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", overflowWrap: "break-word", margin: "0", padding: "1rem", paddingTop: "2.5rem", borderRadius: "8px", backgroundColor: "var(--muted)", border: "1px solid var(--border)" },
  code: { whiteSpace: "pre-wrap", wordBreak: "break-all", overflowWrap: "break-word" }
};

// Markdown components (React.memo removed because `children` always changes reference on re-parse)
const MarkdownCode = ({ children = [], className }) => (
  <code className={className}>{children}</code>
);

const MarkdownHeading = ({ level, children, ...props }) => {
  const Tag = `h${level}`;
  const style = {
    borderBottom: "none",
    paddingBottom: "0",
    marginBottom: level <= 2 ? "1rem" : "0.75rem",
  };
  return React.createElement(Tag, { style, ...props }, children);
};

const MarkdownOrderedList = ({ children, ...props }) => <ol style={staticStyles.listDecimal} {...props}>{children}</ol>;
const MarkdownUnorderedList = ({ children, ...props }) => <ul style={staticStyles.listDisc} {...props}>{children}</ul>;
const MarkdownListItem = ({ children, ...props }) => <li style={staticStyles.listItem} {...props}>{children}</li>;
const MarkdownTable = ({ children, ...props }) => <table style={staticStyles.table} {...props}>{children}</table>;
const MarkdownTableHeader = ({ children, ...props }) => <th style={staticStyles.th} {...props}>{children}</th>;
const MarkdownTableData = ({ children, ...props }) => <td style={staticStyles.td} {...props}>{children}</td>;
const MarkdownHorizontalRule = (props) => <hr style={staticStyles.hr} {...props} />;

// Custom image component with delete button
const MarkdownImage = ({ src, alt, onDeleteImage, ...props }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const imageStyle = {
    maxWidth: "100%",
    maxHeight: onDeleteImage ? "18.75rem" : "none",
    width: "auto",
    height: "auto",
    display: "block",
    borderRadius: "8px",
    objectFit: "contain",
  };

  const buttonStyle = {
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
  };

  const handleDelete = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDeleteImage && src) onDeleteImage(src);
  }, [onDeleteImage, src]);

  if (!onDeleteImage) {
    return <img src={src} alt={alt} style={imageStyle} loading="lazy" {...props} />;
  }

  return (
    <div
      style={staticStyles.imageContainer}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img src={src} alt={alt} style={imageStyle} loading="lazy" {...props} />
      <button
        type="button"
        onClick={handleDelete}
        style={buttonStyle}
        title="Delete this image"
        onMouseOver={(e) => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.transform = "scale(1.05)"; }}
        onMouseOut={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

const MdRenderCard = React.memo(({ content = "", onDeleteImage }) => {
  const { theme } = useTheme();

  // Memoize plugins arrays
  const remarkPlugins = useMemo(() => [remarkMath], []);
  const rehypePlugins = useMemo(() => [rehypeKatex, rehypeRaw], []);

  // Memoize CSS styles for markdown rendering
  const markdownStyles = useMemo(
    () => `
    /* Prose base styles */
    .prose { width: 100%; max-width: 100% !important; }
    .prose ol, .prose ul { list-style-position: outside; padding-left: 2.5rem; margin-bottom: 1rem; max-width: 100%; width: 100%; }
    .prose ol { list-style-type: decimal; }
    .prose ul { list-style-type: disc; }

    /* Re-enable pointer events for heading content but not links */
    .wmde-markdown h1 *:not(a), .wmde-markdown h2 *:not(a), .wmde-markdown h3 *:not(a), .wmde-markdown h4 *:not(a), .wmde-markdown h5 *:not(a), .wmde-markdown h6 *:not(a),
    .prose h1 *:not(a), .prose h2 *:not(a), .prose h3 *:not(a), .prose h4 *:not(a), .prose h5 *:not(a), .prose h6 *:not(a) { pointer-events: auto !important; }

    /* Table width and layout optimization */
    .prose table { width: 100% !important; table-layout: auto !important; border-collapse: collapse !important; margin: 1rem 0 !important; }
    .prose th, .prose td { border: 1px solid var(--border) !important; padding: 0.75rem !important; word-wrap: break-word !important; }
    .prose th { background-color: var(--muted) !important; font-weight: 600 !important; }
    .prose td { background-color: var(--background) !important; }
    @media (min-width: 768px) { .prose table { table-layout: fixed !important; } }

    /* Global code block wrapping rules */
    .prose pre, .prose pre code, .prose code { white-space: pre-wrap !important; word-break: break-all !important; overflow-wrap: break-word !important; }
    .prose pre { overflow-x: hidden !important; }

    /* KaTeX math display centering */
    .katex-display { display: flex !important; justify-content: center !important; align-items: center !important; margin: 1.5em 0 !important; text-align: center !important; }
    .katex { font-size: 1.5em; line-height: 1.5; }

    /* Mobile-specific optimizations */
    @media (max-width: 640px) {
      .prose blockquote { line-height: 1.5; padding-left: 1rem; }
      .prose h1 { font-size: 1.5rem !important; line-height: 1.3 !important; }
      .prose h2 { font-size: 1.25rem !important; line-height: 1.4 !important; }
      .prose h3 { font-size: 1.125rem !important; line-height: 1.4 !important; }
      .prose h4 { font-size: 1rem !important; line-height: 1.5 !important; }
      .prose h5 { font-size: 0.875rem !important; line-height: 1.5 !important; }
      .prose h6 { font-size: 0.75rem !important; line-height: 1.5 !important; }
    }
  `, []);

  // Use useCallback so imageComponent doesn't recreate on every render unnecessarily 
  const imageComponent = useCallback((props) => <MarkdownImage {...props} onDeleteImage={onDeleteImage} />, [onDeleteImage]);

  const components = useMemo(() => ({
    code: MarkdownCode,
    h1: (props) => <MarkdownHeading level={1} {...props} />,
    h2: (props) => <MarkdownHeading level={2} {...props} />,
    h3: (props) => <MarkdownHeading level={3} {...props} />,
    h4: (props) => <MarkdownHeading level={4} {...props} />,
    h5: (props) => <MarkdownHeading level={5} {...props} />,
    h6: (props) => <MarkdownHeading level={6} {...props} />,
    ol: MarkdownOrderedList,
    ul: MarkdownUnorderedList,
    li: MarkdownListItem,
    table: MarkdownTable,
    th: MarkdownTableHeader,
    td: MarkdownTableData,
    hr: MarkdownHorizontalRule,
    img: imageComponent,
    pre: ({ children, ...props }) => {
      let codeString = "";
      const childrenArray = React.Children.toArray(children);
      const copiedNode = childrenArray.find(c => c?.props?.className === 'copied');
      
      if (copiedNode && copiedNode.props && copiedNode.props['data-code']) {
         codeString = copiedNode.props['data-code'];
      } else {
         const extractText = (node) => {
           if (typeof node === "string" || typeof node === "number") return String(node);
           if (Array.isArray(node)) return node.map(extractText).join("");
           if (React.isValidElement(node)) return extractText(node.props.children);
           return "";
         };
         codeString = extractText(children);
      }

      const filteredChildren = childrenArray.filter(c => c?.props?.className !== 'copied');

      return (
        <div className="relative my-6 group">
          <CodeCopyButton code={codeString} />
          <pre {...props} style={staticStyles.pre}>
            {filteredChildren}
          </pre>
        </div>
      );
    },
    code: ({ inline, children, ...props }) =>
      inline ? (
        <MarkdownCode {...props}>{children}</MarkdownCode>
      ) : (
        <code {...props} style={staticStyles.code}>
          {children}
        </code>
      ),
  }), [imageComponent]);

  return (
    <section className="w-full overflow-hidden">
      <style>{markdownStyles}</style>
      <div data-color-mode={theme} className="w-full">
        <div style={{ overflow: "hidden" }}>
          <MDEditor.Markdown
            source={content}
            style={staticStyles.markdown}
            remarkPlugins={remarkPlugins}
            rehypePlugins={rehypePlugins}
            components={components}
          />
        </div>
      </div>
    </section>
  );
});

export default MdRenderCard;
