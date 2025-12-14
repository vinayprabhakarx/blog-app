import React, { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "../ui/input";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import blogService from "../../features/blog/blogsService";
import { showToast } from "../../utils/showToast";

const SearchBar = React.memo(() => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchCache, setSearchCache] = useState(new Map());
  const navigate = useNavigate();

  // Refs for cleanup and optimization
  const debounceTimeoutRef = useRef(null);
  const throttleTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const lastSearchTimeRef = useRef(0);
  const searchCountRef = useRef(0);

  // Configuration constants
  const DEBOUNCE_DELAY = 300;
  const THROTTLE_DELAY = 100;
  const MIN_SEARCH_LENGTH = 2;
  const MAX_REQUESTS_PER_MINUTE = 30;
  const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
  const REQUEST_TIMEOUT = 10000; // 10 seconds

  // Cleanup function
  const cleanup = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
      throttleTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Rate limiting check
  const isRateLimited = useCallback(() => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Reset counter if it's been more than a minute
    if (lastSearchTimeRef.current < oneMinuteAgo) {
      searchCountRef.current = 0;
    }

    return searchCountRef.current >= MAX_REQUESTS_PER_MINUTE;
  }, []);

  // Cache management
  const getCachedResult = useCallback(
    (query) => {
      const cached = searchCache.get(query.toLowerCase());
      if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
        return cached.data;
      }
      return null;
    },
    [searchCache, CACHE_EXPIRY]
  );

  const setCachedResult = useCallback((query, data) => {
    setSearchCache((prev) => {
      const newCache = new Map(prev);
      // Limit cache size to 50 entries
      if (newCache.size >= 50) {
        const firstKey = newCache.keys().next().value;
        newCache.delete(firstKey);
      }
      newCache.set(query.toLowerCase(), {
        data,
        timestamp: Date.now(),
      });
      return newCache;
    });
  }, []);

  // Load top blogs when component mounts or when search is cleared
  const loadTopBlogs = useCallback(async () => {
    try {
      const cachedTopBlogs = getCachedResult("__top_blogs__");
      if (cachedTopBlogs) {
        setSearchResults(cachedTopBlogs);
        setShowResults(true);
        return;
      }

      const response = await blogService.getTopBlogs(5);
      const results = response.blogs || [];
      setSearchResults(results);
      setShowResults(true);

      // Cache top blogs
      setCachedResult("__top_blogs__", results);
    } catch (error) {
      console.error("Error loading top blogs:", error);
    }
  }, [getCachedResult, setCachedResult]);

  // Enhanced search function with error handling and caching
  const performSearch = useCallback(
    async (query, signal) => {
      const trimmedQuery = query.trim();

      if (!trimmedQuery || trimmedQuery.length < MIN_SEARCH_LENGTH) {
        // Load top blogs when search is cleared
        loadTopBlogs();
        return;
      }

      // Check rate limiting
      if (isRateLimited()) {
        showToast("error", "Too many search requests. Please wait a moment.");
        return;
      }

      // Check cache first
      const cachedResult = getCachedResult(trimmedQuery);
      if (cachedResult) {
        setSearchResults(cachedResult);
        setShowResults(true);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        searchCountRef.current++;
        lastSearchTimeRef.current = Date.now();

        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error("Request timeout")),
            REQUEST_TIMEOUT
          );
        });

        // Try advanced search first, fallback to regular search
        let searchPromise;
        try {
          searchPromise = blogService.advancedSearch(trimmedQuery, {
            limit: 5,
          });
        } catch {
          searchPromise = blogService.search(trimmedQuery, { limit: 5 });
        }
        const response = await Promise.race([searchPromise, timeoutPromise]);

        // Check if request was aborted
        if (signal?.aborted) {
          return;
        }

        const results = response.blogs || [];
        setSearchResults(results);
        setShowResults(true);

        // Cache the result
        setCachedResult(trimmedQuery, results);
      } catch (error) {
        if (error.name === "AbortError" || signal?.aborted) {
          return; // Request was intentionally aborted
        }

        console.error("Search error:", error);

        if (error.message === "Request timeout") {
          showToast("error", "Search request timed out. Please try again.");
        } else {
          showToast("error", "Search failed. Please try again.");
        }

        setSearchResults([]);
        setShowResults(false);
      } finally {
        setIsSearching(false);
      }
    },
    [isRateLimited, getCachedResult, setCachedResult, loadTopBlogs]
  );

  // Debounced search handler
  const debouncedSearch = useCallback(
    (query) => {
      // Clear existing timeouts
      cleanup();

      if (!query.trim() || query.trim().length < MIN_SEARCH_LENGTH) {
        loadTopBlogs();
        return;
      }

      debounceTimeoutRef.current = setTimeout(() => {
        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();
        performSearch(query, abortControllerRef.current.signal);
      }, DEBOUNCE_DELAY);
    },
    [performSearch, cleanup, loadTopBlogs]
  );

  // Simplified input change handler
  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchQuery(value);

      // Show results dropdown immediately when typing
      setShowResults(true);

      // Use the debounced search function
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  // Enhanced result click handler
  const handleResultClick = useCallback(
    (blog) => {
      // Clean up any pending searches
      cleanup();

      navigate(`/blog/${blog.slug}`);
      setSearchQuery("");
      setShowResults(false);
      setSearchResults([]);
    },
    [navigate, cleanup]
  );

  // Enhanced clear search handler
  const handleClearSearch = useCallback(() => {
    cleanup();
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  }, [cleanup]);

  // Form submit handler - navigate to home page with search results
  const handleFormSubmit = useCallback(
    (e) => {
      e.preventDefault();

      const trimmedQuery = searchQuery.trim();
      if (trimmedQuery.length >= MIN_SEARCH_LENGTH) {
        // Navigate to home page with search query
        cleanup();
        setShowResults(false);
        navigate(`/?search=${encodeURIComponent(trimmedQuery)}`);
      }
    },
    [searchQuery, navigate, cleanup]
  );

  // Handle input focus - don't show anything by default
  const handleInputFocus = useCallback(() => {
    // Only show results if there's existing search query or results
    if (searchQuery.trim() && searchResults.length > 0) {
      setShowResults(true);
    }
  }, [searchQuery, searchResults.length]);

  // Don't load top blogs on component mount

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Hide results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest("[data-search-container]")) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" data-search-container>
      <form onSubmit={handleFormSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search blogs..."
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            className="h-9 pl-10 pr-10 rounded-full bg-muted border border-border shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-muted-foreground">
              Searching...
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No blogs found for "{searchQuery}"
            </div>
          ) : (
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {searchQuery.trim()
                  ? `Search Results (${searchResults.length})`
                  : `Top Blogs (${searchResults.length})`}
              </div>
              {searchResults.slice(0, 8).map((blog) => (
                <button
                  key={blog._id}
                  onClick={() => handleResultClick(blog)}
                  className="w-full px-3 py-3 text-left hover:bg-accent transition-colors cursor-pointer border-none bg-transparent"
                >
                  <div className="flex items-start gap-3">
                    {blog.banner && (
                      <img
                        src={
                          blog.banner.startsWith("http")
                            ? blog.banner
                            : `${
                                import.meta.env.VITE_API_BASE_URL ||
                                "http://localhost:5000"
                              }/${blog.banner}`
                        }
                        alt={blog.title}
                        className="w-12 h-12 object-cover rounded flex-shrink-0"
                        onError={(e) => (e.target.style.display = "none")}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-1 mb-1">
                        {blog.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {blog.content
                          ?.replace(/<[^>]*>/g, "")
                          .substring(0, 100)}
                        ...
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {blog.category?.name}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(blog.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {searchResults.length > 8 && (
                <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t">
                  Showing first 8 results. Refine your search for more specific
                  results.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

SearchBar.displayName = "SearchBar";

export default SearchBar;
