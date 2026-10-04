import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import { tokenBlacklist } from "../index.js";
import { recordAuditLog } from "./auditController.js";

const hashResetToken = (token) => createHash("sha256").update(token).digest("hex");

function createMailTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  const fromAddress = process.env.SMTP_FROM || process.env.FROM_EMAIL;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !fromAddress) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

export const login = async (req, res) => {
  const { email, password } = req.body;

  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!user.isActive) {
    return res.status(403).json({ message: "This account has been deactivated. Contact the administrator." });
  }

  if (typeof password !== "string" || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role, department: user.department, sessionVersion: user.sessionVersion ?? 0 },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
  await recordAuditLog(req, "user_login", user, [], { actor: user });

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      mustChangePassword: user.mustChangePassword
    }
  });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (typeof currentPassword !== "string" || typeof newPassword !== "string" || newPassword.length < 6) {
    return res.status(400).json({ message: "Your new password must be at least 6 characters long." });
  }

  try {
    const user = await User.findById(req.user.id).select("+passwordHash");
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(401).json({ message: "Your current password is incorrect." });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "Choose a password different from your current password." });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    await recordAuditLog(req, "password_changed", user, [], { actor: user });

    const token = jwt.sign(
      { id: user._id, role: user.role, department: user.department, sessionVersion: user.sessionVersion },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
    res.json({ message: "Password updated successfully.", mustChangePassword: false, token });
  } catch (error) {
    res.status(500).json({ message: "Unable to update your password right now." });
  }
};

export const updateProfile = async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  if (!name || name.length > 100) {
    return res.status(400).json({ message: "Enter a name between 1 and 100 characters." });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User account not found." });
    }
    const nameChanged = user.name !== name;
    user.name = name;
    await user.save();
    if (nameChanged) {
      await recordAuditLog(req, "profile_updated", user, ["name"]);
    }
    res.json({ name: user.name });
  } catch (error) {
    res.status(500).json({ message: "Unable to update your profile right now." });
  }
};

export const requestPasswordReset = async (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!email) {
    return res.status(400).json({ message: "Enter your account email address." });
  }

  const mailTransport = createMailTransport();
  if (!mailTransport) {
    return res.status(503).json({ message: "Password reset email is not configured. Contact the administrator." });
  }

  const responseMessage = "If an account exists for that email, a password reset link has been sent.";

  try {
    const user = await User.findOne({ email });
    if (user) {
      const token = randomBytes(32).toString("hex");
      user.passwordResetTokenHash = hashResetToken(token);
      user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();

      const resetUrl = new URL("/", process.env.CLIENT_URL || "http://localhost:5173");
      resetUrl.searchParams.set("resetToken", token);
      await mailTransport.sendMail({
        from: process.env.SMTP_FROM || process.env.FROM_EMAIL,
        to: user.email,
        subject: "Reset your Book Recommendation Portal password",
        text: `A password reset was requested for your account. This link expires in 30 minutes:\n\n${resetUrl.toString()}\n\nIf you did not request this, you can ignore this email.`
      });
      await recordAuditLog(req, "password_reset_requested", user, [], { actor: user });
    }

    res.json({ message: responseMessage });
  } catch (error) {
    console.error("Password reset email failed:", error.message);
    res.json({ message: responseMessage });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (typeof token !== "string" || typeof newPassword !== "string" || newPassword.length < 6) {
    return res.status(400).json({ message: "Use a valid reset link and a password of at least 6 characters." });
  }

  try {
    const user = await User.findOne({
      passwordResetTokenHash: hashResetToken(token),
      passwordResetExpires: { $gt: new Date() }
    }).select("+passwordResetTokenHash +passwordResetExpires");

    if (!user) {
      return res.status(400).json({ message: "This password reset link is invalid or has expired." });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    await recordAuditLog(req, "password_reset", user, [], { actor: user });

    res.json({ message: "Password reset successfully." });
  } catch (error) {
    res.status(500).json({ message: "Unable to reset your password right now." });
  }
};

export const logout = async (req, res) => {
  const token = req.token;
  if (token) {
    tokenBlacklist.add(token);
  }
  await recordAuditLog(req, "user_logout", req.user);
  res.json({ message: "Logged out successfully" });
};

export const me = (req, res) => {
  res.json({ user: req.user });
};