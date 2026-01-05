import React, { useEffect, useCallback, useRef, useState } from "react";

import MdRenderCardWrapper from "./MdRenderCardWrapper";

// Chunk size in characters for each render
// Increased chunk size to 8000 for fewer loads on large posts
const CHUNK_SIZE = 8000;
// Only apply chunking for blogs larger than this (in characters)
// ~24,000 chars = ~6,000 words = ~30 min read
const LARGE_BLOG_THRESHOLD = 24000;

/**
 * Converts a heading text to a slug ID (matching @uiw/react-md-editor behavior).
 * This replicates how the markdown renderer creates IDs for headings.
 */
const textToSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special chars except hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .trim();
};

/**
 * Finds the character position of a heading in markdown content by its slug.
 * Returns -1 if not found.
 */
const findHeadingPosition = (content, targetSlug) => {
  // Match markdown headings: # Heading, ## Heading, etc.
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const headingText = match[2].trim();
    const slug = textToSlug(headingText);

    if (slug === targetSlug) {
      return match.index; // Return the character position
    }
  }

  return -1;
};

const BlogDisplay = ({ blog }) => {
  const content = blog?.content || "";
  const isLargeBlog = content.length > LARGE_BLOG_THRESHOLD;

  // For small blogs, show everything; for large blogs, chunk it
  const totalChunks = isLargeBlog ? Math.ceil(content.length / CHUNK_SIZE) : 1;
  const [visibleChunks, setVisibleChunks] = useState(
    isLargeBlog ? 1 : totalChunks
  );

  const displayedContent = isLargeBlog
    ? content.slice(0, visibleChunks * CHUNK_SIZE)
    : content;

  const containerRef = useRef(null);
  const pendingScrollRef = useRef(null);
  const articleRef = useRef(null);
  const isPausedRef = useRef(false);
  const lastScrollYRef = useRef(0);

  // Listen for pause/resume events from BlogPage (for comment navigation)
  useEffect(() => {
    const handlePause = () => {
      isPausedRef.current = true;
    };

    const handleResume = () => {
      isPausedRef.current = false;
    };

    window.addEventListener("blog-chunk-pause", handlePause);
    window.addEventListener("blog-chunk-resume", handleResume);

    return () => {
      window.removeEventListener("blog-chunk-pause", handlePause);
      window.removeEventListener("blog-chunk-resume", handleResume);
    };
  }, []);

  // Infinite scroll: pre-load chunks before user reaches end (only for large blogs)
  // Pauses when user navigates to comments
  useEffect(() => {
    if (!isLargeBlog || visibleChunks >= totalChunks) return;

    const handleScroll = () => {
      // Don't load more chunks if paused
      if (isPausedRef.current) return;

      const scrollY = window.scrollY || window.pageYOffset;
      const viewportHeight = window.innerHeight;

      // Get article bottom position
      const articleBottom =
        articleRef.current?.getBoundingClientRect()?.bottom ?? 0;
      const articleBottomFromTop = scrollY + articleBottom;

      // Pre-load when user is within 800px of article end (not page end)
      if (scrollY + viewportHeight + 800 >= articleBottomFromTop) {
        setVisibleChunks((prev) => Math.min(prev + 1, totalChunks));
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLargeBlog, visibleChunks, totalChunks]);

  // Resume chunk loading ONLY when user scrolls UP and comments are not visible
  useEffect(() => {
    if (!isLargeBlog || visibleChunks >= totalChunks) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY || window.pageYOffset;
      const isScrollingUp = currentScrollY < lastScrollYRef.current;
      lastScrollYRef.current = currentScrollY;

      // Only check for resume if currently paused AND scrolling UP
      if (!isPausedRef.current || !isScrollingUp) return;

      // Check if comment section exists
      const commentSection = document.getElementById("comment-section");
      if (commentSection) {
        const commentRect = commentSection.getBoundingClientRect();

        // Resume only when comment section is completely BELOW the viewport
        // (user scrolled up and comments are no longer visible at all)
        if (commentRect.top > window.innerHeight) {
          isPausedRef.current = false;
        }
      } else {
        // No comment section, safe to resume
        isPausedRef.current = false;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLargeBlog, visibleChunks, totalChunks]);

  useEffect(() => {
    // Reset when blog changes
    setVisibleChunks(
      content.length > LARGE_BLOG_THRESHOLD
        ? 1
        : Math.ceil(content.length / CHUNK_SIZE) || 1
    );
    isPausedRef.current = false;
  }, [blog?._id, content.length]);

  // Handle pending scroll after chunks are loaded
  useEffect(() => {
    if (pendingScrollRef.current) {
      const targetId = pendingScrollRef.current;
      // Use requestAnimationFrame to wait for DOM update
      requestAnimationFrame(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          pendingScrollRef.current = null;
        }
      });
    }
  }, [visibleChunks]); // Re-run when chunks change

  // Scroll to section, loading chunks if necessary
  const scrollToSection = useCallback(
    (targetId) => {
      // First, check if element already exists in DOM
      const existingElement = document.getElementById(targetId);
      if (existingElement) {
        existingElement.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      // Element not found - need to load more chunks
      // Find the heading position in the full content
      const position = findHeadingPosition(content, targetId);
      if (position === -1) {
        // Heading not found in content, load all chunks as fallback
        setVisibleChunks(totalChunks);
        pendingScrollRef.current = targetId;
        return;
      }

      // Calculate which chunk contains this heading
      const requiredChunks = Math.ceil((position + 1) / CHUNK_SIZE);
      const chunksToLoad = Math.min(requiredChunks + 1, totalChunks); // Load one extra for safety

      if (chunksToLoad > visibleChunks) {
        pendingScrollRef.current = targetId;
        setVisibleChunks(chunksToLoad);
      }
    },
    [content, totalChunks, visibleChunks]
  );

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
      <article
        ref={articleRef}
        id="article"
        className="w-full px-2 sm:px-4 md:px-0"
        style={{
          /* 
            CENTRAL ALIGNMENT LOGIC:
            - Max-width is correctly limited to 800px on desktop to maintain readability and alignment.
            - Margin is set to "0 auto" to center the content within the available space.
          */
          maxWidth: window.innerWidth < 768 ? "100%" : "800px",
          margin: window.innerWidth < 768 ? 0 : "0 auto",
        }}
      >
        <div className="w-full">
          <MdRenderCardWrapper content={displayedContent} />
          {/* Infinite scroll: no button, chunks load as you scroll */}
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
