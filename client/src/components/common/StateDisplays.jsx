import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "./LoadingSpinner";

export const EmptyState = ({
  icon: Icon = FolderOpen,
  title = "No Data Found",
  description = "We couldn't find any items matching your criteria. Please try adjusting your filters or creating a new item.",
  action,
  variant = "full", // "full" or "compact"
  className = "",
}) => {
  const containerClasses = variant === "compact" 
    ? "min-h-[12.5rem] p-6" 
    : "min-h-[18.75rem] sm:min-h-[25rem] p-8 sm:p-12";
    
  const iconClasses = variant === "compact"
    ? "mb-4"
    : "mb-6";
    
  const iconSize = variant === "compact" ? "w-8 h-8" : "w-12 h-12";
  const titleClasses = variant === "compact" ? "text-lg" : "text-xl sm:text-2xl";
  const descClasses = variant === "compact" ? "text-sm mb-4" : "text-sm sm:text-base mb-8";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center text-center ${containerClasses} ${className}`}
    >
      <div className={`${iconClasses} flex items-center justify-center`}>
        <Icon className={`${iconSize} text-primary`} strokeWidth={1.5} />
      </div>
      <h3 className={`${titleClasses} font-bold tracking-tight mb-2 text-foreground`}>
        {title}
      </h3>
      <p className={`text-muted-foreground max-w-md mx-auto leading-relaxed ${descClasses}`}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </motion.div>
  );
};

export const ErrorState = ({
  title = "Something went wrong",
  message = "An unexpected error occurred while fetching data. Please try again later.",
  onRetry,
  variant = "full", // "full" or "compact"
  className = "",
}) => {
  const containerClasses = variant === "compact" 
    ? "min-h-[12.5rem] p-6" 
    : "min-h-[18.75rem] sm:min-h-[25rem] p-8 sm:p-12";
    
  const iconClasses = variant === "compact"
    ? "mb-4"
    : "mb-6";
    
  const iconSize = variant === "compact" ? "w-8 h-8" : "w-12 h-12";
  const titleClasses = variant === "compact" ? "text-lg" : "text-xl sm:text-2xl";
  const descClasses = variant === "compact" ? "text-sm mb-4" : "text-sm sm:text-base mb-8";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center text-center ${containerClasses} ${className}`}
    >
      <div className={`${iconClasses} flex items-center justify-center`}>
        <AlertTriangle className={`${iconSize} text-destructive`} strokeWidth={1.5} />
      </div>
      <h3 className={`${titleClasses} font-bold tracking-tight mb-2 text-foreground`}>
        {title}
      </h3>
      <p className={`text-muted-foreground max-w-md mx-auto leading-relaxed ${descClasses}`}>
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="destructive" size={variant === "compact" ? "sm" : "default"} className="gap-2 shadow-sm">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      )}
    </motion.div>
  );
};

export const LoadingState = ({ message = "Loading...", variant = "full", className = "" }) => {
  const containerClasses = variant === "compact" 
    ? "min-h-[12.5rem] p-6" 
    : "min-h-[18.75rem] sm:min-h-[25rem] p-8";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`flex items-center justify-center ${containerClasses} ${className}`}
    >
      <LoadingSpinner size={variant === "compact" ? "sm" : "md"} message={message} />
    </motion.div>
  );
};
