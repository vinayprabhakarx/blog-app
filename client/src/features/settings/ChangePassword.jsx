import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import InputBox from "@/components/common/InputBox";
import LoadingButton from "@/components/common/LoadingButton";
import { useAuth } from "@/hooks/useAuth";
import { useDispatch, useSelector } from "react-redux";
import { changePassword, clearPasswordChangeStatus } from "./settingsSlice";
import { showToast } from "@/utils/showToast";
import { FaLock, FaUnlock, FaArrowLeft } from "react-icons/fa6";
import AuthCard from "@/features/auth/AuthCard";

// Password change validation schema
const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const ChangePassword = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const { passwordChangeLoading, passwordChangeSuccess, passwordChangeError } =
    useSelector((state) => state.settings);

  const form = useForm({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (passwordChangeSuccess) {
      // Success is already handled in onSubmit, just clear the status
      dispatch(clearPasswordChangeStatus());
    }

    if (passwordChangeError) {
      showToast("error", passwordChangeError);
      dispatch(clearPasswordChangeStatus());
    }
  }, [passwordChangeSuccess, passwordChangeError, dispatch]);

  const onSubmit = async (data) => {
    try {
      await dispatch(
        changePassword({
          oldPassword: data.currentPassword,
          newPassword: data.newPassword,
        })
      ).unwrap();

      // Show success toast immediately
      showToast("success", "Password changed successfully!");

      // Reset form
      form.reset();
    } catch (error) {
      console.error("Error changing password:", error);
      // Error toast is handled by useEffect
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen w-full px-4 py-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You must be logged in to change your password.
          </p>
          <Link to="/login" className="text-primary hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen w-full px-4 py-6 sm:px-6 sm:py-8">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header - Outside Card */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center mb-4">
            <Link
              to="/profile"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm sm:text-base"
            >
              <FaArrowLeft size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Back to Profile</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Change Password
            </h1>
          </div>
        </div>

        <div className="w-full mx-auto mt-6" style={{ maxWidth: "448px" }}>
          <AuthCard className="w-full max-w-full! mx-0">
            {/* Conditional Content */}
            {user?.authProvider === "google" ? (
            // Google Auth Message - Centered
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <FaLock className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">
                    Password Change Not Available
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Google authenticated users cannot change their password.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Password Change Form for non-Google users
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 sm:space-y-6"
              >
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <InputBox
                          type="password"
                          placeholder="Enter your current password"
                          icon={FaUnlock}
                          showPasswordToggle={true}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <InputBox
                          type="password"
                          placeholder="Enter your new password"
                          icon={FaLock}
                          showPasswordToggle={true}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <InputBox
                          type="password"
                          placeholder="Confirm your new password"
                          icon={FaLock}
                          showPasswordToggle={true}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <LoadingButton
                  type="submit"
                  isLoading={passwordChangeLoading}
                  className="w-full px-6 py-2 sm:py-3 text-sm sm:text-base"
                >
                  Change Password
                </LoadingButton>
              </form>
            </Form>
          )}
        </AuthCard>
        </div>
      </div>
    </section>
  );
};

export default ChangePassword;
