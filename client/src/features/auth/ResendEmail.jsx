import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "../../components/ui/card";
import { Link } from "react-router-dom";
import { RouteLogin, RouteSignUp } from "../../utils/RouteName";
import { showToast } from "../../utils/showToast";
import authService from "./authService";
import InputBox from "../../components/common/InputBox";
import LoadingButton from "../../components/common/LoadingButton";
import { FaEnvelope } from "react-icons/fa6";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "../../components/ui/button";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const ResendEmail = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

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
      <div className="flex justify-center items-center h-screen w-screen bg-background">
        <Card className="w-[400px] p-6 bg-background text-foreground">
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
    <div className="flex justify-center items-center h-screen w-screen bg-background">
      <Card className="w-[400px] p-6 bg-background text-foreground">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-7 h-7 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Resend Verification Email</h1>
          <p className="text-muted-foreground text-sm">
            Enter your email address and we'll send you a new verification link.
          </p>
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
