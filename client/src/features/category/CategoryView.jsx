import React, { useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  fetchAllCategories,
  selectAllCategories,
  selectCategoriesLoading,
  selectCategoriesError,
} from "./categoriesSlice";
import { Tag, FileText, RefreshCw, ChevronRight, Star } from "lucide-react";

const CategoriesView = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
    if (categories.length === 0 && !loading) {
      dispatch(fetchAllCategories());
    }
  }, [dispatch, categories.length, loading]);

  const handleCategoryClick = useCallback(
    (categorySlug) => {
      navigate(`/category/${categorySlug}`);
    },
    [navigate]
  );

  const handleRetry = useCallback(() => {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center text-red-500 p-8">
          <FileText className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Failed to Load Categories
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {error ||
              "Something went wrong while fetching categories. Please try again."}
          </p>
          <Button
            onClick={handleRetry}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center p-8">
          <Tag className="h-16 w-16 mx-auto mb-4 text-muted-foreground/60" />
          <h2 className="text-xl font-semibold mb-2 text-muted-foreground">
            No Categories Yet
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Categories will appear here once they are created. Check back later
            for organized content.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Stats */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Categories</h1>
        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
          <span>{categoryStats.total} categories</span>
          <span>•</span>
          <span>{categoryStats.totalArticles} articles</span>
          {categoryStats.featured > 0 && (
            <>
              <span>•</span>
              <span>{categoryStats.featured} featured</span>
            </>
          )}
        </div>
      </div>

      {/* Categories Table - Desktop */}
      <div className="hidden lg:block">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Category
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                      Articles
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                      Featured
                    </th>
                    <th className="py-3 px-4 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCategories.map((category) => (
                    <tr
                      key={category._id}
                      className="border-b hover:bg-muted/30 cursor-pointer transition-colors group"
                      onClick={() => handleCategoryClick(category.slug)}
                      onKeyDown={(e) => handleKeyDown(e, category.slug)}
                      tabIndex={0}
                      role="button"
                      aria-label={`Navigate to ${category.name} category with ${
                        category.articleCount || 0
                      } articles`}
                    >
                      {/* Category Name */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Tag className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                          <span className="font-medium group-hover:text-primary transition-colors">
                            {category.name}
                          </span>
                        </div>
                      </td>

                      {/* Article Count */}
                      <td className="py-4 px-4 text-center">
                        <div className="text-sm font-medium">
                          {category.articleCount || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {category.articleCount === 1 ? "article" : "articles"}
                        </div>
                      </td>

                      {/* Featured Star */}
                      <td className="py-4 px-4 text-center">
                        {category.featured ? (
                          <Star className="h-5 w-5 text-amber-500 fill-amber-500 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-center">
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all mx-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Cards - Mobile/Tablet */}
      <div className="lg:hidden space-y-4">
        {sortedCategories.map((category) => (
          <Card key={category._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Category Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Tag className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <span 
                      className="font-medium text-lg hover:text-primary transition-colors cursor-pointer"
                      onClick={() => handleCategoryClick(category.slug)}
                      onKeyDown={(e) => handleKeyDown(e, category.slug)}
                      tabIndex={0}
                      role="button"
                      aria-label={`Navigate to ${category.name} category with ${category.articleCount || 0} articles`}
                      title={`View all posts in ${category.name}`}
                    >
                      {category.name}
                    </span>
                  </div>
                  {category.featured && (
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  )}
                </div>

                {/* Category Stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{category.articleCount || 0}</span>
                    <span>{category.articleCount === 1 ? "article" : "articles"}</span>
                  </div>
                  {category.featured && (
                    <span className="text-amber-600 font-medium">Featured</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Stats */}
      {categories.length > 5 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing all {categoryStats.total} categories
        </div>
      )}
    </div>
  );
};

export default CategoriesView;
