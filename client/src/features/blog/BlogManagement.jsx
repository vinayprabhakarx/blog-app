import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Link, useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { FilterCard } from "@/components/common/FilterCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useBlog, useCategories } from "@/hooks/useRedux";
import {
  fetchAllBlogs,
  fetchMyBlogs,
  fetchBlogsByAuthor,
  deleteBlog,
} from "./blogSlice";
import { fetchAllCategories } from "@/features/category/categoriesSlice";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateDisplays";
import BlogCard from "./BlogCard";
import Pagination from "@/components/common/Pagination";
import {
  FileText,
  User,
  Calendar,
  Clock,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  ArrowLeft,
  FilePenLine,
  FileCheck,
  Star,
} from "lucide-react";
import { PageStats } from "@/components/common/PageStats";
import { formatDate } from "@/utils/formatDate";
import { showToast } from "@/utils/showToast";

const BlogManagement = () => {
  const { slug, username } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isInitialFetch = useRef(true);
  const [showFilters, setShowFilters] = useState(false);

  const { user, isAuthenticated } = useAuth();

  const isMyBlogsPage = location.pathname.includes("my-blogs");
  const isUserBlogsPage =
    username && location.pathname.includes(`${username}/blogs`);
  const isGeneralBlogsPage =
    location.pathname.includes("/blogs") &&
    !location.pathname.includes("/category/") &&
    !location.pathname.includes("/my-blogs") &&
    !isUserBlogsPage;

  const {
    allBlogs,
    allBlogsLoading,
    allBlogsError,
    myBlogs,
    myBlogsLoading,
    myBlogsError,
    authorBlogs,
    authorBlogsLoading,
    authorBlogsError,
    dispatch: blogDispatch,
  } = useBlog();
  const {
    categories,
    loading: categoriesLoading,
    dispatch: categoriesDispatch,
  } = useCategories();

  const [searchParams, setSearchParams] = useSearchParams();

  // URL State (Source of Truth)
  const urlPage = parseInt(searchParams.get("page"), 10) || 1;
  const urlCategory = searchParams.get("category") || slug || "all";
  const urlSortBy = searchParams.get("sort_by") || "createdAt";
  const urlSortOrder = searchParams.get("sort_order") || "desc";
  const urlDraftFilter = searchParams.get("draft") || "all";
  const urlAuthor = searchParams.get("author") || "all";

  // Local State (for UI unapplied filters)
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [sortBy, setSortBy] = useState(urlSortBy);
  const [sortOrder, setSortOrder] = useState(urlSortOrder);
  const [draftFilter, setDraftFilter] = useState(urlDraftFilter);
  const [selectedAuthor, setSelectedAuthor] = useState(urlAuthor);

  const blogsPerPage = 9;

  // Sync local state when URL changes
  useEffect(() => {
    setSelectedCategory(urlCategory);
    setSortBy(urlSortBy);
    setSortOrder(urlSortOrder);
    setDraftFilter(urlDraftFilter);
    setSelectedAuthor(urlAuthor);
  }, [urlCategory, urlSortBy, urlSortOrder, urlDraftFilter, urlAuthor]);

  const currentCategory = slug
    ? categories.find((cat) => cat.slug === slug)
    : null;
  const isViewingCategory = !!slug;

  useEffect(() => {
    if (categories.length === 0 && !categoriesLoading) {
      categoriesDispatch(fetchAllCategories());
    }
  }, [categoriesDispatch, categories.length, categoriesLoading]);

  useEffect(() => {
    const params = {
      page: urlPage,
      limit: blogsPerPage,
    };

    if (urlCategory && urlCategory !== "all") {
      const categoryData = categories.find(
        (cat) => cat.slug === urlCategory
      );
      if (categoryData) {
        params.category = categoryData._id;
      }
    }

    params.sortBy = urlSortBy;
    params.sortOrder = urlSortOrder;

    const fetchData = async () => {
      try {
        if (isMyBlogsPage) {
          await blogDispatch(fetchMyBlogs(params));
        } else if (isUserBlogsPage && username) {
          await blogDispatch(fetchBlogsByAuthor({ username, params }));
        } else {
          await blogDispatch(fetchAllBlogs(params));
        }
      } finally {
        if (isInitialFetch.current) {
          isInitialFetch.current = false;
          setIsInitialLoad(false);
        }
      }
    };

    fetchData();
  }, [
    blogDispatch,
    urlPage,
    urlCategory,
    urlSortBy,
    urlSortOrder,
    categories,
    blogsPerPage,
    isMyBlogsPage,
    isUserBlogsPage,
    username,
  ]);

  const formatReadTime = (content) => {
    const wordsPerMinute = 200;
    const wordCount = content?.replace(/<[^>]*>/g, "").split(/\s+/).length || 0;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readTime} min read`;
  };

  const truncateContent = (content, maxLength = 250) => {
    const textContent = content?.replace(/<[^>]*>/g, "") || "";
    if (textContent.length <= maxLength) return textContent;
    return textContent.substring(0, maxLength) + "...";
  };

  const blogPagination = useSelector((state) => {
    if (isMyBlogsPage) {
      return state.blog.myBlogsPagination;
    } else if (isUserBlogsPage) {
      return state.blog.authorBlogsPagination;
    } else {
      return state.blog.allBlogsPagination;
    }
  });

  const currentBlogs = isMyBlogsPage
    ? myBlogs
    : isUserBlogsPage
    ? authorBlogs
    : allBlogs;

  const currentLoading = isMyBlogsPage
    ? myBlogsLoading
    : isUserBlogsPage
    ? authorBlogsLoading
    : allBlogsLoading;

  const currentError = isMyBlogsPage
    ? myBlogsError
    : isUserBlogsPage
    ? authorBlogsError
    : allBlogsError;

  // Only show loading on initial page load, not during pagination/search/filter
  const shouldShowInitialLoading = currentLoading && isInitialLoad;

  const totalBlogs = blogPagination?.totalBlogs || currentBlogs.length;

  const filteredBlogs = useMemo(() => {
    if (isMyBlogsPage) {
      return currentBlogs.filter((blog) => {
        let passesDraftFilter = true;
        if (urlDraftFilter === "published") passesDraftFilter = !blog.draft;
        if (urlDraftFilter === "drafts") passesDraftFilter = blog.draft;

        return passesDraftFilter;
      });
    } else {
      return currentBlogs.filter((blog) => {
        if (urlAuthor && urlAuthor !== "all") {
          try {
            const blogAuthor =
              blog.author?.personal_info?.username ||
              blog.authorInfo?.username ||
              blog.author?.personal_info?.name ||
              blog.authorInfo?.name ||
              blog.author?.name ||
              blog.author;
            return (
              typeof blogAuthor === "string" && blogAuthor === urlAuthor
            );
          } catch (error) {
            console.warn(
              "Error filtering by author for blog:",
              blog._id,
              error
            );
            return false;
          }
        }
        return true;
      });
    }
  }, [currentBlogs, isMyBlogsPage, urlDraftFilter, urlAuthor]);


  const sortedAndFilteredBlogs = useMemo(() => {
    return [...filteredBlogs].sort((a, b) => {
      let aValue, bValue;

      switch (urlSortBy) {
        case "title":
          aValue = a.title?.toLowerCase() || "";
          bValue = b.title?.toLowerCase() || "";
          break;
        case "views":
          aValue = a.views || 0;
          bValue = b.views || 0;
          break;
        case "createdAt":
        default:
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
      }

      if (urlSortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [filteredBlogs, urlSortBy, urlSortOrder]);

  const displayTotalBlogs = useMemo(() => {
    return isMyBlogsPage ? sortedAndFilteredBlogs.length : totalBlogs;
  }, [isMyBlogsPage, sortedAndFilteredBlogs.length, totalBlogs]);

  const paginatedBlogs = sortedAndFilteredBlogs;



  // Set dynamic page title for SEO on lists/categories/user blogs
  useEffect(() => {
    if (isMyBlogsPage) {
      document.title = "My Blogs | VinayPrabhakarX-Blog";
    } else if (isUserBlogsPage && username) {
      document.title = `${username}'s Blogs | VinayPrabhakarX-Blog`;
    } else if (isViewingCategory && currentCategory) {
      document.title = `${currentCategory.name} Category | VinayPrabhakarX-Blog`;
    } else {
      document.title = "All Blogs | VinayPrabhakarX-Blog";
    }
    return () => {
      document.title = "VinayPrabhakarX-Blog";
    };
  }, [isMyBlogsPage, isUserBlogsPage, isViewingCategory, currentCategory, username]);

  const handleApplyFilters = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    
    newParams.set("page", 1); // Reset page on filter apply
    
    // We will handle category in the route path for public blogs
    newParams.delete("category");
    
    if (sortBy !== "createdAt") newParams.set("sort_by", sortBy);
    else newParams.delete("sort_by");

    if (sortOrder !== "desc") newParams.set("sort_order", sortOrder);
    else newParams.delete("sort_order");

    if (draftFilter !== "all") newParams.set("draft", draftFilter);
    else newParams.delete("draft");

    if (selectedAuthor !== "all") newParams.set("author", selectedAuthor);
    else newParams.delete("author");

    let pathname = location.pathname;

    if (isMyBlogsPage || isUserBlogsPage) {
      if (selectedCategory !== "all") {
        newParams.set("category", selectedCategory);
      }
    } else {
      if (selectedCategory === "all") {
        pathname = "/blogs";
      } else {
        pathname = `/category/${selectedCategory}`;
      }
    }

    navigate({ pathname, search: newParams.toString() });
  }, [searchParams, navigate, location.pathname, selectedCategory, sortBy, sortOrder, draftFilter, selectedAuthor, isMyBlogsPage, isUserBlogsPage]);

  const handleClearFilters = useCallback(() => {
    const newParams = new URLSearchParams();
    
    let pathname = location.pathname;
    
    if (!isMyBlogsPage && !isUserBlogsPage && slug) {
      pathname = "/blogs";
    }

    navigate({ pathname, search: newParams.toString() });
  }, [navigate, location.pathname, isMyBlogsPage, isUserBlogsPage, slug]);

  const handleDeleteBlog = useCallback(
    async (blogId, blogTitle) => {
      if (
        window.confirm(
          `Are you sure you want to delete "${blogTitle}"? This action cannot be undone.`
        )
      ) {
        try {
          await blogDispatch(deleteBlog(blogId)).unwrap();
          showToast("success", "Blog deleted successfully!");

          const params = {
            page: urlPage,
            limit: blogsPerPage,
          };

          if (urlCategory && urlCategory !== "all") {
            const categoryData = categories.find(
              (cat) => cat.slug === urlCategory
            );
            if (categoryData) {
              params.category = categoryData._id;
            }
          }

          params.sortBy = urlSortBy;
          params.sortOrder = urlSortOrder;

          blogDispatch(fetchAllBlogs(params));
        } catch (error) {
          console.error("Failed to delete blog:", error);
          showToast(
            "error",
            error.message || "Failed to delete blog. Please try again."
          );
        }
      }
    },
    [
      blogDispatch,
      urlPage,
      urlCategory,
      urlSortBy,
      urlSortOrder,
      categories,
      blogsPerPage,
    ]
  );

  const canModifyBlog = useCallback(
    (blog) => {
      if (!isAuthenticated || !user) return false;

      if (user.role === "admin") return true;

      const blogAuthorId = blog.author?._id || blog.author?.id || blog.author;
      const currentUserId = user._id || user.id;

      return typeof blogAuthorId === "string" ||
        typeof blogAuthorId === "number"
        ? blogAuthorId === currentUserId
        : false;
    },
    [isAuthenticated, user]
  );

  const isAdmin = user?.role === "admin";
  const isAuthor = user?.role === "author";

  if (shouldShowInitialLoading) {
    return <LoadingState message="Loading blogs..." />;
  }

  if (currentError) {
    return (
      <ErrorState
        title="Failed to Load Blogs"
        message={currentError}
        onRetry={() => {
          if (isMyBlogsPage) {
            blogDispatch(fetchMyBlogs());
          } else if (isUserBlogsPage && username) {
            blogDispatch(fetchBlogsByAuthor({ username, params: {} }));
          } else {
            blogDispatch(fetchAllBlogs());
          }
        }}
      />
    );
  }



  return (
    <section className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-3 sm:space-y-4 items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2 mb-2">
            {isMyBlogsPage
              ? "My Blogs"
              : isUserBlogsPage
              ? `${username}'s Blogs`
              : isAdmin || isAuthor
              ? "Blog Management"
              : "All Blogs"}
          </h1>
          <PageStats
            stats={[
              { value: displayTotalBlogs, label: "blogs" },
              {
                value: `${urlPage} of ${Math.ceil(
                  displayTotalBlogs / blogsPerPage
                )}`,
                label: "pages",
              },
              {
                label:
                  draftFilter === "drafts"
                    ? "Drafts"
                    : draftFilter === "published"
                    ? "Published"
                    : "All Types",
                hidden: !isMyBlogsPage,
              },
            ]}
          />
        </div>

        {isViewingCategory && (
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/category")}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Topics</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>
        )}

        {isViewingCategory && currentCategory?.description && (
          <p className="text-muted-foreground max-w-3xl mx-auto px-4 text-sm sm:text-base text-center">
            {currentCategory.description}
          </p>
        )}
      </div>

      <div className="flex justify-center gap-3">
        {(isAdmin || isAuthor) && (
          <Button
            onClick={() => navigate("/blogs/create")}
            className="flex items-center justify-center gap-2 h-10 w-10 sm:w-auto p-0 sm:px-4"
          >
            <Plus className="w-7 h-7 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Create Blog</span>
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          disabled={currentBlogs.length === 0}
          className="flex items-center justify-center gap-2 h-10 w-10 sm:w-auto p-0 sm:px-4 cursor-pointer disabled:cursor-not-allowed"
        >
          <Filter className="w-7 h-7 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Filters</span>
        </Button>
      </div>

      <FilterCard
        isOpen={showFilters}
        onClear={handleClearFilters}
        onApply={handleApplyFilters}
        className=""
      >
          <div className="col-span-1">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full h-10 sm:h-9 text-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category._id} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(isMyBlogsPage || (isAdmin && isGeneralBlogsPage)) && (
            <Select value={draftFilter} onValueChange={setDraftFilter}>
              <SelectTrigger className="w-full h-10 sm:h-9 text-sm">
                <SelectValue placeholder="All Blogs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="published">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">Published</span>
                    <span className="sm:hidden">Pub</span>
                  </div>
                </SelectItem>
                <SelectItem value="drafts">
                  <div className="flex items-center gap-2">
                    <FilePenLine className="w-4 h-4" />
                    <span className="hidden sm:inline">Drafts</span>
                    <span className="sm:hidden">Draft</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}

          {!isMyBlogsPage && (
            <Select
              value={selectedAuthor || "all"}
              onValueChange={setSelectedAuthor}
            >
              <SelectTrigger className="w-full h-10 sm:h-9 text-sm">
                <SelectValue placeholder="All Authors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Authors</SelectItem>
                {Array.from(
                  new Set(
                    currentBlogs
                      .map((blog) => {
                        try {
                          const author =
                            blog.author?.personal_info?.username ||
                            blog.authorInfo?.username ||
                            blog.author?.personal_info?.name ||
                            blog.authorInfo?.name ||
                            blog.author?.name ||
                            blog.author;
                          return typeof author === "string" && author.trim()
                            ? author
                            : null;
                        } catch (error) {
                          console.warn(
                            "Error extracting author from blog:",
                            blog._id,
                            error
                          );
                          return null;
                        }
                      })
                      .filter((author) => author && author.trim())
                  )
                ).map((author) => (
                  <SelectItem key={author} value={author}>
                    {author}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full h-10 sm:h-9 text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date Created</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="views">Views</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-full h-10 sm:h-9 text-sm">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>
      </FilterCard>

      {currentBlogs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No blogs available"
          description="There are no blogs to display at the moment. Create your first blog!"
        />
      ) : sortedAndFilteredBlogs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No matching blogs found"
          description="We couldn't find any blogs that match your current filters. Try adjusting your search criteria."
          action={
            <Button onClick={handleClearFilters} variant="outline">
              Clear Filters
            </Button>
          }
        />
      ) : (isMyBlogsPage || (isAdmin && isGeneralBlogsPage)) ? (
        <div className="grid gap-4 sm:gap-6">
          {paginatedBlogs.map((blog) => (
            <Card key={blog._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:gap-0">
                  <div className="flex-1">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                      <div className="flex-1">
                        <Link
                          to={
                            blog.draft
                              ? `/blog/preview/${blog._id}`
                              : `/blog/${blog.slug}`
                          }
                        >
                          <h2 className="font-bold text-foreground mb-2 cursor-pointer hover:text-primary transition-colors text-lg sm:text-xl lg:text-2xl">
                            {blog.title}
                          </h2>
                        </Link>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-base text-muted-foreground mb-3">
                          <div className="flex items-center gap-1 hover:text-primary transition-colors">
                            <User className="w-4 h-4" />
                            <Link
                              to={`/${
                                blog.author?.personal_info?.username ||
                                blog.authorInfo?.username ||
                                ""
                              }`}
                              className="text-base font-medium text-foreground hover:text-primary transition-colors duration-200 hover:underline"
                            >
                              {blog.author?.personal_info?.username ||
                                blog.authorInfo?.username ||
                                "Unknown Author"}
                            </Link>
                          </div>

                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(blog.createdAt)}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatReadTime(blog.content)}</span>
                          </div>

                          {blog.views && (
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{blog.views} views</span>
                            </div>
                          )}
                        </div>

                        <div className="mb-3 flex flex-wrap gap-2">
                          {blog.category && (
                            <Link
                              to={`/category/${
                                categories.find(
                                  (cat) => cat.slug === blog.category
                                )?.slug || blog.category
                              }`}
                              className="text-sm font-medium text-primary hover:underline underline-offset-4 decoration-primary/30 transition-all uppercase tracking-wide"
                            >
                              {categories.find(
                                (cat) => cat.slug === blog.category
                              )?.name ||
                                (typeof blog.category === "object"
                                  ? blog.category.name
                                  : blog.category) ||
                                "Unknown Category"}
                            </Link>
                          )}
                          {blog.isFeatured && (
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 text-xs">
                              <Star className="w-3 h-3 mr-1 fill-primary" />
                              Featured
                            </Badge>
                          )}
                          <Badge
                            variant={blog.draft ? "destructive" : "default"}
                            className="text-xs"
                          >
                            {blog.draft ? (
                              <>
                                <FilePenLine className="w-3 h-3 mr-1" />
                                Draft
                              </>
                            ) : (
                              <>
                                <FileCheck className="w-3 h-3 mr-1" />
                                Published
                              </>
                            )}
                          </Badge>
                        </div>

                        <p className="text-muted-foreground mb-4 text-base line-clamp-3 leading-relaxed">
                          {truncateContent(blog.excerpt || blog.content || "", 160)}
                        </p>
                      </div>

                      {isAuthenticated && canModifyBlog(blog) && (
                        <div className="flex flex-row lg:flex-col gap-2 lg:ml-4">
                          <Button
                            onClick={() =>
                              navigate(
                                blog.draft
                                  ? `/editor/${blog._id}`
                                  : `/blogs/edit/${blog.slug}`
                              )
                            }
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 flex-1 lg:flex-none"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Edit</span>
                            <span className="sm:hidden">Edit</span>
                          </Button>
                          <Button
                            onClick={() =>
                              handleDeleteBlog(blog._id, blog.title)
                            }
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-destructive hover:text-destructive-foreground hover:bg-destructive flex-1 lg:flex-none"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Delete</span>
                            <span className="sm:hidden">Del</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {paginatedBlogs.map((blog) => (
              <BlogCard key={blog._id} blog={blog} />
            ))}
          </div>
        </div>
      )}

      <Pagination
        totalPages={Math.ceil(displayTotalBlogs / blogsPerPage)}
        currentPage={urlPage}
        setCurrentPage={(page) => {
          const newParams = new URLSearchParams(searchParams);
          newParams.set("page", page);
          setSearchParams(newParams);
        }}
        totalBlogs={displayTotalBlogs}
        paginationThreshold={9}
      />
    </section>
  );
};

export default BlogManagement;
