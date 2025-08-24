import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { Filter } from "lucide-react";
import BlogCard from "../features/blog/BlogCard";
import Pagination from "../components/common/Pagination";

import {
  fetchAllBlogs,
  searchBlogs,
  selectAllBlogs,
  selectBlogLoading,
  selectBlogFilters,
} from "../features/blog/blogSlice";
import {
  fetchAllCategories,
  selectAllCategories,
  selectFeaturedCategories,
  selectCategoriesLoading,
} from "../features/category/categoriesSlice";

const HomePage = React.memo(() => {
  const dispatch = useDispatch();
  const allBlogs = useSelector(selectAllBlogs);
  const categories = useSelector(selectAllCategories);
  const displayCategories = useSelector(selectFeaturedCategories);
  const blogLoading = useSelector(selectBlogLoading);
  const categoriesLoading = useSelector(selectCategoriesLoading);

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  );
  const initialPage = parseInt(searchParams.get("page"), 10) || 1;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  // Memoize constants to prevent recreation
  const postsPerPage = useMemo(() => 9, []);

  // Memoize refs to prevent recreation
  const hasFetchedCategoriesRef = useRef(false);

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

    if (selectedCategoryData) {
      params.category = selectedCategoryData._id;
    }

    return params;
  }, [currentPage, postsPerPage, selectedCategoryData]);

  useEffect(() => {
    // Fetch categories only once on mount
    dispatch(fetchAllCategories());
  }, [dispatch]);

  useEffect(() => {
    // Handle search queries
    if (isSearchMode) {
      const searchParams = {
        page: currentPage,
        limit: postsPerPage,
      };
      
      dispatch(searchBlogs({ query: urlParams.search, params: searchParams }));
      return;
    }

    // Only fetch blogs if categories have been loaded
    if (!hasFetchedCategoriesRef.current && categories.length === 0) {
      return; // Wait for categories to load first
    }

    // Mark categories as fetched
    if (categories.length > 0) {
      hasFetchedCategoriesRef.current = true;
    }

    // Use memoized parameters for blog fetching
    dispatch(fetchAllBlogs(blogFetchParams));
  }, [dispatch, blogFetchParams, categories, isSearchMode, urlParams.search, currentPage, postsPerPage]);

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

  // Memoize click outside handler
  const handleClickOutside = useCallback(
    (event) => {
      if (showCategoryMenu && !event.target.closest("[data-dropdown]")) {
        setShowCategoryMenu(false);
      }
    },
    [showCategoryMenu]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  // Simplified pagination handler - no need to update URL since it's handled by state sync
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
      setShowCategoryMenu(false);
    },
    [searchParams, setSearchParams]
  );

  const toggleCategoryMenu = useCallback(() => {
    setShowCategoryMenu((prev) => !prev);
  }, []);

  // Memoize filtered categories for display
  const filteredDisplayCategories = useMemo(() => {
    return displayCategories.filter((category) => category.articleCount > 0);
  }, [displayCategories]);

  // Memoize selected category display name for mobile dropdown
  const selectedCategoryDisplayName = useMemo(() => {
    if (selectedCategory === "all") return "All Categories";
    return selectedCategoryData?.name || "Select Category";
  }, [selectedCategory, selectedCategoryData]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Category Navigation Bar - Fully responsive with mobile-first approach */}
      <section className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="w-full">
          <div className="container mx-auto px-6 sm:px-6">
            <nav className="py-2 sm:py-3">
              {/* Centered Navigation for larger devices (764px and above) - Horizontal scrollable */}
              <div className="hidden tablet-nav:flex justify-center">
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

              {/* Mobile Category Dropdown (below 764px) */}
              <div className="tablet-nav:hidden flex justify-center relative">
                <button
                  onClick={toggleCategoryMenu}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-secondary/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background touch-manipulation"
                  data-dropdown
                >
                  <Filter className="w-4 h-4" />
                  <span>{selectedCategoryDisplayName}</span>
                </button>
                {showCategoryMenu && (
                  <div
                    className="absolute top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-20"
                    data-dropdown
                  >
                    <div className="py-1">
                      <button
                        onClick={() => handleCategorySelect("all")}
                        className={`w-full px-4 py-3 text-left text-sm hover:bg-secondary/50 transition-colors rounded-t-lg touch-manipulation ${
                          selectedCategory === "all"
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground"
                        }`}
                      >
                        All Categories
                        {selectedCategory === "all" && (
                          <span className="text-xs text-primary ml-2">✓</span>
                        )}
                      </button>
                      {/* Show only featured categories with articles */}
                      {filteredDisplayCategories.map((category, index) => (
                        <button
                          key={category._id}
                          onClick={() => handleCategorySelect(category.slug)}
                          className={`w-full px-4 py-3 text-left text-sm hover:bg-secondary/50 transition-colors touch-manipulation ${
                            selectedCategory === category.slug
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-foreground"
                          } ${
                            index === filteredDisplayCategories.length - 1
                              ? "rounded-b-lg"
                              : ""
                          }`}
                        >
                          {category.name}
                          {selectedCategory === category.slug && (
                            <span className="text-xs text-primary ml-2">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                  : `Found ${filteredBlogsCount} ${filteredBlogsCount === 1 ? 'article' : 'articles'} matching your query`
                }
              </p>
            </div>
          </section>
        )}
        
        {/* Blog Grid */}
        <section className="mb-8">
          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300 ${
              blogLoading.allBlogs
                ? "opacity-50 pointer-events-none"
                : "opacity-100"
            }`}
          >
            {allBlogs.map((blog) => (
              <BlogCard key={blog._id} blog={blog} />
            ))}
          </div>
        </section>

        {/* No Articles Found */}
        {allBlogs.length === 0 && !blogLoading.allBlogs ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {isSearchMode 
                ? `No articles found matching "${urlParams.search}". Try different keywords or check the spelling.`
                : "No articles found for the selected category."
              }
            </p>
            {isSearchMode && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    const newSearchParams = new URLSearchParams(searchParams);
                    newSearchParams.delete('search');
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
        {allBlogs.length > 0 && (
          <div className="flex justify-center mt-8">
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
