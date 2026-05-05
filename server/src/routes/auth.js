import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username: String(username || "").toLowerCase().trim() });

  if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "dev-secret", {
    expiresIn: "8h"
  });

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
      department: user.department
    }
  });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
