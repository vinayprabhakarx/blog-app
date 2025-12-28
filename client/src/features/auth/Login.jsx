import React, { useEffect } from "react";
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
import { Link, useNavigate } from "react-router-dom";
import { RouteSignUp, getRoleBasedRedirect } from "../../utils/RouteName";
import { showToast } from "../../utils/showToast";
import GoogleAuth from "./GoogleAuth";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, getCurrentUser } from "../auth/authSlice";
import InputBox from "../../components/common/InputBox";
import LoadingButton from "../../components/common/LoadingButton";
import { FaEnvelope, FaLock } from "react-icons/fa6";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);
  const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Clear any stale tokens on mount to prevent redirect loops
  useEffect(() => {
    // Clear all auth-related items from localStorage
    const token = localStorage.getItem("token");
    if (token) {
      console.log("Login page: Clearing stale token and auth state");
      localStorage.removeItem("token");
      // CRITICAL: Also clear Redux state to prevent PublicRoute from redirecting
      dispatch({ type: 'auth/logout' });
    }
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
      showToast("error", errorMessage);
    }
  }

  return (
    <div className="flex justify-center items-center h-screen w-screen bg-background">
      <Card className="w-[400px] p-5 bg-background text-foreground">
        <h1 className="text-2xl font-bold text-center mb-5">
          Login into Account
        </h1>
        <div className="">
          <GoogleAuth />
          <div className="border my-5 flex justify-center items-center">
            <span className="absolute bg-text text-sm">Or</span>
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
                        {...field}
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
                        {...field}
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

              <div className="mt-3 text-sm text-muted-foreground flex justify-between items-center">
                <span>Didn't get verification email?</span>
                <Link
                  to="/resend-email"
                  className="text-primary hover:underline"
                >
                  Resend
                </Link>
              </div>

              <div className="mt-5 text-sm text-muted-foreground flex justify-center items-center gap-2">
                <p>Don&apos;t have account?</p>
                <Link className="text-primary hover:underline" to={RouteSignUp}>
                  Sign Up
                </Link>
              </div>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
