import React, { useEffect, useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { showToast } from "../../utils/showToast";

import { setUser } from "@/redux/user/user.slice";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Loading from "@/components/Loading";
import { IoCameraOutline } from "react-icons/io5";
import LoadingButton from "@/components/LoadingButton";
import Dropzone from "react-dropzone";
import ImageCropper from "@/components/ImageCropper";
import userService from "./usersService";

const Profile = () => {
  const [filePreview, setPreview] = useState();
  const [selectedImage, setSelectedImage] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [file, setFile] = useState();
  const [croppedFile, setCroppedFile] = useState(); // New state for cropped file
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state

  const user = useSelector((state) => state.user);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch();

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        const profile = await userService.getCurrentUserProfile();
        setUserData({ success: true, user: profile.user || profile });
      } catch {
        showToast("error", "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (user.user?._id) {
      loadUserProfile();
    }
  }, [user.user?._id]);

  const formSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters long"),
    email: z.string().email(),
    bio: z.string().min(3, "Bio must be at least 3 characters long"),
    password: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
      password: "",
    },
  });

  useEffect(() => {
    if (userData && userData.success) {
      form.reset({
        name: userData.user.name,
        email: userData.user.email,
        bio: userData.user.bio,
      });
    }
  }, [userData, form]);

  const onSubmit = async (values) => {
    // Prevent multiple simultaneous submissions
    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();

      // Add form fields to FormData
      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("bio", values.bio);

      if (values.password && values.password.trim()) {
        formData.append("password", values.password);
      }

      // Use cropped file if available, otherwise use original file
      const fileToUpload = croppedFile || file;
      if (fileToUpload) {
        formData.append("file", fileToUpload);
      }

      const result = await userService.updateUserProfile(
        userData.user._id,
        formData
      );

      // Update Redux state with new user data
      dispatch(setUser(result.user));
      showToast("success", "Profile updated successfully!");

      // Update local userData state
      setUserData({ success: true, user: result.user });

      setPreview(null); // Clear local preview to show server avatar

      // Clear the file states after successful upload
      setFile(null);
      setCroppedFile(null);

      // Clean up any blob URLs
      if (filePreview && filePreview.startsWith("blob:")) {
        URL.revokeObjectURL(filePreview);
      }
    } catch (error) {
      showToast("error", error.message || "Failed to update profile");
    } finally {
      // Always reset submitting state, regardless of success or failure
      setIsSubmitting(false);
    }
  };

  const handleFileSelection = (files) => {
    const selectedFile = files[0];
    if (selectedFile) {
      const preview = URL.createObjectURL(selectedFile);
      setSelectedImage(preview);
      setIsCropping(true);
      setFile(selectedFile);
      // Clear previous cropped file when new file is selected
      setCroppedFile(null);
    }
  };

  // Convert blob URL to File object
  const blobToFile = async (blobUrl, fileName) => {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type });
  };

  const handleCropDone = async (croppedImageUrl) => {
    try {
      // Set preview to show cropped image
      setPreview(croppedImageUrl);

      // Convert the cropped image URL to a File object - keep original filename
      const fileName = file?.name || "avatar.jpg";
      const croppedFileObject = await blobToFile(croppedImageUrl, fileName);
      setCroppedFile(croppedFileObject);

      // Close the cropper
      setIsCropping(false);

      // Clean up the selected image URL
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
        setSelectedImage(null);
      }

      showToast("success", "Image cropped successfully!");
    } catch (error) {
      console.error("Error processing cropped image:", error);
      showToast("error", "Failed to process cropped image");
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    // Clean up URLs
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    }
    // Reset file states
    setFile(null);
    setPreview(null);
  };

  // Clean up URLs on component unmount
  useEffect(() => {
    return () => {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }
      if (filePreview && filePreview.startsWith("blob:")) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [selectedImage, filePreview]);

  if (loading) return <Loading />;

  return (
    <Card className="max-w-screen-md mx-auto">
      <CardContent>
        <div className="flex justify-center items-center mt-10">
          <Dropzone onDrop={handleFileSelection} accept={{ "image/*": [] }}>
            {({ getRootProps, getInputProps }) => (
              <div
                {...getRootProps()}
                className="group cursor-pointer relative"
              >
                <input {...getInputProps()} />
                <Avatar className="w-20 h-20">
                  <AvatarImage
                    src={
                      filePreview
                        ? filePreview
                        : userData?.user?.personal_info?.profile_img ||
                          userData?.user?.avatar
                    }
                    alt={
                      userData?.user?.personal_info?.name ||
                      userData?.user?.name
                    }
                  />
                  <AvatarFallback>
                    <img
                      src="https://github.com/shadcn.png"
                      alt="Fallback"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </AvatarFallback>
                  <div className="absolute inset-0 bg-black/30 border-2  rounded-full hidden group-hover:flex justify-center items-center z-10">
                    <IoCameraOutline className="text-primary-foreground text-xl" />
                  </div>
                </Avatar>
              </div>
            )}
          </Dropzone>
        </div>

        {isCropping && selectedImage && (
          <ImageCropper
            imageUrl={selectedImage}
            onClose={handleCropCancel}
            onCrop={handleCropDone}
          />
        )}

        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="mb-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your Name" {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your Email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mb-3">
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter Bio" {...field} />
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your Password"
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
                  className="w-full"
                  isLoading={isSubmitting}
                  loadingText="Updating..."
                >
                  Update
                </LoadingButton>
              </div>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
};

export default Profile;
