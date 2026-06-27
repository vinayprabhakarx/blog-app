import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, XCircle, ArrowRight, Mail, RefreshCw } from "lucide-react";
import authService from "./authService";
import LoadingSpinner from "@/components/common/LoadingSpinner";

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

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="flex flex-col items-center text-center space-y-6">
            <Mail className="w-12 h-12 text-muted-foreground" strokeWidth={1.5} />
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Verifying Email</h1>
              <p className="text-muted-foreground text-sm">
                Please wait a moment while we verify your link.
              </p>
            </div>
            <LoadingSpinner />
          </div>
        );

      case "success":
        return (
          <div className="flex flex-col items-center text-center space-y-6">
            <CheckCircle className="w-12 h-12 text-success" strokeWidth={1.5} />
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Email Verified</h1>
              <p className="text-muted-foreground text-sm">
                {message || "Your email has been verified successfully. Welcome aboard!"}
              </p>
            </div>
            <div className="pt-4">
              <Link to="/login">
                <Button size="lg" className="px-8">
                  Continue to Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        );

      case "already":
        return (
          <div className="flex flex-col items-center text-center space-y-6">
            <CheckCircle className="w-12 h-12 text-foreground" strokeWidth={1.5} />
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Already Verified</h1>
              <p className="text-muted-foreground text-sm">
                {message || "Your email is already verified. You can proceed to sign in."}
              </p>
            </div>
            <div className="pt-4">
              <Link to="/login">
                <Button size="lg" className="px-8">
                  Go to Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        );

      case "expired":
        return (
          <div className="flex flex-col items-center text-center space-y-6">
            <AlertTriangle className="w-12 h-12 text-warning" strokeWidth={1.5} />
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Link Expired</h1>
              <p className="text-muted-foreground text-sm">
                {message || "This verification link has expired. Please request a new one."}
              </p>
            </div>
            <div className="pt-4 flex flex-col items-center space-y-3">
              <Link to="/resend-email">
                <Button size="lg" className="px-8">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Request New Link
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        );

      default: // invalid
        return (
          <div className="flex flex-col items-center text-center space-y-6">
            <XCircle className="w-12 h-12 text-destructive" strokeWidth={1.5} />
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Verification Failed</h1>
              <p className="text-muted-foreground text-sm">
                {message || "This verification link is invalid or has already been used."}
              </p>
            </div>
            <div className="pt-4 flex flex-col items-center space-y-3">
              <Link to="/resend-email">
                <Button size="lg" className="px-8">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Request New Link
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        );
    }
  };

  return (
    <section className="flex justify-center items-center min-h-[80vh] w-full bg-background px-4">
      <div className="w-full max-w-sm mx-auto">
        {renderContent()}
      </div>
    </section>
  );
};

export default VerifyEmail;
