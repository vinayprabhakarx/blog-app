import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "../../components/ui/card";
import { RouteLogin } from "../../utils/RouteName";
import { showToast } from "../../utils/showToast";
import authService from "./authService";
import LoadingButton from "../../components/common/LoadingButton";
import { FaEnvelope } from "react-icons/fa6";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const formSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      setIsLoading(true);
      const response = await authService.forgotPassword(values.email);
      showToast(
        "success",
        response.message ||
          "If your email exists, you will receive a password reset link."
      );
      setTimeout(() => {
        navigate(RouteLogin);
      }, 2000); // Give user time to see the success message
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to send reset email";
      showToast("error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-start pt-32 w-screen min-h-screen bg-background">
      <Card className="w-[400px] p-5 bg-background text-foreground">
        <h1 className="text-2xl font-bold text-center mb-6">
          Forgot your password?
        </h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                        <input
                          {...field}
                          type="email"
                          placeholder="Enter your email"
                          className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <LoadingButton
              type="submit"
              className="w-full cursor-pointer mt-4"
              isLoading={isLoading}
              loadingText="Sending..."
            >
              Send Reset Link
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

export default ForgotPassword;
