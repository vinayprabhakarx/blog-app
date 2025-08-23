import React from "react";

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-background z-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>

      <p className="mt-4 text-sm text-gray-700 dark:text-gray-200">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
