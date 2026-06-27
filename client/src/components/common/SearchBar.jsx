import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
import { Input } from "@/components/ui/input";
import { Search, X, Loader2, Clock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import blogService from "@/features/blog/blogsService";

// Custom event for closing mobile search from SearchBar
const CLOSE_MOBILE_SEARCH_EVENT = "closeMobileSearch";

const SearchBar = React.memo(({ onResultClick, iconOnly, disableHotkey } = {}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // Close modal when route changes
  useEffect(() => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    setShowRecent(false);
    setIsSearching(false);
    setSelectedIndex(-1);
    setIsModalOpen(false);
  }, [location]);

  // Handle opening modal
  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  // Handle closing modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setShowResults(false);
    setShowRecent(false);
    setSearchQuery("");
    setSelectedIndex(-1);
  }, []);

  // Effect to handle body scroll lock and autofocus
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
      
      // If there are recent searches, show them
      if (recentSearches.length > 0 && !searchQuery.trim()) {
        setShowRecent(true);
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen, recentSearches.length, searchQuery]);

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
    inputRef.current?.focus();
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
    if (pendingRequestRef.current) {
      pendingRequestRef.current = null;
    }
  }, []);

  // Cache management
  const getFromCache = useCallback((query) => {
    const cache = cacheRef.current;
    const cachedItem = cache.get(query);
    if (!cachedItem) return null;

    const now = Date.now();
    if (now - cachedItem.timestamp > CONFIG.CACHE_EXPIRY) {
      cache.delete(query);
      return null;
    }

    return {
      data: cachedItem.data,
      isStale: now - cachedItem.timestamp > CONFIG.STALE_TIME
    };
  }, [CONFIG.CACHE_EXPIRY, CONFIG.STALE_TIME]);

  const setToCache = useCallback((query, data) => {
    const cache = cacheRef.current;
    if (cache.size >= CONFIG.CACHE_SIZE) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(query, {
      data,
      timestamp: Date.now()
    });
  }, [CONFIG.CACHE_SIZE]);

  // Rate limiting check
  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    if (now - lastSearchTimeRef.current > 60000) {
      searchCountRef.current = 0;
      lastSearchTimeRef.current = now;
    }

    if (searchCountRef.current >= CONFIG.MAX_REQUESTS_PER_MINUTE) {
      console.warn("Search rate limit exceeded");
      return false;
    }

    searchCountRef.current += 1;
    return true;
  }, [CONFIG.MAX_REQUESTS_PER_MINUTE]);

  // Perform search request
  const performSearch = useCallback(async (query, skipLoadingState = false) => {
    if (!checkRateLimit()) return null;

    const trimmedQuery = query.trim();
    if (trimmedQuery.length < CONFIG.MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      setShowResults(false);
      return null;
    }

    const cached = getFromCache(trimmedQuery);
    if (cached && !cached.isStale) {
      setSearchResults(cached.data);
      setShowResults(true);
      setShowRecent(false);
      return cached.data;
    }

    if (!skipLoadingState) {
      setIsSearching(true);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // Setup timeout
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, CONFIG.REQUEST_TIMEOUT);

      const response = await blogService.search(trimmedQuery, {
        limit: 5,
        fields: "title,slug,createdAt,category"
      });

      clearTimeout(timeoutId);

      // Verify this is still the most recent request
      if (pendingRequestRef.current !== trimmedQuery) return null;

      const results = response.blogs || response.data || [];
      setToCache(trimmedQuery, results);
      
      setSearchResults(results);
      setShowResults(true);
      setShowRecent(false);
      
      return results;

    } catch (error) {
      if (error.name === 'AbortError' || error.message?.includes('canceled')) {
        return null; // Ignore cancellation errors
      }
      console.error("Search failed:", error);
      
      // If request failed but we have stale cache, use it
      if (cached?.isStale) {
        setSearchResults(cached.data);
        setShowResults(true);
        setShowRecent(false);
        return cached.data;
      }
      
      setSearchResults([]);
      return null;
    } finally {
      if (pendingRequestRef.current === trimmedQuery) {
        setIsSearching(false);
      }
    }
  }, [CONFIG.MIN_SEARCH_LENGTH, CONFIG.REQUEST_TIMEOUT, checkRateLimit, getFromCache, setToCache]);

  // Handle actual search action
  const handleSearch = useCallback((query) => {
    cleanup();
    pendingRequestRef.current = query;

    debounceTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, CONFIG.DEBOUNCE_DELAY);
  }, [CONFIG.DEBOUNCE_DELAY, cleanup, performSearch]);

  // Input change handler
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedIndex(-1);
    
    if (value.trim().length >= CONFIG.MIN_SEARCH_LENGTH) {
      handleSearch(value);
    } else {
      cleanup();
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      pendingRequestRef.current = null;
      
      if (value.trim().length === 0 && recentSearches.length > 0) {
        setShowRecent(true);
      } else {
        setShowRecent(false);
      }
    }
  }, [CONFIG.MIN_SEARCH_LENGTH, handleSearch, cleanup, recentSearches.length]);

  // Result click handler
  const handleResultClick = useCallback((blog) => {
    saveToRecentSearches(searchQuery);
    cleanup();
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    setShowRecent(false);
    setIsSearching(false);
    closeModal();
    
    navigate(`/blog/${blog.slug}`);
    if (onResultClick) onResultClick();
  }, [searchQuery, cleanup, navigate, onResultClick, saveToRecentSearches, closeModal]);

  // Recent search click handler
  const handleRecentClick = useCallback((query) => {
    setSearchQuery(query);
    handleSearch(query);
    setShowRecent(false);
  }, [handleSearch]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    const hasItems = (showResults && searchResults.length > 0) || (showRecent && recentSearches.length > 0);
    const maxIndex = showResults ? searchResults.length - 1 : recentSearches.length - 1;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (hasItems) {
          setSelectedIndex(prev => prev < maxIndex ? prev + 1 : prev);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (hasItems) {
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        }
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (showResults && searchResults[selectedIndex]) {
            handleResultClick(searchResults[selectedIndex]);
          } else if (showRecent && recentSearches[selectedIndex]) {
            handleRecentClick(recentSearches[selectedIndex]);
          }
        } else if (searchQuery.trim().length >= CONFIG.MIN_SEARCH_LENGTH) {
          saveToRecentSearches(searchQuery);
          cleanup();
          setIsSearching(false);
          closeModal();
          navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
          if (onResultClick) onResultClick();
        }
        break;
      case "Escape":
        closeModal();
        break;
    }
  }, [showResults, showRecent, searchResults, recentSearches, selectedIndex, searchQuery, CONFIG.MIN_SEARCH_LENGTH, cleanup, navigate, handleResultClick, handleRecentClick, saveToRecentSearches, onResultClick, closeModal]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    cleanup();
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    if (recentSearches.length > 0) {
      setShowRecent(true);
    }
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, [cleanup, recentSearches.length]);

  // Form submit
  const handleFormSubmit = useCallback((e) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length >= CONFIG.MIN_SEARCH_LENGTH) {
      saveToRecentSearches(trimmedQuery);
      cleanup();
      setIsSearching(false);
      closeModal();
      navigate(`/?search=${encodeURIComponent(trimmedQuery)}`);
      if (onResultClick) onResultClick();
    }
  }, [searchQuery, CONFIG.MIN_SEARCH_LENGTH, navigate, cleanup, saveToRecentSearches, onResultClick, closeModal]);

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
        openModal();
      }

      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        openModal();
      }
    };

    if (!disableHotkey) {
      document.addEventListener("keydown", handleGlobalKeyDown);
      return () => document.removeEventListener("keydown", handleGlobalKeyDown);
    }
  }, [openModal, disableHotkey]);

  // Click outside handler for modal overlay
  const handleOverlayClick = useCallback((e) => {
    if (e.target.dataset.searchOverlay === "true") {
      closeModal();
    }
  }, [closeModal]);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex + 1];
      selectedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  return (
    <>
      {/* Search Trigger */}
      {iconOnly ? (
        <button
          onClick={openModal}
          type="button"
          className="p-2 rounded-lg hover:bg-accent/80 transition-all duration-200 ease-in-out active:scale-95 text-foreground"
          aria-label="Open search"
        >
          <Search className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={openModal}
          type="button"
          className="flex items-center gap-2 w-full h-9 px-3 rounded-full border border-border bg-muted/50 text-sm text-muted-foreground cursor-pointer"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search</span>
          <span className="hidden sm:inline-flex items-center gap-1">
            <kbd className="inline-flex items-center justify-center px-1.5 h-5 min-w-[1.5rem] rounded border border-border bg-muted text-[0.625rem] font-mono font-medium text-muted-foreground">Ctrl</kbd>
            <kbd className="inline-flex items-center justify-center px-1.5 h-5 min-w-[1.5rem] rounded border border-border bg-muted text-[0.625rem] font-mono font-medium text-muted-foreground">K</kbd>
          </span>
        </button>
      )}

      {/* Modal Overlay */}
      {isModalOpen && ReactDOM.createPortal(
        <div 
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4"
          style={{ backgroundColor: 'var(--overlay)', backdropFilter: 'blur(0.5rem)', WebkitBackdropFilter: 'blur(0.5rem)', animation: 'searchFadeIn 150ms ease-out' }}
          data-search-overlay="true"
          onClick={handleOverlayClick}
        >
          <style>{`
            @keyframes searchFadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes searchScaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
          `}</style>
          {/* Modal Container - unified rounded box like Fumadocs */}
          <div className="w-full bg-popover border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col" style={{ maxWidth: '30rem', animation: 'searchScaleIn 150ms ease-out' }}>
            {/* Search input at top */}
            <form onSubmit={handleFormSubmit} className="relative border-b border-border">
              {isSearching ? (
                <Loader2 className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
              ) : (
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              )}
              <Input
                ref={inputRef}
                placeholder="Search"
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="h-12 pl-12 pr-16 w-full bg-transparent border-0 rounded-none text-base shadow-none outline-none ring-0 focus:outline-none focus:ring-0 focus:border-transparent focus-visible:ring-0 focus-visible:border-transparent focus-visible:outline-none"
                autoComplete="off"
                spellCheck="false"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 px-2 h-6 rounded border border-border bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                  ESC
                </div>
              )}
            </form>

            {/* Results area directly below search */}
            <div className="max-h-[50vh] overflow-y-auto">
              {/* Recent Searches */}
              {showRecent && recentSearches.length > 0 && (
                <div ref={resultsRef} className="py-2">
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Recent
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
                      className={`w-full px-4 py-3 text-left transition-colors cursor-pointer flex items-center gap-3 ${
                        index === selectedIndex
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-accent/50"
                      }`}
                    >
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm line-clamp-1">{query}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Search Results */}
              {showResults && searchQuery.trim().length >= CONFIG.MIN_SEARCH_LENGTH && (
                <div ref={resultsRef} className="py-2">
                  {isSearching && searchResults.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" />
                      <span className="text-sm">Searching blogs...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Search className="h-10 w-10 mx-auto mb-4 opacity-20" />
                      <p className="text-sm font-medium">No results found.</p>
                      <p className="text-xs mt-1">Try a different search term.</p>
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Blogs
                      </div>
                      {searchResults.map((blog, index) => (
                        <button
                          key={blog._id}
                          onClick={() => handleResultClick(blog)}
                          className={`w-full px-4 py-3 text-left transition-colors cursor-pointer flex flex-col gap-1 ${
                            index === selectedIndex
                              ? "bg-accent"
                              : "hover:bg-accent/50"
                          }`}
                        >
                          <span className={`text-sm font-medium line-clamp-1 ${index === selectedIndex ? "text-accent-foreground" : "text-foreground"}`}>
                            {blog.title}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {blog.category?.name || "Uncategorized"}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(blog.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
});

SearchBar.displayName = "SearchBar";

export default SearchBar;

// Export the close event name for Topbar to use
export { CLOSE_MOBILE_SEARCH_EVENT };
