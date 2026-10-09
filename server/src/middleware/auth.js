import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { tokenBlacklist } from "../index.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  // Check if token is blacklisted
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ message: "Session has ended" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ message: "Invalid session" });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: "This account has been deactivated. Contact the administrator." });
    }
    if ((payload.sessionVersion ?? 0) !== (user.sessionVersion ?? 0)) {
      return res.status(401).json({ message: "Your session has expired. Please sign in again." });
    }

    const isPasswordFlowRoute = req.baseUrl === "/api/auth" &&
      ["/change-password", "/profile", "/logout"].includes(req.path);
    if (user.mustChangePassword && !isPasswordFlowRoute) {
      return res.status(403).json({
        mustChangePassword: true,
        message: "Change your password before continuing."
      });
    }

    req.user = {
      id: user._id,
      name: user.name,
      role: user.role,
      email: user.email,
      department: user.department,
      mustChangePassword: user.mustChangePassword
    };
    req.token = token;

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