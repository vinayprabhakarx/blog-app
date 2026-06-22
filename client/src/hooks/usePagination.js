import { useState, useMemo, useCallback } from "react";

/**
 * Custom hook for pagination state management
 * @param {Array} data - The data array to paginate
 * @param {number} initialItemsPerPage - Initial items per page
 * @param {number} initialPage - Initial page number
 */
export const usePagination = (
  data = [],
  initialItemsPerPage = 9,
  initialPage = 1
) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  // Calculate pagination values
  const paginationInfo = useMemo(() => {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = data.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      currentItems,
      startIndex,
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }, [data, currentPage, itemsPerPage]);

  // Handle page change
  const handlePageChange = useCallback(
    (page) => {
      if (page >= 1 && page <= paginationInfo.totalPages) {
        setCurrentPage(page);
      }
    },
    [paginationInfo.totalPages]
  );

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    // Reset to first page when changing items per page
    setCurrentPage(1);
  }, []);

  // Navigation functions
  const goToNextPage = useCallback(() => {
    if (paginationInfo.hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [paginationInfo.hasNextPage]);

  const goToPreviousPage = useCallback(() => {
    if (paginationInfo.hasPreviousPage) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [paginationInfo.hasPreviousPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(paginationInfo.totalPages);
  }, [paginationInfo.totalPages]);

  // Reset pagination
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setItemsPerPage(initialItemsPerPage);
  }, [initialItemsPerPage]);

  return {
    // State
    currentPage,
    itemsPerPage,

    // Computed values
    ...paginationInfo,

    // Handlers
    handlePageChange,
    handleItemsPerPageChange,

    // Navigation
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,

    // Utilities
    resetPagination,
    setCurrentPage,
    setItemsPerPage,
  };
};

/**
 * Custom hook for server-side pagination
 * @param {Object} params - Pagination parameters
 * @param {number} params.totalItems - Total number of items on server
 * @param {number} params.initialItemsPerPage - Initial items per page
 * @param {number} params.initialPage - Initial page number
 * @param {Function} params.onPageChange - Callback for page changes
 * @param {Function} params.onItemsPerPageChange - Callback for items per page changes
 */
export const useServerPagination = ({
  totalItems = 0,
  initialItemsPerPage = 9,
  initialPage = 1,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  // Calculate pagination values
  const paginationInfo = useMemo(() => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    return {
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }, [totalItems, currentPage, itemsPerPage]);

  // Handle page change
  const handlePageChange = useCallback(
    (page) => {
      if (
        page >= 1 &&
        page <= paginationInfo.totalPages &&
        page !== currentPage
      ) {
        setCurrentPage(page);
        if (onPageChange) {
          onPageChange(page);
        }
      }
    },
    [currentPage, paginationInfo.totalPages, onPageChange]
  );

  // Handle items per page change
  const handleItemsPerPageChange = useCallback(
    (newItemsPerPage) => {
      setItemsPerPage(newItemsPerPage);
      setCurrentPage(1); // Reset to first page
      if (onItemsPerPageChange) {
        onItemsPerPageChange(newItemsPerPage);
      }
    },
    [onItemsPerPageChange]
  );

  return {
    // State
    currentPage,
    itemsPerPage,

    // Computed values
    ...paginationInfo,

    // Handlers
    handlePageChange,
    handleItemsPerPageChange,

    // Utilities
    setCurrentPage,
    setItemsPerPage,
  };
};

export default usePagination;
