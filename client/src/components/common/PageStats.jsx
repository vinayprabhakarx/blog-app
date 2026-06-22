import React from "react";
import { cn } from "@/lib/utils";

/**
 * A standardized component for displaying page statistics in headers
 * @param {Object} props
 * @param {Array<{label: string, value: string|number, icon?: React.ReactNode, hidden?: boolean}>} props.stats - Array of stat objects
 * @param {string} props.className - Additional class names
 */
export const PageStats = ({ stats = [], className }) => {
  const visibleStats = stats.filter(stat => !stat.hidden);
  if (!visibleStats || visibleStats.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap justify-center items-center gap-2 sm:gap-4 text-sm text-muted-foreground mt-2",
        className
      )}
    >
      {visibleStats.map((stat, index) => (
        <React.Fragment key={index}>
          <span className="flex items-center gap-1">
            {stat.icon && stat.icon}
            {stat.value !== undefined && <span className="font-medium">{stat.value}</span>}
            {stat.label && <span>{stat.label}</span>}
          </span>
          {index < visibleStats.length - 1 && <span className="text-muted-foreground/50">•</span>}
        </React.Fragment>
      ))}
    </div>
  );
};
