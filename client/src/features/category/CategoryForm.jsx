import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import slugify from "slugify";

// UI Components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Card } from "../../components/ui/card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import LoadingButton from "../../components/common/LoadingButton";

// Redux
import {
  fetchCategoryById,
  clearCurrentCategory,
  createCategory,
  updateCategory,
  selectOperationLoading,
  selectCurrentCategory,
  selectCategoriesLoading,
  selectCurrentCategoryError,
} from "./categoriesSlice";

// Utils
import { showToast } from "../../utils/showToast";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long."),
  description: z.string().optional(),
  featured: z.boolean().default(false),
});

const CategoryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();

  // Get state from Redux
  const currentCategory = useSelector(selectCurrentCategory);
  const loading = useSelector(selectCategoriesLoading);
  const error = useSelector(selectCurrentCategoryError);
  const operationLoading = useSelector(selectOperationLoading);

  // Check if in edit mode
  const isEditMode = Boolean(id);
  const isSubmitting = isEditMode
    ? operationLoading.update
    : operationLoading.create;

  // Initialize form with default values
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      featured: false,
    },
  });

  const name = form.watch("name");
  const slug = slugify(name || "", { lower: true });

  // Fetch category data when in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      dispatch(fetchCategoryById(id));
    }
    return () => {
      if (isEditMode) {
        dispatch(clearCurrentCategory());
      }
    };
  }, [dispatch, id, isEditMode]);

  // Update form when currentCategory changes
  useEffect(() => {
    if (isEditMode && currentCategory) {
      const { name, description, featured } = currentCategory;
      form.reset({
        name: name || "",
        description: description || "",
        featured: !!featured,
      });
    } else if (!isEditMode) {
      // Reset form when switching to create mode
      form.reset({
        name: "",
        description: "",
        featured: false,
      });
    }
  }, [currentCategory, form, isEditMode]);

  const onSubmit = async (values) => {
    if (isSubmitting) {
      return;
    }

    try {
      const payload = {
        name: values.name,
        description: values.description || "",
        featured: values.featured,
      };

      let result;
      if (isEditMode) {
        result = await dispatch(
          updateCategory({
            id: id,
            categoryData: payload,
          })
        );
      } else {
        result = await dispatch(createCategory(payload));
      }

      const actionCreator = isEditMode ? updateCategory : createCategory;
      if (actionCreator.fulfilled.match(result)) {
        const successMessage = isEditMode
          ? "Category updated successfully!"
          : "Category created successfully!";
        showToast("success", successMessage);

        if (!isEditMode) {
          // Reset form only when creating
          form.reset();
        }

        // Optional: Navigate back to categories list
        // navigate("/admin/categories");
      } else {
        const errorMessage = isEditMode
          ? "Failed to update category"
          : "Failed to create category";
        showToast("error", result.payload || errorMessage);
      }
    } catch (error) {
      const errorMessage = isEditMode
        ? "An unexpected error occurred while updating."
        : "An unexpected error occurred while creating.";
      showToast("error", error.message || errorMessage);
    }
  };

  // Loading state for edit mode
  if (isEditMode && loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state for edit mode
  if (isEditMode && error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Error Loading Category
          </h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-center">
        {isEditMode ? "Edit Category" : "Add New Category"}
      </h1>
      <Card className="pt-5 max-w-screen-md mx-auto p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">
                    Category Title
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter category title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">
                    Description (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter category description"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="featured"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center space-x-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                      />
                    </FormControl>
                    <FormLabel className="text-foreground cursor-pointer">
                      Featured Category
                    </FormLabel>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    Featured categories are displayed prominently on the
                    homepage
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {name && (
              <div>
                <FormLabel className="text-muted-foreground">
                  Generated Slug
                </FormLabel>
                <Input value={slug} disabled />
              </div>
            )}

            <div className="mt-5">
              <LoadingButton
                type="submit"
                className="w-full"
                isLoading={isSubmitting}
                loadingText={isEditMode ? "Updating..." : "Creating..."}
              >
                {isEditMode ? "Update Category" : "Create Category"}
              </LoadingButton>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default CategoryForm;
