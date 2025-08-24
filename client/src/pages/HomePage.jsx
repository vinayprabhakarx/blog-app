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
import LoadingSpinner from "../components/common/LoadingSpinner";

import {
  fetchAllBlogs,
  selectAllBlogs,
  selectBlogLoading,
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
  const postsPerPage = 9;

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

  useEffect(() => {
    // Fetch categories only once on mount
    dispatch(fetchAllCategories());
  }, [dispatch]);

  useEffect(() => {
    // Only fetch blogs if categories have been loaded
    if (!hasFetchedCategoriesRef.current && categories.length === 0) {
      return; // Wait for categories to load first
    }

    // Mark categories as fetched
    if (categories.length > 0) {
      hasFetchedCategoriesRef.current = true;
    }

    // Fetch blogs with current parameters
    const params = {
      page: currentPage,
      limit: postsPerPage,
    };

    if (selectedCategory !== "all") {
      const categoryData = categories.find(
        (cat) => cat.slug === selectedCategory
      );
      if (categoryData) {
        params.category = categoryData._id;
      }
    }

    dispatch(fetchAllBlogs(params));
  }, [
    dispatch,
    currentPage,
    selectedCategory,
    postsPerPage,
    categories,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  useEffect(() => {
    const pageFromUrl = parseInt(searchParams.get("page"), 10) || 1;
    const categoryFromUrl = searchParams.get("category") || "all";

    // Only update state if the URL values are different from current state
    if (pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl);
    }
    if (categoryFromUrl !== selectedCategory) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams]); // Remove currentPage and selectedCategory from dependencies

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCategoryMenu && !event.target.closest("[data-dropdown]")) {
        setShowCategoryMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCategoryMenu]);

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

  // Show loading spinner while data is being fetched
  if (blogLoading.allBlogs || categoriesLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex justify-center items-center min-h-[50vh]">
          <LoadingSpinner size="lg" message="Loading content..." />
        </div>
      </div>
    );
  }

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
                  <span>
                    {selectedCategory === "all"
                      ? "All Categories"
                      : categories.find((cat) => cat.slug === selectedCategory)
                          ?.name || "Select Category"}
                  </span>
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
        {/* Blog Grid */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allBlogs.map((blog) => (
              <BlogCard key={blog._id} blog={blog} />
            ))}
          </div>
        </section>

        {/* No Articles Found */}
        {allBlogs.length === 0 && !blogLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No articles found for the selected category.
            </p>
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
