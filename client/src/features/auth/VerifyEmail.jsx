import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { CheckCircle, AlertTriangle, XCircle, ArrowRight, Mail, RefreshCw } from "lucide-react";
import authService from "./authService";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const statusParam = searchParams.get("status");

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // If already have a status param (from previous redirect flow), use it
    if (statusParam) {
      setStatus(statusParam);
      return;
    }

    // If we have a token, verify it via API
    if (token) {
      const verifyToken = async () => {
        try {
          const response = await authService.verifyEmail(token);
          setStatus("success");
          setMessage(response?.message || "Email verified successfully!");
        } catch (error) {
          const errorMsg = error?.response?.data?.message || "Verification failed";
          if (/expired/i.test(errorMsg)) {
            setStatus("expired");
            setMessage("This verification link has expired.");
          } else if (/already/i.test(errorMsg)) {
            setStatus("already");
            setMessage("Your email is already verified.");
          } else {
            setStatus("invalid");
            setMessage(errorMsg);
          }
        }
      };
      verifyToken();
    } else {
      // No token and no status = invalid
      setStatus("invalid");
      setMessage("No verification token provided.");
    }
  }, [token, statusParam]);

  // Loading state
  if (status === "loading") {
    return (
      <section className="flex justify-center items-center min-h-screen w-full bg-background px-4">
        <Card className="w-[440px] max-w-full p-8 bg-background text-foreground border shadow-lg">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                <Mail className="w-10 h-10 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Verifying Your Email</h1>
              <p className="text-muted-foreground">Please wait while we verify your email address...</p>
            </div>
            <div className="flex justify-center">
              <LoadingSpinner />
            </div>
          </div>
        </Card>
      </section>
    );
  }

  // Success state
  if (status === "success") {
    return (
      <section className="flex justify-center items-center min-h-screen w-full bg-background px-4">
        <Card className="w-[440px] max-w-full p-8 bg-background text-foreground border shadow-lg">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2 text-green-500">Email Verified!</h1>
              <p className="text-muted-foreground">{message || "Your email has been verified successfully."}</p>
            </div>
            <Link to="/login" className="block">
              <Button className="w-full">
                Continue to Sign In
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  // Already verified state
  if (status === "already") {
    return (
      <section className="flex justify-center items-center min-h-screen w-full bg-background px-4">
        <Card className="w-[440px] max-w-full p-8 bg-background text-foreground border shadow-lg">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-blue-500" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Already Verified</h1>
              <p className="text-muted-foreground">{message || "Your email is already verified. You can proceed to sign in."}</p>
            </div>
            <Link to="/login" className="block">
              <Button className="w-full">
                Go to Sign In
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  // Expired state
  if (status === "expired") {
    return (
      <section className="flex justify-center items-center min-h-screen w-full bg-background px-4">
        <Card className="w-[440px] max-w-full p-8 bg-background text-foreground border shadow-lg">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-yellow-500" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2 text-yellow-500">Link Expired</h1>
              <p className="text-muted-foreground">{message || "This verification link has expired. Please request a new one."}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-left">
              <p className="text-sm text-muted-foreground">
                Verification links expire after 24 hours for security reasons. Request a new link to continue.
              </p>
            </div>
            <div className="space-y-3">
              <Link to="/resend-email" className="block">
                <Button className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Request New Link
                </Button>
              </Link>
              <Link to="/login" className="block">
                <Button variant="outline" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>
    );
  }

  // Invalid or error state (default)
  return (
    <section className="flex justify-center items-center min-h-screen w-full bg-background px-4">
      <Card className="w-[440px] max-w-full p-8 bg-background text-foreground border shadow-lg">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2 text-destructive">Verification Failed</h1>
            <p className="text-muted-foreground">
              {message || "This verification link is invalid or has been used."}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-left">
            <p className="text-sm text-muted-foreground">
              If you continue to experience issues, please try requesting a new verification link.
            </p>
          </div>
          <div className="space-y-3">
            <Link to="/resend-email" className="block">
              <Button className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Request New Link
              </Button>
            </Link>
            <Link to="/login" className="block">
              <Button variant="outline" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </section>
  );
};

export default VerifyEmail;
