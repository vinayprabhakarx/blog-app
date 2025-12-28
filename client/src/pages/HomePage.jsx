import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import BlogCard from "../features/blog/BlogCard";
import BlogCardSkeleton from "../features/blog/BlogCardSkeleton";
import Pagination from "../components/common/Pagination";

import {
  fetchAllBlogs,
  searchBlogs,
  selectAllBlogs,
  selectBlogLoading,
} from "../features/blog/blogSlice";
import {
  fetchAllCategories,
  selectAllCategories,
  selectFeaturedCategories,
} from "../features/category/categoriesSlice";

const HomePage = React.memo(() => {
  const dispatch = useDispatch();
  const allBlogs = useSelector(selectAllBlogs);
  const categories = useSelector(selectAllCategories);
  const displayCategories = useSelector(selectFeaturedCategories);
  const blogLoading = useSelector(selectBlogLoading);

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  );
  const initialPage = parseInt(searchParams.get("page"), 10) || 1;
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Memoize constants to prevent recreation
  const postsPerPage = useMemo(() => 9, []);

  // Track fetch state
  const [hasFetchedCategories, setHasFetchedCategories] = useState(false);

  // Memoize pagination data
  const blogPagination = useSelector((state) => state.blog.allBlogsPagination);
  const totalPages = useMemo(
    () => blogPagination?.totalPages || 1,
    [blogPagination?.totalPages]
  );
  const filteredBlogsCount = useMemo(
    () => blogPagination?.totalBlogs || allBlogs.length,
    [blogPagination?.totalBlogs, allBlogs.length]
  );

  // Memoize URL parameter extraction
  const urlParams = useMemo(
    () => ({
      page: parseInt(searchParams.get("page"), 10) || 1,
      category: searchParams.get("category") || "all",
      search: searchParams.get("search") || "",
    }),
    [searchParams]
  );

  // Check if this is a search query
  const isSearchMode = useMemo(() => {
    return urlParams.search.trim().length > 0;
  }, [urlParams.search]);

  // Memoize selected category data
  const selectedCategoryData = useMemo(() => {
    if (selectedCategory === "all") return null;
    return categories.find((cat) => cat.slug === selectedCategory);
  }, [categories, selectedCategory]);

  // Memoize API parameters for blog fetching
  const blogFetchParams = useMemo(() => {
    const params = {
      page: currentPage,
      limit: postsPerPage,
    };
    // Only add category if not 'all'
    if (selectedCategory !== "all" && selectedCategoryData) {
      params.category = selectedCategoryData._id;
    }
    return params;
  }, [currentPage, postsPerPage, selectedCategory, selectedCategoryData]);

  // Fetch categories only once on mount
  useEffect(() => {
    if (!hasFetchedCategories) {
      dispatch(fetchAllCategories())
        .unwrap()
        .then(() => setHasFetchedCategories(true))
        .catch((error) => console.error("Failed to fetch categories:", error));
    }
  }, [dispatch, hasFetchedCategories]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted) return;

      // Handle search queries
      if (isSearchMode) {
        const searchParams = {
          page: currentPage,
          limit: postsPerPage,
        };

        dispatch(
          searchBlogs({ query: urlParams.search, params: searchParams })
        );
        return;
      }

      // Only fetch blogs if categories have been loaded
      if (!hasFetchedCategories) {
        return;
      }

      // Optimization: Skip fetch if we already have the correct data for Page 1
      // AND the loaded category matches the selected category
      if (
        allBlogs.length > 0 &&
        currentPage === 1 &&
        selectedCategory === "all" &&
        !blogLoading.allBlogs &&
        blogPagination?.currentPage === 1 &&
        blogPagination?.loadedCategory === "all"
      ) {
        return;
      }

      dispatch(fetchAllBlogs(blogFetchParams));
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [
    dispatch,
    blogFetchParams,
    isSearchMode,
    urlParams.search,
    currentPage,
    postsPerPage,
    hasFetchedCategories,
    selectedCategory,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  useEffect(() => {
    // Use memoized URL parameters
    if (urlParams.page !== currentPage) {
      setCurrentPage(urlParams.page);
    }
    if (urlParams.category !== selectedCategory) {
      setSelectedCategory(urlParams.category);
    }
  }, [urlParams, currentPage, selectedCategory]);

  const handlePageChange = useCallback(
    (newPage) => {
      // Update URL which will trigger state update via searchParams effect
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set("page", newPage);
      if (selectedCategory === "all") {
        newSearchParams.delete("category");
      } else {
        newSearchParams.set("category", selectedCategory);
      }
      setSearchParams(newSearchParams);
    },
    [searchParams, setSearchParams, selectedCategory]
  );

  const handleCategorySelect = useCallback(
    (categorySlug) => {
      // Update URL which will trigger state updates via searchParams effect
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set("page", 1); // Always reset to page 1 when changing category
      if (categorySlug === "all") {
        newSearchParams.delete("category");
      } else {
        newSearchParams.set("category", categorySlug);
      }
      setSearchParams(newSearchParams);
    },
    [searchParams, setSearchParams]
  );

  // Memoize filtered categories for display
  const filteredDisplayCategories = useMemo(() => {
    return displayCategories.filter((category) => category.articleCount > 0);
  }, [displayCategories]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Category Navigation Bar - Unified across breakpoints with horizontal scroll */}
      <section className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="w-full">
          <div className="container mx-auto px-6 sm:px-6">
            <nav className="py-2 sm:py-3">
              <div className="flex justify-center">
                <div className="flex items-center space-x-2 max-w-full overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => handleCategorySelect("all")}
                    className={`px-3 xl:px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 relative focus:outline-none focus:ring-0 hover:bg-transparent active:bg-transparent cursor-pointer border-none shadow-none flex-shrink-0 touch-manipulation ${
                      selectedCategory === "all"
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All
                    {selectedCategory === "all" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                  {/* Show only featured categories with articles */}
                  {filteredDisplayCategories.map((category) => (
                    <button
                      key={category._id}
                      onClick={() => handleCategorySelect(category.slug)}
                      className={`px-3 xl:px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 relative focus:outline-none focus:ring-0 hover:bg-transparent active:bg-transparent cursor-pointer flex-shrink-0 touch-manipulation ${
                        selectedCategory === category.slug
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {category.name}
                      {selectedCategory === category.slug && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </nav>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Search Results Header */}
        {isSearchMode && (
          <section className="mb-6">
            <div className="">
              <h1 className="text-xl font-semibold text-foreground mb-2">
                Search Results for "{urlParams.search}"
              </h1>
              <p className="text-sm text-muted-foreground">
                {blogLoading.allBlogs
                  ? "Searching..."
                  : `Found ${filteredBlogsCount} ${
                      filteredBlogsCount === 1 ? "article" : "articles"
                    } matching your query`}
              </p>
            </div>
          </section>
        )}

        {/* Blog Grid */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogLoading.allBlogs ? (
              // Show skeleton loaders while loading
              Array.from({ length: postsPerPage }).map((_, index) => (
                <BlogCardSkeleton key={`skeleton-${index}`} />
              ))
            ) : (
              // Show actual blog cards when loaded
              allBlogs.map((blog) => <BlogCard key={blog._id} blog={blog} />)
            )}
          </div>
        </section>

        {/* No Articles Found */}
        {allBlogs.length === 0 && !blogLoading.allBlogs ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {isSearchMode
                ? `No articles found matching "${urlParams.search}". Try different keywords or check the spelling.`
                : selectedCategory !== "all"
                ? "No published articles found in this category yet."
                : "No articles available yet."}
            </p>
            {(isSearchMode || selectedCategory !== "all") && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    const newSearchParams = new URLSearchParams(searchParams);
                    if (isSearchMode) newSearchParams.delete("search");
                    if (selectedCategory !== "all")
                      newSearchParams.delete("category");
                    setSearchParams(newSearchParams);
                  }}
                  className="text-sm text-primary hover:text-primary/80 underline transition-colors"
                >
                  Browse all articles
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* Pagination Component */}
        {allBlogs.length > 0 && !blogLoading.allBlogs && (
          <div className="flex justify-center mt-8 px-2 sm:px-0">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={handlePageChange}
              totalBlogs={filteredBlogsCount}
              paginationThreshold={postsPerPage}
            />
          </div>
        )}
      </main>
    </div>
  );
});

HomePage.displayName = "HomePage";

export default HomePage;
