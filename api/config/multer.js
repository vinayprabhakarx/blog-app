import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads", "temp");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename to prevent conflicts
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const fileName = `${file.fieldname}-${uniqueSuffix}${fileExtension}`;
    cb(null, fileName);
  },
});

// File validation
function fileFilter(req, file, cb) {
  const allowedMimeTypes = [
    "image/png",
    "image/jpg",
    "image/jpeg",
    "image/webp",
    "image/gif",
  ];

  const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

  // Check MIME type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error(
        `Invalid file type. Only images are allowed. Received: ${file.mimetype}`
      ),
      false
    );
  }

  // Check file extension
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    return cb(
      new Error(
        `Invalid file extension. Allowed: ${allowedExtensions.join(", ")}`
      ),
      false
    );
  }

  // Validate filename
  const fileName = file.originalname;
  if (
    fileName.includes("..") ||
    fileName.includes("/") ||
    fileName.includes("\\")
  ) {
    return cb(
      new Error("Invalid file name. File name contains forbidden characters."),
      false
    );
  }

  cb(null, true);
}

// Upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 10,
    fieldNameSize: 100,
    fieldSize: 1024 * 1024,
  },

  onError: function (err, next) {
    console.error("Multer error:", err);
    next(err);
  },
});

// Multer error handler
export const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          success: false,
          message: "File too large. Maximum size is 5MB.",
          error: "FILE_TOO_LARGE",
        });
      case "LIMIT_FILE_COUNT":
        return res.status(400).json({
          success: false,
          message: "Too many files. Maximum 1 file allowed.",
          error: "TOO_MANY_FILES",
        });
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          success: false,
          message: "Unexpected file field.",
          error: "UNEXPECTED_FILE",
        });
      default:
        return res.status(400).json({
          success: false,
          message: "File upload error: " + error.message,
          error: "UPLOAD_ERROR",
        });
    }
  } else if (
    error.message.includes("Only images are allowed") ||
    error.message.includes("Invalid file")
  ) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: "INVALID_FILE_TYPE",
    });
  }

  next(error);
};

// Clean up temporary files
export const cleanupTempFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error(`Failed to cleanup temporary file: ${filePath}`, error);
    }
  }
};

export default upload;
