import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Environment validation
const requiredEnvVars = {
  CLOUDINARY_APP_NAME: process.env.CLOUDINARY_APP_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error(
    "Missing required Cloudinary environment variables:",
    missingVars.join(", ")
  );
  console.error("Please ensure these variables are set in your .env file");
}

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_APP_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Upload image to Cloudinary
export const uploadImage = async (filePath, options = {}) => {
  try {
    const defaultOptions = {
      folder: "blog-app",
      resource_type: "auto",
      quality: "auto:good",
      fetch_format: "auto",
      ...options,
    };

    const result = await cloudinary.uploader.upload(filePath, defaultOptions);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Delete image from Cloudinary
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === "ok",
      result: result.result,
    };
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get optimized image URL
export const getOptimizedImageUrl = (publicId, options = {}) => {
  try {
    const defaultOptions = {
      quality: "auto:good",
      fetch_format: "auto",
      ...options,
    };

    return cloudinary.url(publicId, defaultOptions);
  } catch (error) {
    console.error("Cloudinary URL generation error:", error);
    return null;
  }
};

// Test connection
export const testCloudinaryConnection = async () => {
  try {
    await cloudinary.api.ping();
    return true;
  } catch (error) {
    console.error("❌ Cloudinary connection failed:", error.message);
    return false;
  }
};

export default cloudinary;
