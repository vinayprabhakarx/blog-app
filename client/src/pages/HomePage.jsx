import React, { useEffect, useState, useCallback } from "react";
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

const HomePage = () => {
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

  const loading = blogLoading.allBlogs || categoriesLoading;

  useEffect(() => {
    dispatch(fetchAllBlogs({ page: currentPage, limit: postsPerPage }));
    dispatch(fetchAllCategories());
  }, [dispatch, currentPage]);

  const blogPagination = useSelector((state) => state.blog.allBlogsPagination);
  const totalPages = blogPagination?.totalPages || 1;
  const filteredBlogsCount = blogPagination?.totalBlogs || allBlogs.length;

  useEffect(() => {
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
  }, [dispatch, currentPage, selectedCategory, postsPerPage, categories]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  useEffect(() => {
    const pageFromUrl = parseInt(searchParams.get("page"), 10) || 1;
    const categoryFromUrl = searchParams.get("category") || "all";

    if (pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl);
    }
    if (categoryFromUrl !== selectedCategory) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams, currentPage, selectedCategory]);

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

  const updateURL = useCallback(
    (page, category) => {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set("page", page);
      if (category === "all") {
        newSearchParams.delete("category");
      } else {
        newSearchParams.set("category", category);
      }
      setSearchParams(newSearchParams);
    },
    [searchParams, setSearchParams]
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    updateURL(newPage, selectedCategory);
  };

  const handleCategorySelect = (categorySlug) => {
    setSelectedCategory(categorySlug);
    setCurrentPage(1);
    updateURL(1, categorySlug);
    setShowCategoryMenu(false);
  };

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
                  {displayCategories.map((category) => (
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

              {/* Dropdown Navigation for smaller devices (below 764px) */}
              <div className="tablet-nav:hidden">
                <div className="relative" data-dropdown>
                  <button
                    onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                    className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium bg-secondary/50 rounded-lg border border-border hover:bg-secondary/70 transition-colors touch-manipulation"
                    aria-expanded={showCategoryMenu}
                    aria-haspopup="true"
                  >
                    <span className="truncate max-w-[200px]">
                      {selectedCategory === "all"
                        ? "All Categories"
                        : categories.find(
                            (cat) => cat.slug === selectedCategory
                          )?.name || "All Categories"}
                    </span>
                    <Filter
                      className={`w-4 h-4 ml-2 transition-transform ${
                        showCategoryMenu ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {/* Mobile Category Dropdown with improved UX */}
                  {showCategoryMenu && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                      <button
                        onClick={() => handleCategorySelect("all")}
                        className={`w-full px-4 py-3 text-left text-sm hover:bg-secondary/50 transition-colors touch-manipulation first:rounded-t-lg ${
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
                      {displayCategories.map((category, index) => (
                        <button
                          key={category._id}
                          onClick={() => handleCategorySelect(category.slug)}
                          className={`w-full px-4 py-3 text-left text-sm hover:bg-secondary/50 transition-colors touch-manipulation ${
                            index === displayCategories.length - 1
                              ? "rounded-b-lg"
                              : ""
                          } ${
                            selectedCategory === category.slug
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">{category.name}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {selectedCategory === category.slug && (
                                <span className="text-xs text-primary">✓</span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </nav>
          </div>
        </div>
      </section>

      {/* Blog Posts Section - Fixed minimum height to prevent layout shift */}
      {loading ? (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-background/95 z-50">
          <LoadingSpinner size="lg" message="Loading articles..." />
        </div>
      ) : (
        <section className="py-3 sm:py-4 md:py-6 lg:py-12 min-h-[60vh]">
          <div className="container mx-auto px-6 sm:px-6">
            <div className="mb-4 sm:mb-6">
              <span className="text-xs sm:text-sm text-muted-foreground">
                {filteredBlogsCount} articles
              </span>
            </div>

            {/* Blog content will be rendered here */}
            {allBlogs.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 md:py-16 lg:py-20 min-h-[40vh]">
                <div className="text-muted-foreground text-sm sm:text-base md:text-lg mb-3 sm:mb-4 text-center px-4">
                  No articles found for this category.
                </div>
                <button
                  onClick={() => handleCategorySelect("all")}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors touch-manipulation"
                >
                  View All Articles
                </button>
              </div>
            ) : (
              <div>
                {/* Blog Grid - Fully responsive with mobile-first approach */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-14 mx-auto max-w-7xl">
                  {allBlogs.map((blog) => (
                    <div key={blog._id} className="flex w-full">
                      <BlogCard
                        blog={blog}
                        className="w-full h-full"
                        variant="default"
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination Component */}
                {!loading && allBlogs.length > 0 && (
                  <div className="mt-6 sm:mt-8 md:mt-12 lg:mt-16">
                    <Pagination
                      totalPages={totalPages}
                      currentPage={currentPage}
                      setCurrentPage={handlePageChange}
                      totalBlogs={filteredBlogsCount}
                      paginationThreshold={9}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
