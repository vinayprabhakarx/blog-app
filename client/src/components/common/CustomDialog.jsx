import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon } from "lucide-react";
import { cn } from "@/utils/utils";

/**
 * CustomDialog - A robust replacement for Shadcn Dialog
 * Immune to Tailwind cascade layer bugs by accepting strict maxWidth strings.
 */
export function CustomDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "28rem",
  className,
  showCloseButton = true,
  align = "center",
}) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen && typeof window === 'undefined') return null;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog Container */}
          <div 
            className={cn(
              "fixed inset-0 z-50 flex p-4 pointer-events-none",
              align === "center" ? "items-center justify-center" : "items-start justify-center pt-[15vh] sm:pt-[20vh]"
            )}
          >
            {/* Dialog Content */}
            <motion.div
              initial={align === "center" ? { opacity: 0, scale: 0.95, y: 10 } : { opacity: 0, scale: 0.96 }}
              animate={align === "center" ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, scale: 1 }}
              exit={align === "center" ? { opacity: 0, scale: 0.95, y: 10 } : { opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              style={{ maxWidth: maxWidth }}
              className={cn(
                "w-full bg-background border border-border shadow-xl rounded-xl p-6 pointer-events-auto flex flex-col gap-4 relative max-h-[calc(100vh-2rem)] overflow-y-auto",
                className
              )}
              role="dialog"
              aria-modal="true"
            >
              {/* Close Button */}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 rounded-md opacity-70 hover:opacity-100 hover:bg-accent focus:outline-hidden focus:ring-2 focus:ring-ring transition-colors"
                  aria-label="Close dialog"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}

              {/* Header */}
              {(title || description) && (
                <div className="flex flex-col gap-1.5 text-center sm:text-left pr-6">
                  {title && (
                    <h2 className="text-lg font-semibold leading-none tracking-tight">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  )}
                </div>
              )}

              {/* Body */}
              <div className="flex-1 w-full">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? ReactDOM.createPortal(content, document.body) : content;
}

export function CustomDialogFooter({ children, className }) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-2",
        className
      )}
    >
      {children}
    </div>
  );
}
