import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { authError, handleError, databaseError } from "../utils/handleError.js";

// JWT authentication middleware
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token;
  if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  } else if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return next(authError("Authentication token is required."));
  }

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
