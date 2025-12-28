import React from "react";
import { cn } from "@/lib/utils";

const FeaturedBlogSkeleton = ({ className }) => {
  return (
    <div className={cn("group w-full mb-8", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Image Skeleton */}
        <div className="order-1 lg:order-1 w-full flex flex-col justify-center lg:col-span-4">
          <div className="aspect-video w-full bg-muted overflow-hidden rounded-xl animate-pulse">
            <div className="h-full w-full bg-muted-foreground/10" />
          </div>
        </div>

        {/* Right Column: Content Skeleton */}
        <div className="order-2 lg:order-2 flex flex-col justify-center h-full space-y-4 lg:py-2 lg:col-span-8">
          {/* Title - Large */}
          <div className="space-y-3">
            <div className="h-8 md:h-10 w-full bg-muted-foreground/10 rounded animate-pulse" />
            <div className="h-8 md:h-10 w-3/4 bg-muted-foreground/10 rounded animate-pulse" />
          </div>

          {/* Excerpt - Multiple lines */}
          <div className="space-y-3 py-2">
            <div className="h-5 w-full bg-muted-foreground/10 rounded animate-pulse" />
            <div className="h-5 w-full bg-muted-foreground/10 rounded animate-pulse" />
            <div className="h-5 w-full bg-muted-foreground/10 rounded animate-pulse" />
            <div className="h-5 w-5/6 bg-muted-foreground/10 rounded animate-pulse" />
          </div>

          {/* Metadata */}
          <div className="flex flex-col gap-3">
             <div className="flex items-center gap-3">
                <div className="h-4 w-6 bg-muted-foreground/10 rounded animate-pulse" />
                <div className="h-4 w-32 bg-muted-foreground/10 rounded animate-pulse" />
                <div className="h-4 w-2 bg-muted-foreground/10 rounded animate-pulse" />
                <div className="h-4 w-24 bg-muted-foreground/10 rounded animate-pulse" />
             </div>
          </div>

          {/* Read More Button */}
          <div className="pt-2">
            <div className="h-5 w-32 bg-muted-foreground/10 rounded animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* Separator to match actual card */}
      <div className="w-full h-px bg-border my-12 opacity-50" />
    </div>
  );
};

export default FeaturedBlogSkeleton;
