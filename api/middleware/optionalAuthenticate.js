import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Optional JWT authentication middleware
const optionalAuthenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token;

  if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  } else if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token || !process.env.JWT_SECRET) {
    return next(); // No token or missing secret, proceed as anonymous
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
