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
  const listStyle = useMemo(() => ({
    listStyleType: "decimal",
    paddingLeft: "1.25rem",
    marginBottom: "1rem",
  }), []);

  return (
    <ol
      style={listStyle}
      {...props}
    >
      {children}
    </ol>
  );
});

const MarkdownUnorderedList = React.memo(({ children, ...props }) => {
  // Memoize inline style
  const listStyle = useMemo(() => ({
    listStyleType: "disc",
    paddingLeft: "1.25rem",
    marginBottom: "1rem",
  }), []);

  return (
    <ul
      style={listStyle}
      {...props}
    >
      {children}
    </ul>
  );
});

const MarkdownListItem = React.memo(({ children, ...props }) => {
  // Memoize inline style
  const listItemStyle = useMemo(() => ({
    marginBottom: "0.25rem", 
    lineHeight: "1.6"
  }), []);

  return (
    <li style={listItemStyle} {...props}>
      {children}
    </li>
  );
});

const MdRenderCard = React.memo(({ content, className = "" }) => {
  const { theme } = useTheme();

  // Memoize static styles and configurations
  const markdownStyle = useMemo(() => ({
    backgroundColor: "transparent",
    color: "inherit",
    maxWidth: "100%",
    overflowWrap: "break-word",
    wordWrap: "break-word",
    wordBreak: "break-word",
  }), []);

  const overflowStyle = useMemo(() => ({ overflow: "hidden" }), []);

  // Memoize plugins arrays
  const remarkPlugins = useMemo(() => [remarkMath], []);
  const rehypePlugins = useMemo(() => [rehypeKatex, rehypeRaw], []);

  // Memoize heading component factories to prevent recreation
  const createHeading = useCallback((level) => (props) => (
    <MarkdownHeading level={level} {...props} />
  ), []);

  const h1Component = useMemo(() => createHeading(1), [createHeading]);
  const h2Component = useMemo(() => createHeading(2), [createHeading]);
  const h3Component = useMemo(() => createHeading(3), [createHeading]);
  const h4Component = useMemo(() => createHeading(4), [createHeading]);
  const h5Component = useMemo(() => createHeading(5), [createHeading]);
  const h6Component = useMemo(() => createHeading(6), [createHeading]);

  // Memoize components object
  const components = useMemo(() => ({
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
  }), [h1Component, h2Component, h3Component, h4Component, h5Component, h6Component]);

  // Memoize className string
  const computedClassName = useMemo(() => 
    `prose prose-base sm:prose-lg w-full max-w-[75ch] md:max-w-[80ch] mx-auto px-4 sm:px-6 ${className}
      prose-headings:font-bold prose-headings:mb-3 sm:prose-headings:mb-4 prose-headings:mt-6 sm:prose-headings:mt-8
      prose-p:my-3 sm:prose-p:my-4 prose-p:leading-relaxed prose-p:break-words
      prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600
      prose-blockquote:pl-3 sm:prose-blockquote:pl-4 prose-blockquote:italic
      prose-pre:bg-transparent prose-pre:p-0 prose-pre:max-w-full prose-pre:overflow-x-auto
      prose-code:before:content-[''] prose-code:after:content-['']
      prose-ul:my-2 prose-ol:my-2 prose-ul:max-w-full prose-ol:max-w-full
      prose-li:my-1 prose-li:max-w-full prose-li:break-words
      dark:prose-invert
      prose-img:rounded-lg prose-img:mx-auto prose-img:max-w-full prose-img:h-auto
      prose-table:max-w-full prose-td:px-2 sm:prose-td:px-4 prose-td:py-1 sm:prose-td:py-2 prose-td:break-words
      prose-th:px-2 sm:prose-th:px-4 prose-th:py-1 sm:prose-th:py-2 prose-th:break-words
      prose-table:overflow-x-auto prose-table:block prose-table:w-full
      `, 
    [className]
  );

  return (
    <div className="w-full overflow-hidden">
      <div
        data-color-mode={theme}
        className={computedClassName}
      >
        <div style={overflowStyle}>
          <MDEditor.Markdown
            source={content}
            style={markdownStyle}
            remarkPlugins={remarkPlugins}
            rehypePlugins={rehypePlugins}
            components={components}
          />
        </div>
      </div>
    </div>
  );
});

export default MdRenderCard;
