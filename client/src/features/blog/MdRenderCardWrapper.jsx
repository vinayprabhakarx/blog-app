import React, { Suspense } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";

// Lazy load the heavy markdown component
const MdRenderCardLazy = React.lazy(() => import("./MdRenderCard"));

const MdRenderCardWrapper = ({ content, onDeleteImage, ...props }) => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[200px]">
          <LoadingSpinner size="md" message="Loading markdown renderer..." />
        </div>
      }
    >
      <MdRenderCardLazy
        content={content}
        onDeleteImage={onDeleteImage}
        {...props}
      />
    </Suspense>
  );
};

export default MdRenderCardWrapper;
