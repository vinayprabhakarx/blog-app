import React from "react";
import { Button } from "../../components/ui/button";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const LoadingButton = ({
  isLoading = false,
  loadingText = "Loading...",
  children,
  disabled,
  onClick,
  type,
  ...props
}) => {
  const handleClick = (e) => {
    // Prevent click if loading
    if (isLoading) {
      e.preventDefault();
      return;
    }

    // Call the original onClick if provided
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Button
      {...props}
      type={type}
      disabled={isLoading || disabled}
      onClick={handleClick}
      className={`${props.className || ""} ${
        isLoading ? "cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <AiOutlineLoading3Quarters className="animate-spin w-4 h-4" />
          {loadingText}
        </div>
      ) : (
        children
      )}
    </Button>
  );
};

export default LoadingButton;
