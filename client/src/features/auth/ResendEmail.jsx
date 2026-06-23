import React, { useState, useEffect, useRef } from "react";
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
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { RouteLogin, RouteSignUp } from "@/utils/RouteName";
import { showToast } from "@/utils/showToast";
import authService from "./authService";
import InputBox from "@/components/common/InputBox";
import LoadingButton from "@/components/common/LoadingButton";
import { FaEnvelope } from "react-icons/fa6";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
});

const ResendEmail = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const debounceTimerRef = useRef(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onBlur", // Show errors when user leaves field
    defaultValues: {
      email: "",
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
        form.trigger(fieldName);
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
      setIsLoading(true);
      const res = await authService.resendVerification(values.email);
      showToast(
        "success",
        res?.message || "Verification email sent successfully!"
      );
      setSentEmail(values.email);
      setEmailSent(true);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        "Failed to send verification email. Please try again.";
      showToast("error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  const handleResendAgain = () => {
    setEmailSent(false);
    form.reset();
  };

  if (emailSent) {
    return (
      <div className="flex justify-center items-center min-h-screen w-full px-4 bg-background">
        <Card className="w-[400px] max-w-full p-6 bg-background text-foreground">
          <div className="text-center space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
            </div>

            {/* Success Title */}
            <div>
              <h1 className="text-2xl font-bold mb-2">Email Sent!</h1>
              <p className="text-muted-foreground text-sm">
                We've sent a verification email to
              </p>
              <p className="text-foreground font-medium mt-1">{sentEmail}</p>
            </div>

            {/* Instructions */}
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Please check your inbox and click the verification link.</p>
              <p>
                If you don't see the email, check your spam folder.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResendAgain}
              >
                <Mail className="w-4 h-4 mr-2" />
                Send to Different Email
              </Button>

              <Link to={RouteLogin} className="block">
                <Button className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen w-full px-4 bg-background">
      <Card className="w-[400px] max-w-full p-6 bg-background text-foreground">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
          </div>
          <h1 className="text-2xl font-bold mb-2">Resend Verification Email</h1>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Email Address</FormLabel>
                  <FormControl>
                    <InputBox
                      placeholder="Enter your email"
                      icon={FaEnvelope}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <LoadingButton
                type="submit"
                className="w-full cursor-pointer"
                isLoading={isLoading}
                loadingText="Sending..."
              >
                Send Verification Email
              </LoadingButton>
            </div>
          </form>
        </Form>

        {/* Footer Links */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground text-center space-y-2">
            <div>
              <span>Already verified? </span>
              <Link className="text-primary hover:underline" to={RouteLogin}>
                Sign In
              </Link>
            </div>
            <div>
              <span>Don't have an account? </span>
              <Link className="text-primary hover:underline" to={RouteSignUp}>
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ResendEmail;
