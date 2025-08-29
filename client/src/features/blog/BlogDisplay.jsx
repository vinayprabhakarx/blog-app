import React, { useMemo } from "react";

import MdRenderCard from "./MdRenderCard";

const BlogDisplay = React.memo(({ blog }) => {
  // Memoize inline styles to prevent unnecessary re-renders
  const containerStyle = useMemo(
    () => ({
      backgroundColor: "var(--background)",
      color: "var(--foreground)",
    }),
    []
  );

  const footerStyle = useMemo(
    () => ({
      borderColor: "var(--border)",
      color: "var(--muted-foreground)",
    }),
    []
  );

  // Memoize blog content to prevent unnecessary prop drilling
  const blogContent = useMemo(() => blog?.content || "", [blog?.content]);

  return (
    <div
      className="w-full transition-colors duration-300"
      style={containerStyle}
    >
      <article
        id="article"
        className="w-full max-w-[75ch] md:max-w-[80ch] mx-auto px-1 sm:px-2 md:px-4"
      >
        <div className="w-full">
          <MdRenderCard content={blogContent} />
        </div>

        <footer
          className="mt-12 pt-6 border-t w-full"
          style={footerStyle}
        ></footer>
      </article>
    </div>
  );
});

export default BlogDisplay;
