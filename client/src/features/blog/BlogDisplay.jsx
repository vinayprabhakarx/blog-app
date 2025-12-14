import React from "react";

import MdRenderCardWrapper from "./MdRenderCardWrapper";

const BlogDisplay = ({ blog }) => {
  return (
    <div
      className="w-full transition-colors duration-300"
      style={{
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <article
        id="article"
        className="w-full px-2 sm:px-4 md:px-0"
        style={{
          maxWidth: window.innerWidth < 768 ? "100%" : "800px",
          margin: window.innerWidth < 768 ? 0 : "0 auto",
        }}
      >
        <div className="w-full">
          <MdRenderCardWrapper content={blog?.content || ""} />
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
