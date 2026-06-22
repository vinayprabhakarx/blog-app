import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Optional JWT authentication middleware
const optionalAuthenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(); // No token, proceed as anonymous
  }

  const token = authHeader.split(" ")[1];

  if (!process.env.JWT_SECRET) {
    return next(); // Missing secret, just proceed
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id role personal_info email");
    
    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Ignore invalid tokens and proceed as anonymous
  }

  next();
};

export default optionalAuthenticate;
