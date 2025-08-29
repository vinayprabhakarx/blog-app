import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { authError, handleError, databaseError } from "../utils/handleError.js";

// JWT authentication middleware
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(authError("Authentication token is required."));
  }

  const token = authHeader.split(" ")[1];

  if (!process.env.JWT_SECRET) {
    return next(
      handleError(500, "Server configuration error: JWT_SECRET missing")
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch complete user object from database
    const user = await User.findById(decoded.id)
      .select("_id role personal_info email")
      .catch((err) => {
        throw databaseError("finding user", err);
      });

    if (!user) {
      return next(authError("User not found."));
    }

    req.user = user;
    next();
  } catch (error) {

    if (error.name === "TokenExpiredError") {
      return next(authError("Token has expired. Please log in again."));
    }
    if (error.name === "JsonWebTokenError") {
      return next(authError("Invalid token. Please log in again."));
    }

    return next(handleError(500, "Could not process token.", error));
  }
};

export default authenticate;
