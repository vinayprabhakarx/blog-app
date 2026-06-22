import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, X, Loader2, Clock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import blogService from "@/features/blog/blogsService";

// Custom event for closing mobile search from SearchBar
const CLOSE_MOBILE_SEARCH_EVENT = "closeMobileSearch";

const SearchBar = React.memo(({ onResultClick } = {}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showRecent, setShowRecent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Refs for optimization
  const debounceTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const searchCountRef = useRef(0);
  const lastSearchTimeRef = useRef(0);
  const pendingRequestRef = useRef(null);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // LRU Cache with Map
  const cacheRef = useRef(new Map());

  // Configuration
  const CONFIG = useMemo(() => ({
    DEBOUNCE_DELAY: 500,
    MIN_SEARCH_LENGTH: 3,
    MAX_REQUESTS_PER_MINUTE: 60,
    CACHE_SIZE: 100,
    CACHE_EXPIRY: 5 * 60 * 1000,
    STALE_TIME: 30 * 1000,
    REQUEST_TIMEOUT: 5000,
    MAX_RECENT_SEARCHES: 5,
  }), []);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("recentSearches");
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Clear search bar when route changes (e.g., clicking logo)
  // Clear search bar when route changes
  useEffect(() => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    setShowRecent(false);
    setIsSearching(false);
    setSelectedIndex(-1);
  }, [location]);

  // Save search to recent searches
  const saveToRecentSearches = useCallback((query) => {
    const trimmed = query.trim();
    if (trimmed.length < CONFIG.MIN_SEARCH_LENGTH) return;
    
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, CONFIG.MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem("recentSearches", JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      return updated;
    });
  }, [CONFIG.MIN_SEARCH_LENGTH, CONFIG.MAX_RECENT_SEARCHES]);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("recentSearches");
    } catch {
      // Ignore localStorage errors
    }
    setShowRecent(false);
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    pendingRequestRef.current = null;
  }, []);

  // Rate limiting
  const isRateLimited = useCallback(() => {
    const now = Date.now();
    if (now - lastSearchTimeRef.current > 60000) {
      searchCountRef.current = 0;
    }
    return searchCountRef.current >= CONFIG.MAX_REQUESTS_PER_MINUTE;
  }, [CONFIG.MAX_REQUESTS_PER_MINUTE]);

  // LRU Cache operations
  const getFromCache = useCallback((query) => {
    const key = query.toLowerCase().trim();
    const cached = cacheRef.current.get(key);
    
    if (!cached) return null;

    const now = Date.now();
    const isExpired = now - cached.timestamp > CONFIG.CACHE_EXPIRY;
    const isStale = now - cached.timestamp > CONFIG.STALE_TIME;

    if (isExpired) {
      cacheRef.current.delete(key);
      return null;
    }

    // Move to end (most recently used)
    cacheRef.current.delete(key);
    cacheRef.current.set(key, cached);

    return { data: cached.data, isStale };
  }, [CONFIG.CACHE_EXPIRY, CONFIG.STALE_TIME]);

  const setInCache = useCallback((query, data) => {
    const key = query.toLowerCase().trim();
    
    while (cacheRef.current.size >= CONFIG.CACHE_SIZE) {
      const firstKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(firstKey);
    }

    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
    });
  }, [CONFIG.CACHE_SIZE]);

  // Core search function using Redux with timeout
  const performSearch = useCallback(async (query, options = {}) => {
    const { backgroundRefresh = false } = options;
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < CONFIG.MIN_SEARCH_LENGTH) {
      if (!backgroundRefresh) {
        setSearchResults([]);
        setShowResults(false);
      }
      return;
    }

    // Check for duplicate in-flight request
    if (pendingRequestRef.current === trimmedQuery && !backgroundRefresh) {
      return;
    }

    // Rate limiting
    if (isRateLimited()) {
      return;
    }

    // Create new abort controller
    if (!backgroundRefresh) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      pendingRequestRef.current = trimmedQuery;
      setIsSearching(true);
    }

    try {
      searchCountRef.current++;
      lastSearchTimeRef.current = Date.now();

      // Create timeout promise for 5 second timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), CONFIG.REQUEST_TIMEOUT);
      });

      // Use direct API call to prevent home page updates during typing
      const searchPromise = blogService.advancedSearch(trimmedQuery, { limit: 8 });
      const response = await Promise.race([searchPromise, timeoutPromise]);

      // Check if this request is still relevant
      if (!backgroundRefresh && pendingRequestRef.current !== trimmedQuery) {
        return;
      }

      const results = response.blogs || [];
      
      // Update cache
      setInCache(trimmedQuery, results);

      // Update UI only for non-background requests
      if (!backgroundRefresh) {
        setSearchResults(results);
        setShowResults(true);
        setShowRecent(false);
      }
    } catch {
      // Handle timeout or other errors silently
      if (!backgroundRefresh) {
        setSearchResults([]);
      }
    } finally {
      if (!backgroundRefresh) {
        setIsSearching(false);
        pendingRequestRef.current = null;
      }
    }
  }, [CONFIG.MIN_SEARCH_LENGTH, CONFIG.REQUEST_TIMEOUT, isRateLimited, setInCache]);

  // Debounced search with stale-while-revalidate
  const handleSearch = useCallback((query) => {
    const trimmedQuery = query.trim();

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (trimmedQuery.length < CONFIG.MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    // Check cache first (instant results)
    const cached = getFromCache(trimmedQuery);
    if (cached) {
      setSearchResults(cached.data);
      setShowResults(true);
      setShowRecent(false);
      setIsSearching(false);

      // Background refresh if stale
      if (cached.isStale) {
        performSearch(trimmedQuery, { backgroundRefresh: true });
      }
      return;
    }

    // Show loading state immediately
    setIsSearching(true);
    setShowResults(true);
    setShowRecent(false);

    // Debounced API call
    debounceTimeoutRef.current = setTimeout(() => {
      performSearch(trimmedQuery);
    }, CONFIG.DEBOUNCE_DELAY);
  }, [CONFIG, getFromCache, performSearch]);

  // Input change handler
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedIndex(-1);
    handleSearch(value);
  }, [handleSearch]);

  // Close mobile search helper
  const closeMobileSearch = useCallback(() => {
    window.dispatchEvent(new CustomEvent(CLOSE_MOBILE_SEARCH_EVENT));
    if (onResultClick) onResultClick();
  }, [onResultClick]);

  // Result click handler
  const handleResultClick = useCallback((blog) => {
    saveToRecentSearches(searchQuery);
    cleanup();
    navigate(`/blog/${blog.slug}`);
    setSearchQuery("");
    setShowResults(false);
    setShowRecent(false);
    setSearchResults([]);
    setSelectedIndex(-1);
    closeMobileSearch();
  }, [navigate, cleanup, searchQuery, saveToRecentSearches, closeMobileSearch]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    // Handle recent searches navigation
    if (showRecent && recentSearches.length > 0 && !showResults) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev < recentSearches.length - 1 ? prev + 1 : prev
          );
          return;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          return;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && recentSearches[selectedIndex]) {
            setSearchQuery(recentSearches[selectedIndex]);
            handleSearch(recentSearches[selectedIndex]);
          } else if (searchQuery.trim().length >= CONFIG.MIN_SEARCH_LENGTH) {
            saveToRecentSearches(searchQuery);
            cleanup();
            setIsSearching(false);
            setShowResults(false);
            setShowRecent(false);
            closeMobileSearch();
            navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
          }
          return;
        case "Escape":
          setShowRecent(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          return;
      }
    }

    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          handleResultClick(searchResults[selectedIndex]);
        } else if (searchQuery.trim().length >= CONFIG.MIN_SEARCH_LENGTH) {
          saveToRecentSearches(searchQuery);
          cleanup();
          setIsSearching(false);
          setShowResults(false);
          closeMobileSearch();
          navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
        }
        break;
      case "Escape":
        setShowResults(false);
        setShowRecent(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [showResults, showRecent, searchResults, recentSearches, selectedIndex, searchQuery, CONFIG.MIN_SEARCH_LENGTH, cleanup, navigate, handleSearch, handleResultClick, saveToRecentSearches, closeMobileSearch]);


  // Recent search click handler
  const handleRecentClick = useCallback((query) => {
    setSearchQuery(query);
    handleSearch(query);
    setShowRecent(false);
  }, [handleSearch]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    cleanup();
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    setShowRecent(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, [cleanup]);

  // Form submit
  const handleFormSubmit = useCallback((e) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length >= CONFIG.MIN_SEARCH_LENGTH) {
      saveToRecentSearches(trimmedQuery);
      cleanup();
      setIsSearching(false);
      setShowResults(false);
      setShowRecent(false);
      closeMobileSearch();
      navigate(`/?search=${encodeURIComponent(trimmedQuery)}`);
    }
  }, [searchQuery, CONFIG.MIN_SEARCH_LENGTH, navigate, cleanup, saveToRecentSearches, closeMobileSearch]);

  // Focus handler - show recent searches if available and no results shown
  const handleInputFocus = useCallback(() => {
    if (searchQuery.trim() && searchResults.length > 0) {
      setShowResults(true);
      setShowRecent(false); // Ensure only one is shown
    } else if (recentSearches.length > 0) {
      setShowRecent(true);
      setShowResults(false);
      setSelectedIndex(-1);
    }
  }, [searchQuery, searchResults.length, recentSearches.length]);

  // Global keyboard shortcut (/ or Ctrl+K to focus search)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ignore if typing in an input, textarea, or contenteditable
      const target = e.target;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // "/" key to focus search
      if (e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest("[data-search-container]")) {
        setShowResults(false);
        setShowRecent(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex + 1];
      selectedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Expose focus method for external use
  // focusInput is available for external use if needed via ref
  // const focusInput = useCallback(() => {
  //   inputRef.current?.focus();
  // }, []);

  // Auto-focus only when opened as mobile search (onResultClick prop is passed)
  useEffect(() => {
    if (onResultClick) {
      // Short delay to ensure DOM is ready
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [onResultClick]);

  return (
    <div className="relative w-full" data-search-container>
      <form onSubmit={handleFormSubmit} className="relative">
        <div className="relative">
          {isSearching ? (
            <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
          <Input
            ref={inputRef}
            placeholder={onResultClick ? "Search blogs..." : "Press / or Ctrl+K to search"}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onClick={handleInputFocus}
            onKeyDown={handleKeyDown}
            className="h-9 pl-10 pr-10 rounded-full bg-muted border border-border focus:border-primary focus:outline-none focus:ring-0"
            autoComplete="off"
            spellCheck="false"
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

      {/* Recent Searches Dropdown */}
      {showRecent && recentSearches.length > 0 && (
        <div 
          ref={resultsRef}
          className="fixed md:absolute top-16 md:top-full left-0 right-0 md:mt-2 bg-background border-b md:border border-border md:rounded-md shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Recent Searches
            </span>
            <button
              onClick={clearRecentSearches}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </div>
          {recentSearches.map((query, index) => (
            <button
              key={query}
              onClick={() => handleRecentClick(query)}
              className={`w-full px-3 py-2.5 text-left transition-colors cursor-pointer border-b border-border/50 last:border-b-0 flex items-center gap-2 ${
                index === selectedIndex
                  ? "bg-accent"
                  : "hover:bg-accent/50"
              }`}
            >
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm line-clamp-1">{query}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search Results Dropdown */}
      {showResults && searchQuery.trim().length >= CONFIG.MIN_SEARCH_LENGTH && (
        <div 
          ref={resultsRef}
          className="fixed md:absolute top-16 md:top-full left-0 right-0 md:mt-2 bg-background border-b md:border border-border md:rounded-md shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {isSearching && searchResults.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              <span className="text-sm">Searching...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No blogs found for "{searchQuery}"
            </div>
          ) : (
            <div className="py-1">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                Results ({searchResults.length})
              </div>
              {searchResults.map((blog, index) => (
                <button
                  key={blog._id}
                  onClick={() => handleResultClick(blog)}
                  className={`w-full px-3 py-2.5 text-left transition-colors cursor-pointer border-b border-border/50 last:border-b-0 ${
                    index === selectedIndex
                      ? "bg-accent"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <span className="text-sm line-clamp-2 md:line-clamp-1">{blog.title}</span>
                  {/* Show category and date only on desktop */}
                  <div className="hidden md:flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {blog.category?.name}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

SearchBar.displayName = "SearchBar";

export default SearchBar;

// Export the close event name for Topbar to use
export { CLOSE_MOBILE_SEARCH_EVENT };
