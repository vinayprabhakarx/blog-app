import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Card } from "../../components/ui/card";
import { RouteLogin } from "../../utils/RouteName";
import { showToast } from "../../utils/showToast";
import authService from "./authService";
import LoadingButton from "../../components/common/LoadingButton";
import InputBox from "../../components/common/InputBox";
import { FaLock, FaCheck } from "react-icons/fa6";
import { useTheme } from "../../utils/ThemeContext";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [isValidToken, setIsValidToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const formSchema = z
    .object({
      newPassword: z
        .string()
        .min(8, { message: "Password must be at least 8 characters" })
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
          {
            message:
              "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
          }
        ),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const validateToken = async () => {
      const tokenParam = searchParams.get("token");
      if (!tokenParam) {
        showToast("error", "Invalid or missing reset token");
        navigate(RouteLogin);
        return;
      }

      try {
        const response = await authService.validateResetToken(tokenParam);
        if (response.valid) {
          setToken(tokenParam);
          setEmail(response.email || "your account");
          setIsValidToken(true);
        } else {
          showToast(
            "error",
            response.message ||
              "This password reset link has expired or has already been used"
          );
          navigate(RouteLogin);
        }
      } catch (error) {
        showToast("error", "Failed to validate reset token");
        navigate(RouteLogin);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [searchParams, navigate]);


  const onSubmit = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      showToast("error", "Passwords do not match");
      return;
    }

    if (!token) {
      showToast("error", "Invalid or expired reset token");
      navigate(RouteLogin);
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.resetPassword(token, values.newPassword);
      showToast(
        "success",
        "Password has been reset successfully. You can now log in with your new password."
      );
      setTimeout(() => {
        navigate(RouteLogin);
      }, 2000);
    } catch (error) {
      let errorMessage = "Failed to reset password";
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage =
            error.response.data.message || "Invalid or expired reset link";
        } else if (error.response.status === 401) {
          errorMessage =
            "Your session has expired. Please request a new password reset link.";
          navigate(RouteLogin);
        }
      }
      showToast("error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className={`flex justify-center items-start pt-32 w-screen min-h-screen ${
          theme === "dark" ? "bg-background" : "bg-white"
        }`}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div
        className={`flex justify-center items-start pt-32 w-screen min-h-screen ${
          theme === "dark" ? "bg-background" : "bg-white"
        }`}
      >
        <Card className="w-[400px] p-5 bg-background text-foreground">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <FaCheck className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">
              Invalid or Expired Link
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              The password reset link is invalid or has expired. Please request
              a new one.
            </p>
            <Link
              to="/forgot-password"
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Request New Reset Link
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={`flex justify-center items-start pt-32 w-screen min-h-screen ${
        theme === "dark" ? "bg-background" : "bg-white"
      }`}
    >
      <Card className="w-[400px] p-5 bg-background text-foreground">
        <h1 className="text-2xl font-bold text-center mb-6">
          Reset Your Password
        </h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        New Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <InputBox
                            type="password"
                            placeholder="Enter new password"
                            icon={FaLock}
                            showPasswordToggle={true}
                            disabled={isSubmitting}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-sm text-red-500" />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Confirm New Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <InputBox
                            type="password"
                            placeholder="Confirm new password"
                            icon={FaLock}
                            showPasswordToggle={true}
                            disabled={isSubmitting}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-sm text-red-500" />
                    </FormItem>
                  );
                }}
              />
            </div>

            <LoadingButton
              type="submit"
              className="w-full cursor-pointer mt-4"
              isLoading={isSubmitting}
              loadingText="Resetting..."
            >
              Reset Password
            </LoadingButton>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">
                Remember your password?{" "}
              </span>
              <Link to={RouteLogin} className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPassword;
