// Error handling utilities
export const handleError = (statusCode, message, details = null) => {
  const error = new Error();
  error.statusCode = statusCode;
  error.message = message;
  error.timestamp = new Date().toISOString();

  if (details) {
    error.details = details;
  }

  error.type = getErrorType(statusCode);

  if (statusCode >= 500) {
    console.error(`[${error.timestamp}] Server Error ${statusCode}:`, {
      message,
      details,
      stack: error.stack,
    });
  }

  return error;
};

// Categorize error types
const getErrorType = (statusCode) => {
  if (statusCode >= 400 && statusCode < 500) {
    return "CLIENT_ERROR";
  } else if (statusCode >= 500) {
    return "SERVER_ERROR";
  } else {
    return "UNKNOWN";
  }
};

// Validation error helper
export const validationError = (field, message) => {
  return handleError(400, `Validation failed for ${field}: ${message}`, {
    field,
  });
};

// Authentication error helper
export const authError = (message = "Authentication failed") => {
  return handleError(401, message);
};

// Authorization error helper
export const forbiddenError = (message = "Access forbidden") => {
  return handleError(403, message);
};

// Not found error helper
export const notFoundError = (resource = "Resource") => {
  return handleError(404, `${resource} not found`);
};

// Conflict error helper
export const conflictError = (message) => {
  return handleError(409, message);
};

// Server error helper
export const serverError = (
  message = "Internal server error",
  details = null
) => {
  return handleError(500, message, details);
};

// Database error helper
export const databaseError = (operation, details = null) => {
  return handleError(500, `Database ${operation} failed`, details);
};
