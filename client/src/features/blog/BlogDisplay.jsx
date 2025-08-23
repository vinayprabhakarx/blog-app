import React from "react";

import MdRenderCard from "./MdRenderCard";

const BlogDisplay = ({ blog }) => {

  return (
    <div
      className="w-full transition-colors duration-300"
      style={{
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <article id="article" className="w-full max-w-[75ch] md:max-w-[80ch] mx-auto px-4 sm:px-6">
        <div className="w-full">
          <MdRenderCard content={blog.content} />
        </div>

        <footer
          className="mt-12 pt-6 border-t w-full"
          style={{
            borderColor: "var(--border)",
            color: "var(--muted-foreground)",
          }}
        ></footer>
      </article>
    </div>
  );
};

export default BlogDisplay;
