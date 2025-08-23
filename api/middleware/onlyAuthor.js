import { forbiddenError } from "../utils/handleError.js";

// Author/Admin authorization middleware
const onlyAuthor = (req, res, next) => {
  const { role } = req.user;

  if (role !== "author" && role !== "admin") {
    return next(
      forbiddenError(
        "Access denied. Only authors and admins can access this resource."
      )
    );
  }

  next();
};

export default onlyAuthor;
