import React from "react";
import MDEditor from "@uiw/react-md-editor";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import "katex/dist/katex.min.css";
import { useTheme } from "../../utils/ThemeContext";

const MarkdownCode = ({ children = [], className }) => {
  return <code className={className}>{children}</code>;
};

const MarkdownHeading = ({ level, children, ...props }) => {
  const Tag = `h${level}`;
  return React.createElement(Tag, { ...props }, children);
};

const MarkdownOrderedList = ({ children, ...props }) => {
  return (
    <ol
      style={{
        listStyleType: "decimal",
        paddingLeft: "1.25rem",
        marginBottom: "1rem",
      }}
      {...props}
    >
      {children}
    </ol>
  );
};

const MarkdownUnorderedList = ({ children, ...props }) => {
  return (
    <ul
      style={{
        listStyleType: "disc",
        paddingLeft: "1.25rem",
        marginBottom: "1rem",
      }}
      {...props}
    >
      {children}
    </ul>
  );
};

const MarkdownListItem = ({ children, ...props }) => {
  return (
    <li style={{ marginBottom: "0.25rem", lineHeight: "1.6" }} {...props}>
      {children}
    </li>
  );
};

const MdRenderCard = ({ content, className = "" }) => {
  const { theme } = useTheme();

  const markdownStyle = {
    backgroundColor: "transparent",
    color: "inherit",
    maxWidth: "100%",
    overflowWrap: "break-word",
    wordWrap: "break-word",
    wordBreak: "break-word",
  };

  return (
    <div className="w-full overflow-hidden">
      <div
        data-color-mode={theme}
        className={`prose prose-base sm:prose-lg w-full max-w-[75ch] md:max-w-[80ch] mx-auto px-4 sm:px-6 ${className}
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
          `}
      >
        <div style={{ overflow: "hidden" }}>
          <MDEditor.Markdown
            source={content}
            style={markdownStyle}
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeRaw]}
            components={{
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
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MdRenderCard;
