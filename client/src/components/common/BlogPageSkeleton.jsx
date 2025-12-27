import React from "react";


const BlogPageSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content Container */}
      <div className="w-full sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8">
        {/* Breadcrumb skeleton */}
        <nav className="max-w-2xl mx-auto mb-6">
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 bg-muted-foreground/10 rounded animate-pulse" />
            <div className="h-4 w-4 bg-muted-foreground/10 rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted-foreground/10 rounded animate-pulse" />
          </div>
        </nav>

        {/* Blog Header skeleton */}
        <div className="w-full overflow-hidden">
          <div
            className="w-full px-2 sm:px-4 md:px-0 pb-6"
            style={{
              maxWidth: window.innerWidth < 768 ? "100%" : "800px",
              margin: window.innerWidth < 768 ? 0 : "0 auto",
            }}
          >
            <header className="mb-6 border-b border-border pb-4">
              {/* Title */}
              <div className="space-y-3 mb-2">
                <div className="h-8 md:h-10 w-full bg-muted-foreground/10 rounded-lg animate-pulse" />
                <div className="h-8 md:h-10 w-4/5 bg-muted-foreground/10 rounded-lg animate-pulse" />
              </div>

              {/* Excerpt */}
              <div className="space-y-2 mb-4 mt-4">
                <div className="h-5 w-full bg-muted-foreground/10 rounded animate-pulse" />
                <div className="h-5 w-3/4 bg-muted-foreground/10 rounded animate-pulse" />
              </div>

              {/* Byline */}
              <div className="flex items-center gap-2 mb-2">
                <div className="h-4 w-32 bg-muted-foreground/10 rounded animate-pulse" />
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 md:gap-6 lg:gap-8 mt-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-5 w-5 bg-muted-foreground/10 rounded animate-pulse" />
                    <div className="h-4 w-8 bg-muted-foreground/10 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </header>

            {/* Banner image skeleton - simpler style like card */}
            <div className="mt-6">
              <div className="relative overflow-hidden bg-muted rounded-lg border border-border/50 aspect-video animate-pulse">
                <div className="h-full w-full bg-muted-foreground/10" />
              </div>
            </div>
          </div>
        </div>

        {/* Blog Content skeleton */}
        <div className="w-full">
          <article
            className="w-full px-2 sm:px-4 md:px-0"
            style={{
              maxWidth: window.innerWidth < 768 ? "100%" : "800px",
              margin: window.innerWidth < 768 ? 0 : "0 auto",
            }}
          >
            <div className="w-full mt-8 space-y-6">
              {/* Paragraph blocks */}
              {[1, 2, 3, 4].map((block) => (
                <div key={block} className="space-y-3">
                  <div className="h-4 w-full bg-muted-foreground/10 rounded animate-pulse" />
                  <div className="h-4 w-full bg-muted-foreground/10 rounded animate-pulse" />
                  <div className="h-4 w-11/12 bg-muted-foreground/10 rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-muted-foreground/10 rounded animate-pulse" />
                </div>
              ))}

              {/* Heading */}
              <div className="h-7 w-3/5 bg-muted-foreground/10 rounded-lg animate-pulse mt-8 mb-4" />

              {/* More paragraphs */}
              <div className="space-y-3">
                <div className="h-4 w-full bg-muted-foreground/10 rounded animate-pulse" />
                <div className="h-4 w-full bg-muted-foreground/10 rounded animate-pulse" />
                <div className="h-4 w-4/5 bg-muted-foreground/10 rounded animate-pulse" />
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

export default BlogPageSkeleton;
