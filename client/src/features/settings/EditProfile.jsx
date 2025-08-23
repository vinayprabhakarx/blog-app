import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useDispatch, useSelector } from "react-redux";
import {
  updateProfile,
  clearProfileUpdateStatus,
  removeProfileImage,
  clearProfileImageRemovalStatus,
} from "./settingsSlice";
import { updateUserProfile } from "../auth/authSlice";
import { showToast } from "../../utils/showToast";
import LoadingButton from "../../components/common/LoadingButton";
import InputBox from "../../components/common/InputBox";
import SocialInputBox from "../../components/common/SocialInputBox";
import ImageCropper from "../../components/common/ImageCropper";
import {
  FaUser,
  FaEnvelope,
  FaAt,
  FaGlobe,
  FaLinkedin,
  FaGithub,
  FaYoutube,
  FaFacebook,
  FaXTwitter,
  FaInstagram,
  FaArrowLeft,
  FaPlus,
} from "react-icons/fa6";

import LoadingSpinner from "../../components/common/LoadingSpinner";
import userService from "../user_management/usersService";

const EditProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const dispatch = useDispatch();
  const {
    profileUpdateLoading,
    profileUpdateSuccess,
    profileUpdateError,
    profileImageRemovalLoading,
    profileImageRemovalSuccess,
    profileImageRemovalError,
  } = useSelector((state) => state.settings);
  // Get token from localStorage since it's not in user object
  const access_token = localStorage.getItem("token");

  const bioLimit = 150;
  const [characterLeft, setCharacterLeft] = useState(bioLimit);

  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    bio: "",
    social_links: {
      website: "",
      facebook: "",
      twitter: "",
      instagram: "",
      linkedin: "",
      github: "",
      youtube: "",
    },
  });

  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  // Upload profile image
  const uploadProfileImage = async (imageFile) => {
    if (!imageFile || !user?._id) {
      showToast("error", "No image or user ID available");
      return;
    }

    try {
      setImageUploadLoading(true);

      const imageFormData = new FormData();
      imageFormData.append("profileImage", imageFile);

      // Upload only the image
      const result = await userService.updateProfile(user._id, imageFormData);

      if (result.success) {
        showToast("success", "Profile image updated successfully!");

        // Update image preview
        if (result.user?.personal_info?.profile_img) {
          setImagePreview(result.user.personal_info.profile_img);
        }

        // Update user profile
        if (result.user) {
          dispatch(
            updateUserProfile({
              personal_info: {
                ...result.user.personal_info,
                profile_img: result.user.personal_info?.profile_img,
              },
              avatar:
                result.user.personal_info?.profile_img || result.user.avatar,
            })
          );

          // Update image preview
          if (result.user.personal_info?.profile_img) {
            setImagePreview(result.user.personal_info.profile_img);
          }
        }

        // Reset profile image
        setProfileImage(null);

        // Clear profile update status
        dispatch(clearProfileUpdateStatus());

        // Refresh user data
        try {
          const refreshedUser = await userService.getCurrentUserProfile();
          if (refreshedUser.success && refreshedUser.user) {
            dispatch(
              updateUserProfile({
                ...refreshedUser.user,
                personal_info: refreshedUser.user.personal_info,
                avatar:
                  refreshedUser.user.personal_info?.profile_img ||
                  refreshedUser.user.avatar,
              })
            );
          }
        } catch (error) {
          console.error("Failed to refresh user data:", error);
        }
      } else {
        throw new Error(result.message || "Image upload failed");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      showToast("error", error.message || "Failed to upload profile image");
      throw error;
    } finally {
      setImageUploadLoading(false);
    }
  };

  const handleRemoveSelectedImage = () => {
    setProfileImage(null);
    setSelectedImageUrl("");
    setImagePreview("");
    showToast("info", "Selected image removed");
  };

  const handleRemoveProfileImage = async () => {
    if (!user?._id) {
      showToast("error", "No user ID available");
      return;
    }

    try {
      const result = await dispatch(removeProfileImage(user._id)).unwrap();

      if (result) {
        showToast("success", "Profile image removed successfully!");

        setImagePreview("");

        dispatch(
          updateUserProfile({
            personal_info: {
              ...result.personal_info,
              profile_img: "",
            },
            avatar: "",
          })
        );

        dispatch(clearProfileImageRemovalStatus());
      }
    } catch (error) {
      console.error("Error removing profile image:", error);
      showToast("error", error.message || "Failed to remove profile image");
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    if (access_token && user?.personal_info?.username) {
      userService
        .getPublicProfile(user.personal_info.username)
        .then(({ user: profileData }) => {
          clearTimeout(timeoutId);
          setFormData({
            name: profileData.personal_info?.name || "",
            username: profileData.personal_info?.username || "",
            email: profileData.personal_info?.email || "",
            bio: profileData.personal_info?.bio || "",
            social_links: {
              website: profileData.social_links?.website ?? "",
              facebook: profileData.social_links?.facebook ?? "",
              twitter: profileData.social_links?.twitter ?? "",
              instagram: profileData.social_links?.instagram ?? "",
              linkedin: profileData.social_links?.linkedin ?? "",
              github: profileData.social_links?.github ?? "",
              youtube: profileData.social_links?.youtube ?? "",
            },
          });
          setImagePreview(profileData.personal_info?.profile_img || "");
          setIsLoading(false);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          console.error("Error fetching profile:", error);
          setIsLoading(false);
        });
    } else if (access_token && user) {
      clearTimeout(timeoutId);
      setFormData({
        name: user.name || user.personal_info?.name || "",
        username: user.personal_info?.username || "",
        email: user.email || user.personal_info?.email || "",
        bio: user.personal_info?.bio || "",
        social_links: {
          website: user.social_links?.website ?? "",
          facebook: user.social_links?.facebook ?? "",
          twitter: user.social_links?.twitter ?? "",
          instagram: user.social_links?.instagram ?? "",
          linkedin: user.social_links?.linkedin ?? "",
          github: user.social_links?.github ?? "",
          youtube: user.social_links?.youtube ?? "",
        },
      });
      setImagePreview(user.avatar || user.personal_info?.profile_img || "");
      setIsLoading(false);
    } else if (!access_token) {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }

    return () => clearTimeout(timeoutId);
  }, [access_token, user]);

  // Handle profile update success and error
  useEffect(() => {
    if (profileUpdateSuccess) {
      showToast("success", "Profile updated successfully!");
      dispatch(clearProfileUpdateStatus());
    }

    if (profileUpdateError) {
      showToast("error", profileUpdateError);
      dispatch(clearProfileUpdateStatus());
    }
  }, [profileUpdateSuccess, profileUpdateError, dispatch]);

  // Clear status when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearProfileUpdateStatus());
    };
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "bio") {
      setCharacterLeft(bioLimit - value.length);
    }

    if (name.includes("social_")) {
      const socialKey = name.replace("social_", "");
      setFormData((prev) => ({
        ...prev,
        social_links: {
          ...prev.social_links,
          [socialKey]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        showToast(
          "error",
          "Please select a valid image file (JPEG, PNG, or WebP)"
        );
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast("error", "Image size should be less than 5MB");
        return;
      }

      const imageUrl = URL.createObjectURL(file);
      setSelectedImageUrl(imageUrl);
      setShowCropper(true);
    }
  };

  const handleCropComplete = async (croppedImageUrl) => {
    try {
      // Convert the cropped image URL to a File object
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const croppedFile = new File([blob], "profile-image.jpg", {
        type: "image/jpeg",
      });

      setProfileImage(croppedFile);
      setImagePreview(croppedImageUrl);
      setShowCropper(false);

      // Clean up the original image URL
      URL.revokeObjectURL(selectedImageUrl);
      setSelectedImageUrl("");

      showToast(
        "success",
        "Image cropped successfully! Click 'Upload Image' to save it."
      );
    } catch (error) {
      console.error("Error processing cropped image:", error);
      showToast("error", "Failed to process cropped image");
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    URL.revokeObjectURL(selectedImageUrl);
    setSelectedImageUrl("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formDataToSend = new FormData();

      if (formData.name)
        formDataToSend.append("name", formData.name.trim().toUpperCase());
      if (formData.username)
        formDataToSend.append(
          "username",
          formData.username.trim().toLowerCase()
        );
      if (formData.email) formDataToSend.append("email", formData.email);
      if (formData.bio) formDataToSend.append("bio", formData.bio);

      const socialLinksData = {};
      Object.entries(formData.social_links).forEach(([key, value]) => {
        socialLinksData[key] = value || "";
      });
      formDataToSend.append("socialLinks", JSON.stringify(socialLinksData));

      const result = await dispatch(
        updateProfile({
          userId: user._id,
          profileData: formDataToSend,
        })
      ).unwrap();

      showToast("success", "Profile updated successfully!");

      if (result) {
        setFormData((prev) => ({
          ...prev,
          name: result.personal_info?.name || prev.name,
          username: result.personal_info?.username || prev.username,
          bio: result.personal_info?.bio || prev.bio,
          social_links: {
            website: result.social_links?.website ?? prev.social_links.website,
            facebook:
              result.social_links?.facebook ?? prev.social_links.facebook,
            twitter: result.social_links?.twitter ?? prev.social_links.twitter,
            instagram:
              result.social_links?.instagram ?? prev.social_links.instagram,
            linkedin:
              result.social_links?.linkedin ?? prev.social_links.linkedin,
            github: result.social_links?.github ?? prev.social_links.github,
            youtube: result.social_links?.youtube ?? prev.social_links.youtube,
          },
        }));

        dispatch(
          updateUserProfile({
            personal_info: {
              ...result.personal_info,
              name: result.personal_info?.name,
              username: result.personal_info?.username,
              email: result.personal_info?.email,
              bio: result.personal_info?.bio,
              profile_img: result.personal_info?.profile_img,
            },
            social_links: result.social_links,
            avatar: result.personal_info?.profile_img || user?.avatar,
          })
        );

        if (result.personal_info?.profile_img) {
          setImagePreview(result.personal_info.profile_img);
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast(
        "error",
        error?.message || "Failed to update profile. Please try again."
      );
    }
  };

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (isLoading && user) {
    return (
      <div className="text-center py-8">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">Loading profile data...</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full px-4 py-6 sm:px-6 sm:py-8"
      style={{
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center mb-4">
            <Link
              to="/profile"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm sm:text-base"
            >
              <FaArrowLeft size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Back to Profile</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </div>
          <div className="text-center">
            <h1
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2"
              style={{ color: "var(--foreground)" }}
            >
              Edit Profile
            </h1>
          </div>

          {/* Error Display */}
          {profileUpdateError && (
            <div
              className="mt-4 p-3 rounded-lg text-sm text-center"
              style={{
                backgroundColor: "var(--destructive)",
                color: "var(--destructive-foreground)",
              }}
            >
              {profileUpdateError}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <div className="flex flex-col lg:flex-row items-start gap-6 sm:gap-8 lg:gap-10">
            {/* Profile Image Section */}
            <div className="w-full lg:w-auto flex flex-col items-center">
              <label
                htmlFor="uploadImg"
                className="relative block w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full overflow-hidden cursor-pointer border-4 border-dashed transition-all duration-200 hover:border-opacity-100"
                style={{ borderColor: "var(--border)" }}
              >
                <div
                  className="w-full h-full absolute top-0 left-0 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-full"
                  style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
                >
                  <span className="text-center">
                    <FaPlus className="w-8 h-8 mb-2 mx-auto block" />
                    Upload Image
                  </span>
                </div>
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--muted)" }}
                  >
                    <FaPlus className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </label>

              <input
                id="uploadImg"
                name="profileImage"
                accept=".jpg,.jpeg,.png,.webp"
                hidden
                type="file"
                onChange={handleImageChange}
              />

              {/* Current image status */}
              {imagePreview && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-muted-foreground">
                    {profileImage
                      ? "Cropped image ready to upload"
                      : "Current profile image"}
                  </p>
                </div>
              )}

              {/* Remove Profile Image Button */}
              {imagePreview && !profileImage && (
                <button
                  type="button"
                  onClick={handleRemoveProfileImage}
                  disabled={profileImageRemovalLoading}
                  className="mt-4 text-red-500 hover:text-red-700 text-sm underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {profileImageRemovalLoading
                    ? "Removing..."
                    : "Remove Profile Image"}
                </button>
              )}

              {/* Remove Selected Image Button */}
              {profileImage && (
                <button
                  type="button"
                  onClick={handleRemoveSelectedImage}
                  className="mt-4 text-red-500 hover:text-red-700 text-sm underline cursor-pointer"
                >
                  Remove Selected Image
                </button>
              )}

              {/* Upload Button - Only for uploading, not selecting */}
              <LoadingButton
                type="button"
                onClick={async () => {
                  if (profileImage) {
                    try {
                      await uploadProfileImage(profileImage);
                    } catch (error) {
                      console.error("Upload failed:", error);
                    }
                  } else {
                    showToast("info", "Please select an image first");
                  }
                }}
                disabled={!profileImage}
                isLoading={imageUploadLoading}
                className="mt-4 px-6 py-2"
              >
                Upload Image
              </LoadingButton>

              {/* Image upload status */}
              {profileUpdateSuccess && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✓ Image uploaded successfully!
                  </p>
                </div>
              )}

              {/* Profile image removal status */}
              {profileImageRemovalSuccess && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✓ Profile image removed successfully!
                  </p>
                </div>
              )}

              {profileImageRemovalError && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    ✗ {profileImageRemovalError}
                  </p>
                </div>
              )}
            </div>

            {/* Form Fields Section */}
            <div className="flex-1 space-y-4 sm:space-y-6">
              {/* Name and Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <InputBox
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                    icon={FaUser}
                  />
                </div>
                <div>
                  <InputBox
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email"
                    disabled={user?.authProvider === "google"}
                    icon={FaEnvelope}
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <InputBox
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Username"
                  icon={FaAt}
                />
                <p
                  className="text-sm mt-2"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Username will be used to search for users and will be visible
                  to the public. Must be 3-20 characters, letters, numbers, and
                  underscores only.
                </p>
              </div>

              {/* Bio */}
              <div>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  maxLength={bioLimit}
                  className="w-full p-4 rounded-lg resize-none leading-7 transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: "var(--background)",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                    minHeight: "160px",
                  }}
                  placeholder="Tell us about yourself..."
                />
                <p
                  className="text-sm mt-2 text-right"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {characterLeft} characters left
                </p>
              </div>

              {/* Social Links */}
              <div>
                <p
                  className="text-base sm:text-lg font-medium mb-3 sm:mb-4"
                  style={{ color: "var(--foreground)" }}
                >
                  Social Links
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {Object.entries(formData.social_links).map(([key, value]) => (
                    <div key={key}>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "var(--foreground)" }}
                      >
                        {key === "website"
                          ? "Website"
                          : key.charAt(0).toUpperCase() + key.slice(1)}
                      </label>
                      {key === "website" ? (
                        <InputBox
                          name={`social_${key}`}
                          type="text"
                          value={value}
                          onChange={handleInputChange}
                          placeholder="https://example.com"
                          icon={FaGlobe}
                        />
                      ) : (
                        <SocialInputBox
                          name={`social_${key}`}
                          value={value}
                          onChange={handleInputChange}
                          placeholder="username"
                          prefix={
                            key === "linkedin"
                              ? "https://linkedin.com/in/"
                              : key === "twitter"
                              ? "https://x.com/"
                              : key === "instagram"
                              ? "https://instagram.com/"
                              : key === "github"
                              ? "https://github.com/"
                              : key === "youtube"
                              ? "https://youtube.com/@"
                              : key === "facebook"
                              ? "https://facebook.com/"
                              : "https://"
                          }
                          icon={
                            key === "twitter"
                              ? FaXTwitter
                              : key === "instagram"
                              ? FaInstagram
                              : key === "linkedin"
                              ? FaLinkedin
                              : key === "github"
                              ? FaGithub
                              : key === "youtube"
                              ? FaYoutube
                              : FaGlobe
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <LoadingButton
                type="submit"
                isLoading={profileUpdateLoading}
                className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
              >
                Update Profile
              </LoadingButton>
            </div>
          </div>
        </form>

        {/* Success Message */}
        {profileUpdateSuccess && (
          <div
            className="mt-6 p-4 rounded-lg text-center"
            style={{
              backgroundColor: "var(--success)",
              color: "var(--success-foreground)",
            }}
          >
            <p className="font-medium">Profile updated successfully!</p>
            <p className="text-sm mt-1">Your changes have been saved.</p>
          </div>
        )}
      </div>

      {/* Image Cropper Modal */}
      {showCropper && (
        <ImageCropper
          imageUrl={selectedImageUrl}
          onCrop={handleCropComplete}
          onClose={handleCropCancel}
        />
      )}
    </div>
  );
};

export default EditProfile;
