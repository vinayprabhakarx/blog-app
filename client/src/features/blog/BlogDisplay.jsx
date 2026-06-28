import React, { useEffect, useCallback, useRef } from "react";

import MdRenderCardWrapper from "./MdRenderCardWrapper";

const BlogDisplay = ({ blog }) => {
  const content = blog?.content || "";
  const containerRef = useRef(null);

  // Scroll to section by heading slug
  const scrollToSection = useCallback((targetId) => {
    // Check if element already exists in DOM
    const existingElement = document.getElementById(targetId);
    if (existingElement) {
      existingElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Intercept clicks on hash links
  useEffect(() => {
    const handleClick = (e) => {
      const target = e.target.closest('a[href^="#"]');
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href || href === "#") return;

      const targetId = href.slice(1); // Remove the # prefix
      e.preventDefault();
      scrollToSection(targetId);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("click", handleClick);
      return () => container.removeEventListener("click", handleClick);
    }
  }, [scrollToSection]);

  // Handle initial hash in URL on page load
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      const targetId = hash.slice(1);
      // Small delay to let initial render complete
      setTimeout(() => scrollToSection(targetId), 100);
    }
  }, [scrollToSection]);

  return (
    <div
      ref={containerRef}
      className="w-full transition-colors duration-300"
      style={{
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <div
        id="blog-content"
        className="w-full px-2 sm:px-4 md:px-0 blog-content-responsive"
      >
        <div className="w-full">
          <MdRenderCardWrapper content={content} />
        </div>

        <footer
          className="mt-12 pt-6 border-t w-full"
          style={{
            borderColor: "var(--border)",
            color: "var(--muted-foreground)",
          }}
        ></footer>
      </div>
    </div>
  );
};

export default BlogDisplay;
