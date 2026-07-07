import React, { useEffect, useRef } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthCard from "./AuthCard";
import { Link, useNavigate } from "react-router-dom";
import { RouteSignIn } from "@/utils/RouteName";
import { showToast } from "@/utils/showToast";
import GoogleAuth from "./GoogleAuth";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "@/features/auth/authSlice";
import InputBox from "@/components/common/InputBox";
import LoadingButton from "@/components/common/LoadingButton";
import { FaUser, FaAt, FaEnvelope, FaLock } from "react-icons/fa6";

const SignUp = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);
  const debounceTimerRef = useRef(null);

  const formSchema = z
    .object({
      name: z.string().min(1, "Name is required").min(3, "Name must be at least 3 characters long.").max(50, "Name cannot exceed 50 characters"),
      username: z
        .string()
        .min(1, "Username is required")
        .min(3, "Username must be at least 3 characters long.")
        .max(20, "Username cannot exceed 20 characters"),
      email: z.string().min(1, "Email is required").email("Please enter a valid email address").max(50, "Email cannot exceed 50 characters"),
      password: z
        .string()
        .min(1, "Password is required")
        .min(8, "Password must be at least 8 characters long")
        .max(20, "Password cannot exceed 20 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
      confirmPassword: z.string().min(1, "Please confirm your password").max(20, "Password cannot exceed 20 characters"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Password and confirm password should be same.",
      path: ["confirmPassword"],
    });

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onBlur", // Show errors only when user leaves field
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
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

  async function onSubmit(values) {
    try {
      const { confirmPassword: _confirmPassword, ...userData } = values;

      await dispatch(registerUser(userData)).unwrap();

      showToast(
        "success",
        "Registration successful. Please verify your email before logging in."
      );
      navigate(RouteSignIn);
    } catch (error) {
      console.error("Signup error:", error);
      showToast("error", error || "Registration failed");
    }
  }

  return (
    <section className="flex justify-center items-center min-h-screen w-full px-4 bg-background py-8">
      <AuthCard>
        <h1 className="text-2xl font-bold text-center mb-5">
          Create Your Account
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Name</FormLabel>
                    <FormControl>
                      <InputBox
                        placeholder="Enter your name"
                        icon={FaUser}
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
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Username</FormLabel>
                    <FormControl>
                      <InputBox
                        placeholder="Enter your username"
                        icon={FaAt}
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
                  </FormItem>
                )}
              />
            </div>
            <div className="mb-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Email</FormLabel>
                    <FormControl>
                      <InputBox
                        placeholder="Enter your email address"
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
                        placeholder="Enter your password"
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
                  </FormItem>
                )}
              />
            </div>
            <div className="mb-3">
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <InputBox
                        type="password"
                        placeholder="Enter password again"
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
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-5">
              <LoadingButton
                type="submit"
                className="w-full cursor-pointer"
                isLoading={loading || form.formState.isSubmitting}
                loadingText="Creating Account..."
              >
                Sign Up
              </LoadingButton>
              <div className="mt-5 text-sm flex justify-center items-center gap-2">
                <p>Already have account?</p>
                <Link className="text-primary hover:underline" to={RouteSignIn}>
                  Sign In
                </Link>
              </div>
            </div>
          </form>
        </Form>
      </AuthCard>
    </section>
  );
};

export default SignUp;
