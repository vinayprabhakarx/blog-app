import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FaGoogle } from "react-icons/fa";
import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { showToast } from "@/utils/showToast";
import { getRoleBasedRedirect } from "@/utils/RouteName";
import { useDispatch } from "react-redux";
import { googleAuth, getCurrentUser } from "./authSlice";

const GoogleAuth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        // We pass the access_token to the backend, which can fetch the user profile
        // Wait, wait! useGoogleLogin by default returns an access_token. 
        // If we want an id_token, we must use flow: 'implicit' and it doesn't give id_token directly unless we use GoogleLogin component.
        // Actually, let's use the access_token. The backend can fetch the profile using the access token. 
        // Let me rethink this... I should just send the access_token to the backend.
        await dispatch(googleAuth({ access_token: tokenResponse.access_token })).unwrap();

        const userData = await dispatch(getCurrentUser()).unwrap();
        const redirectPath = getRoleBasedRedirect(userData.user);

        showToast("success", "Google login successful!");
        navigate(redirectPath);
      } catch (error) {
        console.error("Google auth error:", error);
        const errorMsg = typeof error === 'string' 
          ? error 
          : (error?.message || "Google login failed");
        showToast("error", typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      } finally {
        setIsLoading(false);
      }
    },
    onError: errorResponse => {
      console.error("Google login failed", errorResponse);
      showToast("error", "Google login failed. Please try again.");
    }
  });

  return (
    <Button 
      className="w-full cursor-pointer" 
      onClick={() => login()}
      disabled={isLoading}
    >
      <FaGoogle className="w-5 h-5 mr-2" />
      {isLoading ? "Signing in..." : "Continue with Google"}
    </Button>
  );
};

export default GoogleAuth;
