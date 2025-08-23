import { forbiddenError } from "../utils/handleError.js";

// Admin-only authorization middleware
const onlyAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  return next(forbiddenError("Access denied. Admin privileges are required."));
};

export default onlyAdmin;
