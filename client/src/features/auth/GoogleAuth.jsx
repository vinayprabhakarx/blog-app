import React from "react";
import { Button } from "../../components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { auth, provider } from "../../utils/firebase";
import { signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { showToast } from "../../utils/showToast";
import { getRoleBasedRedirect } from "../../utils/RouteName";
import { useDispatch } from "react-redux";
import { googleAuth, getCurrentUser } from "./authSlice";

const GoogleAuth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async () => {
    try {
      const googleResponse = await signInWithPopup(auth, provider);
      const user = googleResponse.user;

      const tokenData = {
        name: user.displayName,
        email: user.email,
        profile_img: user.photoURL,
      };

      await dispatch(googleAuth(tokenData)).unwrap();

      const userData = await dispatch(getCurrentUser()).unwrap();
      const redirectPath = getRoleBasedRedirect(userData.user);

      showToast("success", "Google login successful!");
      navigate(redirectPath);
    } catch (error) {
      console.error("Google auth error:", error);
      showToast("error", error.message || "Google login failed");
    }
  };

  return (
    <Button className="w-full cursor-pointer" onClick={handleLogin}>
      <FcGoogle />
      Continue with Google
    </Button>
  );
};

export default GoogleAuth;
