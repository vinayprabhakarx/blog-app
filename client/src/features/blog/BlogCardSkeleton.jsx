import React from "react";
import { cn } from "@/lib/utils";

const BlogCardSkeleton = ({ className }) => {
  return (
    <div className={cn("group", className)}>
      {/* Image skeleton */}
      <div
        className={cn(
          "relative overflow-hidden bg-muted rounded-lg border border-border/50 mb-3 sm:mb-4 animate-pulse",
          "aspect-video"
        )}
      >
        <div className="h-full w-full bg-muted-foreground/10" />
      </div>

      {/* Category skeleton */}
      <div className="mb-2">
        <div className="h-3 w-20 bg-muted-foreground/10 rounded animate-pulse" />
      </div>

      {/* Content */}
      <div className="space-y-2 sm:space-y-3">
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-6 sm:h-7 w-full bg-muted-foreground/10 rounded animate-pulse" />
          <div className="h-6 sm:h-7 w-3/4 bg-muted-foreground/10 rounded animate-pulse" />
        </div>

        {/* Author and date skeleton */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Avatar */}
            <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-muted-foreground/10 animate-pulse" />
            {/* Author name */}
            <div className="h-4 w-24 bg-muted-foreground/10 rounded animate-pulse" />
          </div>
          {/* Date */}
          <div className="h-4 w-20 bg-muted-foreground/10 rounded animate-pulse" />
        </div>

        {/* Excerpt skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted-foreground/10 rounded animate-pulse" />
          <div className="h-4 w-full bg-muted-foreground/10 rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-muted-foreground/10 rounded animate-pulse" />
        </div>
      </div>

      {/* Separation line */}
      <div className="mt-4 h-0.5 bg-border/70 w-full rounded-full" />
    </div>
  );
};

export default BlogCardSkeleton;
