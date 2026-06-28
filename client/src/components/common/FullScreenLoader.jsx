import React from "react";
import LoadingSpinner from "./LoadingSpinner";

const FullScreenLoader = ({ message = "Loading..." }) => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" message={message} />
    </div>
  );
};

export default FullScreenLoader;
