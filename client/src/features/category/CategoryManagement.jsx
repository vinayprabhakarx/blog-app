import React, { useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  RouteAddCategory,
  RouteEditCategory,
  RouteCategoryView,
} from "@/utils/RouteName";
import { EmptyState, LoadingState } from "@/components/common/StateDisplays";
import { showToast } from "@/utils/showToast";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchAllCategories,
  deleteCategory,
  selectAllCategories,
  selectCategoriesLoading,
  selectOperationLoading,
} from "./categoriesSlice";
import {
  FolderOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  Tag,
  Star,
} from "lucide-react";
import { PageStats } from "@/components/common/PageStats";

const CategoryManagement = () => {
  const dispatch = useDispatch();
  const { isAdmin, isAuthor } = useAuth();
  const [hasFetched, setHasFetched] = React.useState(false);
  const categories = useSelector(selectAllCategories);
  const loading = useSelector(selectCategoriesLoading);
  const operationLoading = useSelector(selectOperationLoading);

  const userRole = isAdmin ? "admin" : isAuthor ? "author" : null;

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

  const handleDelete = useCallback(
    async (id, categoryName) => {
      if (
        window.confirm(
          `Are you sure you want to delete "${categoryName}"? This action cannot be undone.`
        )
      ) {
        try {
          const result = await dispatch(deleteCategory(id));
          if (deleteCategory.fulfilled.match(result)) {
            showToast("success", "Category deleted successfully!");
          } else {
            showToast("error", result.payload || "Failed to delete category");
          }
        } catch {
          showToast("error", "An unexpected error occurred");
        }
      }
    },
    [dispatch]
  );

  if (loading && (!categories || categories.length === 0)) {
    return <LoadingState message="Loading categories..." />;
  }



  return (
    <section className="p-6 space-y-6">
      {/* Header with Stats */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2 mb-2">
          Category Management
        </h1>
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

      {/* Add Category Button */}
      <div className="flex justify-center">
        <Button asChild className="flex items-center gap-2">
          <Link to={RouteAddCategory(userRole)}>
            <Plus className="h-4 w-4" />
            Add Category
          </Link>
        </Button>
      </div>

      {/* Categories Table - Desktop */}
      {categories.length === 0 ? (
        <EmptyState 
          icon={Tag} 
          title="No Categories Yet" 
          description="Create your first category to start organizing your content."
        />
      ) : (
      <>
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
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCategories.map((category) => (
                    <tr
                      key={category._id}
                      className="border-b hover:bg-muted/30 transition-colors group"
                    >
                      {/* Category Name */}
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <Link
                            to={RouteCategoryView(category.slug)}
                            className="font-medium group-hover:text-primary transition-colors hover:underline"
                            title={`View all posts in ${category.name}`}
                          >
                            {category.name}
                          </Link>
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

                      {/* Actions */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="transition-colors duration-200 hover:bg-primary hover:text-primary-foreground"
                            title="Edit category"
                          >
                            <Link
                              to={RouteEditCategory(category._id, userRole)}
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            onClick={() =>
                              handleDelete(category._id, category.name)
                            }
                            variant="outline"
                            size="sm"
                            disabled={operationLoading.delete}
                            className="transition-colors duration-200 hover:text-destructive hover:border-destructive"
                            title="Delete category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
          <Card
            key={category._id}
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Category Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Link
                      to={RouteCategoryView(category.slug)}
                      className="font-medium text-lg hover:underline"
                      title={`View all posts in ${category.name}`}
                    >
                      {category.name}
                    </Link>
                  </div>
                  {category.featured && (
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  )}
                </div>

                {/* Category Stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">
                      {category.articleCount || 0}
                    </span>
                    <span>
                      {category.articleCount === 1 ? "article" : "articles"}
                    </span>
                  </div>
                  {category.featured && (
                    <span className="font-medium">Featured</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-2 pt-4 border-t">
                  <Link to={RouteEditCategory(category._id, userRole)} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full flex items-center justify-center gap-2 h-10 sm:h-9"
                      title="Edit category"
                    >
                      <Edit className="w-6 h-6 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </Link>
                  <Button
                    onClick={() => handleDelete(category._id, category.name)}
                    variant="outline"
                    size="sm"
                    disabled={operationLoading.delete}
                    className="flex-1 flex items-center justify-center gap-2 h-10 sm:h-9"
                    title="Delete category"
                  >
                    <Trash2 className="w-6 h-6 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      </>
      )}


    </section>
  );
};

export default CategoryManagement;
