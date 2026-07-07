import React, { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthCard from "./AuthCard";
import { Link, useNavigate } from "react-router-dom";
import { RouteSignUp, getRoleBasedRedirect } from "@/utils/RouteName";
import { showToast } from "@/utils/showToast";
import GoogleAuth from "./GoogleAuth";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, getCurrentUser } from "@/features/auth/authSlice";
import InputBox from "@/components/common/InputBox";
import LoadingButton from "@/components/common/LoadingButton";
import { FaEnvelope, FaLock } from "react-icons/fa6";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);
  const debounceTimerRef = useRef(null);

  const formSchema = z.object({
    email: z.string().min(1, "Email is required").email("Please enter a valid email address").max(50, "Email cannot exceed 50 characters"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(6, "Password must be at least 6 characters long")
      .max(20, "Password cannot exceed 20 characters"),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onBlur", // Show errors when user leaves field
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Watch all values to trigger revalidation when conditions are met
  const watchedValues = form.watch();
  const errors = form.formState.errors;

  // Debounced revalidation to clear errors when user types valid value
  useEffect(() => {
    // Only revalidate if there are errors to potentially clear
    const hasErrors = Object.keys(errors).length > 0;
    if (!hasErrors) return;

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce: wait 500ms after user stops typing to revalidate
    debounceTimerRef.current = setTimeout(() => {
      // Revalidate fields that have errors
      Object.keys(errors).forEach((fieldName) => {
        if (watchedValues[fieldName] === "" && !form.formState.isSubmitted) {
          form.clearErrors(fieldName);
        } else {
          form.trigger(fieldName);
        }
      });
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [watchedValues, errors, form]);

  // Clear any stale tokens on mount to prevent redirect loops
  useEffect(() => {
    // Clear all auth-related items from localStorage
    localStorage.removeItem("user");
    // CRITICAL: Also clear Redux state to prevent PublicRoute from redirecting
    dispatch({ type: 'auth/logout' });
  }, [dispatch]);

  async function onSubmit(values) {
    try {
      await dispatch(loginUser(values)).unwrap();
      const userResult = await dispatch(getCurrentUser()).unwrap();
      const redirectPath = getRoleBasedRedirect(userResult.user);

      showToast("success", "Login successful!");
      navigate(redirectPath);
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        typeof error === "string"
          ? error
          : error?.message ||
            error?.error ||
            "Login failed. Please check your credentials.";
            
      if (errorMessage.toLowerCase().includes("email not verified")) {
        showToast("error", errorMessage);
        navigate("/resend-email", { state: { email: values.email } });
      } else {
        showToast("error", errorMessage);
      }
    }
  }

  return (
    <section className="flex justify-center items-center min-h-screen w-full px-4 bg-background">
      <AuthCard>
        <h1 className="text-2xl font-bold text-center mb-5">
          Login into Account
        </h1>
        <div className="">
          <GoogleAuth />
          <div className="relative my-5 flex justify-center items-center border-t border-border">
            <span className="absolute bg-background px-2 text-sm text-muted-foreground">Or</span>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="mb-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Email</FormLabel>
                    <FormControl>
                      <InputBox
                        placeholder="Enter your Email"
                        icon={FaEnvelope}
                        maxLength={50}
                        {...field}
                        onBlur={(e) => {
                          if (field.value === "" && !form.formState.isSubmitted) {
                            form.clearErrors(field.name);
                          } else {
                            field.onBlur(e);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="mb-3">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Password</FormLabel>
                    <FormControl>
                      <InputBox
                        type="password"
                        placeholder="Enter your Password"
                        icon={FaLock}
                        showPasswordToggle={true}
                        maxLength={20}
                        {...field}
                        onBlur={(e) => {
                          if (field.value === "" && !form.formState.isSubmitted) {
                            form.clearErrors(field.name);
                          } else {
                            field.onBlur(e);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />

                    <div className="text-right text-sm mt-1">
                      <Link
                        to="/forgot-password"
                        className="text-primary hover:underline"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-5">
              <LoadingButton
                type="submit"
                className="w-full cursor-pointer"
                isLoading={loading || form.formState.isSubmitting}
                loadingText="Signing In..."
              >
                Sign In
              </LoadingButton>

              <div className="mt-5 text-sm text-muted-foreground flex justify-center items-center gap-2">
                <p>Don&apos;t have account?</p>
                <Link className="text-primary hover:underline" to={RouteSignUp}>
                  Sign Up
                </Link>
              </div>
            </div>
          </form>
        </Form>
      </AuthCard>
    </section>
  );
};

export default Login;
