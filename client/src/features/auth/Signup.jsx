import React from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "../../components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { RouteSignIn } from "../../utils/RouteName";
import { showToast } from "../../utils/showToast";
import GoogleAuth from "./GoogleAuth";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../auth/authSlice";
import InputBox from "../../components/common/InputBox";
import LoadingButton from "../../components/common/LoadingButton";
import { FaUser, FaAt, FaEnvelope, FaLock } from "react-icons/fa6";

const SignUp = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const formSchema = z
    .object({
      name: z.string().min(3, "Name must be at least 3 characters long."),
      username: z
        .string()
        .min(3, "Username must be at least 3 characters long."),
      email: z.string().email(),
      password: z
        .string()
        .min(6, "Password must be at least 6 characters long"),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Password and confirm password should be same.",
      path: ["confirmPassword"],
    });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

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
    <div className="flex justify-center items-center min-h-screen w-screen bg-background py-8">
      <Card className="w-[400px] p-5 bg-background text-foreground">
        <h1 className="text-2xl font-bold text-center mb-5">
          Create Your Account
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Name</FormLabel>
                    <FormControl>
                      <InputBox
                        placeholder="Enter your name"
                        icon={FaUser}
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
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Username</FormLabel>
                    <FormControl>
                      <InputBox
                        placeholder="Enter your username"
                        icon={FaAt}
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Email</FormLabel>
                    <FormControl>
                      <InputBox
                        placeholder="Enter your email address"
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
                        placeholder="Enter your password"
                        icon={FaLock}
                        showPasswordToggle={true}
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
                        {...field}
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
      </Card>
    </div>
  );
};

export default SignUp;
