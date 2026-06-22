import React, { useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateDisplays";
import {
  fetchAllCategories,
  selectAllCategories,
  selectCategoriesLoading,
  selectCategoriesError,
} from "./categoriesSlice";
import { Tag, FileText, RefreshCw, ChevronRight, Star } from "lucide-react";
import { PageStats } from "@/components/common/PageStats";

const CategoriesView = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [hasFetched, setHasFetched] = React.useState(false);

  const categories = useSelector(selectAllCategories);
  const loading = useSelector(selectCategoriesLoading);
  const error = useSelector(selectCategoriesError);

  // Sort categories: featured first, then by article count
  const sortedCategories = useMemo(() => {
    if (!categories) return [];

    return [...categories].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;

      return (b.articleCount || 0) - (a.articleCount || 0);
    });
  }, [categories]);

  // Calculate category statistics
  const categoryStats = useMemo(() => {
    if (!categories) return { total: 0, featured: 0, totalArticles: 0 };

    return {
      total: categories.length,
      featured: categories.filter((cat) => cat.featured).length,
      totalArticles: categories.reduce(
        (sum, cat) => sum + (cat.articleCount || 0),
        0
      ),
    };
  }, [categories]);

  useEffect(() => {
    if (!hasFetched && !loading) {
      dispatch(fetchAllCategories());
      setHasFetched(true);
    }
  }, [dispatch, hasFetched, loading]);

  const handleCategoryClick = useCallback(
    (categorySlug) => {
      navigate(`/category/${categorySlug}`);
    },
    [navigate]
  );

  const handleRetry = useCallback(() => {
    setHasFetched(false);
    dispatch(fetchAllCategories());
  }, [dispatch]);

  const handleKeyDown = useCallback(
    (event, categorySlug) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleCategoryClick(categorySlug);
      }
    },
    [handleCategoryClick]
  );

  // Initial loading state
  if (loading && !hasFetched && categories.length === 0) {
    return <LoadingState message="Loading categories..." />;
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <ErrorState 
          title="Failed to Load Categories" 
          message={error || "Something went wrong while fetching categories. Please try again."}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="p-6">
        <EmptyState 
          icon={Tag} 
          title="No Categories Yet" 
          description="Categories will appear here once they are created. Check back later for organized content."
        />
      </div>
    );
  }

  return (
    <section className="p-6 space-y-6" aria-label="Categories">
      {/* Header with Stats */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-2">
          <h1 className="text-3xl md:text-4xl font-bold">Categories</h1>
        </div>
        <PageStats
          stats={[
            { value: categoryStats.total, label: "categories" },
            { value: categoryStats.totalArticles, label: "articles" },
            {
              value: categoryStats.featured,
              label: "featured",
              hidden: categoryStats.featured === 0,
            },
          ]}
        />
      </div>

      {/* Categories Grid - Unified Responsive Layout */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {sortedCategories.map((category) => (
          <div
            key={category._id}
            onClick={() => handleCategoryClick(category.slug)}
            onKeyDown={(e) => handleKeyDown(e, category.slug)}
            tabIndex={0}
            role="button"
            className="group flex items-center justify-between p-5 border border-border/50 rounded-xl hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Navigate to ${category.name} category with ${
              category.articleCount || 0
            } articles`}
            title={`View all posts in ${category.name}`}
          >
            <div className="flex items-center">
              <span className="font-medium text-lg group-hover:text-primary transition-colors">
                {category.name}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {category.featured && (
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              )}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/50">
                <FileText className="h-3.5 w-3.5" />
                <span className="font-medium">{category.articleCount || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>


    </section>
  );
};

export default CategoriesView;
