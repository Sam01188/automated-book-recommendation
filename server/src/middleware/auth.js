import jwt from "jsonwebtoken";
import User from "../models/user.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.id).select("-passwordHash");
    if (!user) {
      return res.status(401).json({ message: "Invalid session" });
    }

    req.user = {
      id: user._id,
      role: user.role,
      email: user.email,
      department: user.department
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid session" });
  }
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission for this action" });
    }
    next();
  };
}