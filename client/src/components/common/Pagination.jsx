import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

const Pagination = ({
  totalPages,
  currentPage,
  setCurrentPage,
  totalBlogs,
  paginationThreshold = 9,
}) => {
  // Only show pagination if more than threshold blogs
  if (totalBlogs <= paginationThreshold || totalPages <= 1) return null;

  // Input validation to prevent crashes
  const validCurrentPage = Math.max(1, Math.min(currentPage || 1, totalPages));

  // Generate page numbers with smart truncation
  const generatePageNumbers = () => {
    let pages = [];

    if (totalPages <= 5) {
      // Show all pages if 5 or fewer
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else if (validCurrentPage <= 3) {
      // Show first 5 pages when current is in first 3
      pages = [1, 2, 3, 4, 5];
    } else if (validCurrentPage >= totalPages - 2) {
      // Show last 5 pages when current is in last 3
      pages = [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    } else {
      // Show current page centered with 2 pages on each side
      pages = [
        validCurrentPage - 2,
        validCurrentPage - 1,
        validCurrentPage,
        validCurrentPage + 1,
        validCurrentPage + 2,
      ];
    }

    return pages;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== validCurrentPage) {
      setCurrentPage(page);
    }
  };

  return (
    <nav className="flex items-center justify-center mt-16 mb-8" aria-label="Pagination">
      <div className="flex items-center gap-0.5 sm:gap-1">
        {/* Left Arrow - Only show if not on first page */}
        {validCurrentPage > 1 && (
          <button
            onClick={() => handlePageChange(validCurrentPage - 1)}
            className="p-1.5 sm:p-2 rounded-full transition-all duration-200 text-foreground hover:bg-muted cursor-pointer"
            aria-label="Previous page"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Page Numbers */}
        {generatePageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm transition-all duration-200 rounded-md cursor-pointer ${
              validCurrentPage === page
                ? "font-extrabold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                : "text-foreground hover:bg-muted"
            }`}
          >
            {page}
          </button>
        ))}

        {/* Right Arrow - Only show if not on last page */}
        {validCurrentPage < totalPages && (
          <button
            onClick={() => handlePageChange(validCurrentPage + 1)}
            className="p-1.5 sm:p-2 rounded-full transition-all duration-200 text-foreground hover:bg-muted cursor-pointer"
            aria-label="Next page"
          >
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>
    </nav>
  );
};

export default Pagination;
