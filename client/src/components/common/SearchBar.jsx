import React, { useState, useCallback, useMemo } from "react";
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
  const navigate = useNavigate();

  // Memoize callback functions
  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      setIsSearching(true);
      const response = await blogService.search(query);
      setSearchResults(response.blogs || []);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
      showToast("error", "Search failed");
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchQuery(value);

      // Debounce search to avoid excessive API calls
      if (value.trim()) {
        const timeoutId = setTimeout(() => {
          handleSearch(value);
        }, 300);

        return () => clearTimeout(timeoutId);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    },
    [handleSearch]
  );

  const handleResultClick = useCallback(
    (blog) => {
      navigate(`/blog/details/${blog.slug}`);
      setSearchQuery("");
      setShowResults(false);
      setSearchResults([]);
    },
    [navigate]
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  }, []);

  // Memoize form submit handler
  const handleFormSubmit = useCallback(
    (e) => {
      e.preventDefault();
      handleSearch(searchQuery);
    },
    [handleSearch, searchQuery]
  );

  return (
    <div className="relative w-full">
      <form onSubmit={handleFormSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search blogs..."
            value={searchQuery}
            onChange={handleInputChange}
            className="h-9 pl-10 pr-10 rounded-full bg-gray-50 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
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
                Search Results ({searchResults.length})
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
                            : `${import.meta.env.VITE_API_BASE_URL}/${
                                blog.banner
                              }`
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
