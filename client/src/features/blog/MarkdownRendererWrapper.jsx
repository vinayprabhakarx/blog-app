import React, { Suspense } from "react";

// Lazy load the heavy markdown component
const MarkdownRendererLazy = React.lazy(() => import("@/features/blog/MarkdownRenderer"));

const MarkdownRendererWrapper = ({ content, onDeleteImage, ...props }) => {
  return (
    <Suspense
      fallback={
        <div className="w-full mt-8 space-y-6">
          {[1, 2, 3, 4].map((block) => (
            <div key={block} className="space-y-3">
              <div className="h-4 w-full bg-muted-foreground/10 rounded animate-pulse" />
              <div className="h-4 w-full bg-muted-foreground/10 rounded animate-pulse" />
              <div className="h-4 w-11/12 bg-muted-foreground/10 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-muted-foreground/10 rounded animate-pulse" />
            </div>
          ))}
          <div className="h-7 w-3/5 bg-muted-foreground/10 rounded-lg animate-pulse mt-8 mb-4" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-muted-foreground/10 rounded animate-pulse" />
            <div className="h-4 w-full bg-muted-foreground/10 rounded animate-pulse" />
            <div className="h-4 w-4/5 bg-muted-foreground/10 rounded animate-pulse" />
          </div>
        </div>
      }
    >
      <MarkdownRendererLazy
        content={content}
        onDeleteImage={onDeleteImage}
        {...props}
      />
    </Suspense>
  );
};

export default MarkdownRendererWrapper;
