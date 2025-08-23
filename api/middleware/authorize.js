import { forbiddenError } from "../utils/handleError.js";

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(forbiddenError("Authentication error. User role not found."));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        forbiddenError(
          `Access denied. Required role(s): ${roles.join(" or ")}.`
        )
      );
    }

    next();
  };
};

export default authorize;
