import React, { useMemo, useCallback } from "react";
import MDEditor from "@uiw/react-md-editor";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import "katex/dist/katex.min.css";
import { useTheme } from "../../utils/ThemeContext";

// Memoize markdown component renderers to prevent re-creation on every render
const MarkdownCode = React.memo(({ children = [], className }) => {
  return <code className={className}>{children}</code>;
});

const MarkdownHeading = React.memo(({ level, children, ...props }) => {
  const Tag = `h${level}`;
  return React.createElement(Tag, { ...props }, children);
});

const MarkdownOrderedList = React.memo(({ children, ...props }) => {
  // Memoize inline style
  const listStyle = useMemo(
    () => ({
      listStyleType: "decimal",
      paddingLeft: "1.25rem",
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

const MdRenderCard = React.memo(({ content }) => {
  const { theme } = useTheme();

  // Memoize content to prevent unnecessary re-renders
  const memoizedContent = useMemo(() => content, [content]);

  // Memoize theme data attribute
  const themeDataMode = useMemo(() => theme, [theme]);

  const overflowStyle = useMemo(() => ({ overflow: "hidden" }), []);

  // Memoize plugins arrays
  const remarkPlugins = useMemo(() => [remarkMath], []);
  const rehypePlugins = useMemo(() => [rehypeKatex, rehypeRaw], []);

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
    }),
    [
      h1Component,
      h2Component,
      h3Component,
      h4Component,
      h5Component,
      h6Component,
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
    <div className="w-full overflow-hidden">
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
    </div>
  );
});

export default MdRenderCard;
