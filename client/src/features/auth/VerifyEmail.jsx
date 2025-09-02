import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import authService from "./authService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
} from "react-icons/fa";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const statusParam = searchParams.get("status");

  const [status, setStatus] = React.useState("loading");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    // If backend redirected with status param, show it without further API calls
    if (statusParam) {
      if (statusParam === "success") {
        setStatus("success");
        setMessage("Email verified successfully");
      } else if (statusParam === "already") {
        setStatus("already");
        setMessage("Email is already verified");
      } else if (statusParam === "expired") {
        setStatus("expired");
        setMessage("Verification link expired");
      } else {
        setStatus("invalid");
        setMessage("Invalid verification link");
      }
      return;
    }

    const run = async () => {
      if (!token) {
        setStatus("invalid");
        setMessage("Invalid verification link");
        return;
      }
      try {
        const res = await authService.verifyEmail(token);
        setStatus("success");
        setMessage(res?.message || "Email verified successfully");
      } catch (e) {
        const apiMsg = e?.response?.data?.message || "Verification failed";
        if (/expired/i.test(apiMsg)) {
          setStatus("expired");
          setMessage("Verification link expired");
        } else if (/invalid/i.test(apiMsg)) {
          setStatus("invalid");
          setMessage("Invalid verification link");
        } else {
          setStatus("error");
          setMessage(apiMsg);
        }
      }
    };
    run();
  }, [token, statusParam]);

  const Wrapper = ({ children }) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="max-w-xl w-full text-center text-foreground">
        {children}
      </div>
    </div>
  );

  if (status === "loading") {
    return (
      <Wrapper>
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner />
          <p className="text-base opacity-80">Verifying your email...</p>
        </div>
      </Wrapper>
    );
  }

  if (status === "success") {
    return (
      <Wrapper>
        <div className="flex flex-col items-center gap-4">
          <FaCheckCircle className="text-success" size={64} />
          <h1 className="text-3xl font-semibold">Email verified</h1>
          <p className="opacity-80">{message}</p>
          <Link to="/login" className="text-primary hover:underline">
            Continue to login
          </Link>
        </div>
      </Wrapper>
    );
  }

  if (status === "already") {
    return (
      <Wrapper>
        <div className="flex flex-col items-center gap-4">
          <FaCheckCircle className="text-success" size={64} />
          <h1 className="text-3xl font-semibold">Email already verified</h1>
          <p className="opacity-80">{message}</p>
          <Link to="/login" className="text-primary hover:underline">
            Continue to login
          </Link>
        </div>
      </Wrapper>
    );
  }

  if (status === "expired") {
    return (
      <Wrapper>
        <div className="flex flex-col items-center gap-4">
          <FaExclamationTriangle className="text-warning" size={64} />
          <h1 className="text-3xl font-semibold">Verification link expired</h1>
          <p className="opacity-80">{message}</p>
          <Link to="/login" className="text-primary hover:underline">
            Resend from login page
          </Link>
        </div>
      </Wrapper>
    );
  }

  // invalid or general error
  return (
    <Wrapper>
      <div className="flex flex-col items-center gap-4">
        <FaTimesCircle className="text-destructive" size={64} />
        <h1 className="text-3xl font-semibold">Verification failed</h1>
        <p className="opacity-80">{message || "Invalid verification link"}</p>
        <Link to="/login" className="text-primary hover:underline">
          Go to login
        </Link>
      </div>
    </Wrapper>
  );
};

export default VerifyEmail;
