import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import User from "../models/user.js";
import { recordAuditLog } from "./auditController.js";

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

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 10; i += 1) {
    password += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return password;
}

export const createUser = async (req, res) => {
  try {
    const { name, email, role, department } = req.body;

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required." });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const tempPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = new User({
      name,
      email: normalizedEmail,
      role,
      department,
      passwordHash,
      mustChangePassword: true
    });

    await user.save();
    await recordAuditLog(req, "user_created", user);

    const mailTransport = createMailTransport();
    if (mailTransport) {
      await mailTransport.sendMail({
        from: process.env.SMTP_FROM || process.env.FROM_EMAIL,
        to: normalizedEmail,
        subject: "Your temporary password for the Book Recommendation Portal",
        text: `Your account has been created.\n\nEmail: ${normalizedEmail}\nTemporary password: ${tempPassword}\n\nYou will be required to change this password when you sign in.`
      });
    }

    res.status(201).json({
      message: "User created successfully. A temporary password has been emailed to the user.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        mustChangePassword: user.mustChangePassword
      }
    });

  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ message: "Error creating user" });
  }
};

export const importUsers = async (req, res) => {
  const rows = req.body.users;
  const validRoles = ["lecturer", "hod", "librarian", "admin"];
  const validDepartments = ["DCEE", "DEIE", "DMME", "DMENA"];

  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 200) {
    return res.status(400).json({ message: "Import between 1 and 200 users per CSV." });
  }

  const mailTransport = createMailTransport();
  const seenEmails = new Set();
  const results = [];
  const pendingEmails = [];

  for (const [index, row] of rows.entries()) {
    const name = typeof row?.name === "string" ? row.name.trim() : "";
    const email = typeof row?.email === "string" ? row.email.trim().toLowerCase() : "";
    const role = typeof row?.role === "string" ? row.role.trim().toLowerCase() : "";
    const department = typeof row?.department === "string" ? row.department.trim().toUpperCase() : "";
    const rowNumber = Number.isInteger(row?.rowNumber) ? row.rowNumber : index + 2;
    const errors = [];

    if (!name || name.length > 100) errors.push("Name is required and must be 100 characters or fewer.");
    if (!/^\S+@ruh\.ac\.lk$/i.test(email)) errors.push("Use a valid @ruh.ac.lk email address.");
    if (!validRoles.includes(role)) errors.push("Role must be Lecturer, HoD, Librarian, or Admin.");
    if (["lecturer", "hod"].includes(role) && !validDepartments.includes(department)) {
      errors.push("Lecturers and HoDs need a valid department.");
    }

    if (email && seenEmails.has(email)) errors.push("Email is duplicated in this CSV.");
    if (email) seenEmails.add(email);

    if (errors.length > 0) {
      results.push({ rowNumber, name, email, status: "invalid", emailSent: false, message: errors.join(" ") });
      continue;
    }

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        results.push({ rowNumber, name, email, status: "skipped", emailSent: false, message: "An account with this email already exists." });
        continue;
      }

      const temporaryPassword = generateTemporaryPassword();
      const passwordHash = await bcrypt.hash(temporaryPassword, 10);
      const user = new User({
        name,
        email,
        role,
        department: ["lecturer", "hod"].includes(role) ? department : "",
        passwordHash,
        mustChangePassword: true
      });
      await user.save();
      await recordAuditLog(req, "user_created", user, [], { details: `Created through CSV import, row ${rowNumber}.` });

      const result = {
        rowNumber,
        name,
        email,
        status: "created",
        emailSent: false,
        message: mailTransport
          ? "Account created; temporary-password email is pending."
          : "Account created, but email is not configured."
      };
      results.push(result);
      if (mailTransport) pendingEmails.push({ email, temporaryPassword, result });
    } catch (error) {
      const message = error.code === 11000
        ? "An account with this email already exists."
        : error.message || "Unable to create this account.";
      results.push({ rowNumber, name, email, status: error.code === 11000 ? "skipped" : "error", emailSent: false, message });
    }
  }

  for (const [index, pending] of pendingEmails.entries()) {
    if (index > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }

    const mail = {
        from: process.env.SMTP_FROM || process.env.FROM_EMAIL,
        to: pending.email,
        subject: "Your temporary password for the Book Recommendation Portal",
        text: `Your account has been created.\n\nEmail: ${pending.email}\nTemporary password: ${pending.temporaryPassword}\n\nYou will be required to change this password when you sign in.`
    };

    let emailSent = false;
    for (let attempt = 0; attempt < 3 && !emailSent; attempt += 1) {
      try {
        await mailTransport.sendMail(mail);
        emailSent = true;
      } catch (error) {
        const isRateLimited = error.responseCode === 550 && /too many emails per second/i.test(error.message || "");
        if (isRateLimited && attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 3000 * (attempt + 1)));
          continue;
        }
        console.error(`Failed to email imported account ${pending.email}:`, error.message);
        pending.result.message = isRateLimited
          ? "Account created, but the email provider is still rate-limiting delivery."
          : "Account created, but the temporary-password email could not be sent.";
      }
    }

    if (emailSent) {
      pending.result.emailSent = true;
      pending.result.message = "Account created and temporary password emailed.";
    }
  }

  res.json({
    results,
    createdCount: results.filter((result) => result.status === "created").length,
    skippedCount: results.filter((result) => result.status === "skipped").length,
    invalidCount: results.filter((result) => result.status === "invalid" || result.status === "error").length
  });
};

export const getUsers = async (req, res) => {
  const users = await User.find().select("-passwordHash");
  res.json(users);
};

export const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  await User.findByIdAndDelete(req.params.id);
  await recordAuditLog(req, "user_deleted", user);
  res.json({ message: "User deleted" });
};

export const updateUser = async (req, res) => {
  const { name, role, department, isActive, mustChangePassword } = req.body;
  const existingUser = await User.findById(req.params.id);
  if (!existingUser) {
    return res.status(404).json({ message: "User not found" });
  }

  const update = {};

  if (typeof name === "string") update.name = name.trim();
  if (typeof role === "string") update.role = role;
  if (typeof department === "string") update.department = department;
  if (typeof isActive === "boolean") update.isActive = isActive;
  if (typeof mustChangePassword === "boolean") update.mustChangePassword = mustChangePassword;

  const changes = Object.keys(update).filter(
    (field) => String(existingUser[field] ?? "") !== String(update[field] ?? "")
  );
  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select("-passwordHash");

  if (changes.length > 0) {
    const action = changes.length === 1 && changes[0] === "isActive"
      ? (user.isActive ? "user_activated" : "user_deactivated")
      : "user_updated";
    await recordAuditLog(req, action, user, changes);
  }

  res.json(user);
};

export const bulkUpdateUsers = async (req, res) => {
  const userIds = Array.isArray(req.body.userIds)
    ? [...new Set(req.body.userIds.map(String))]
    : [];
  const { action, role, department } = req.body;
  const validRoles = ["lecturer", "hod", "librarian", "admin"];

  if (userIds.length === 0 || userIds.length > 200 || userIds.some((id) => !/^[a-f\d]{24}$/i.test(id))) {
    return res.status(400).json({ message: "Select between 1 and 200 valid users." });
  }
  if (!["activate", "deactivate", "role"].includes(action)) {
    return res.status(400).json({ message: "Choose a valid bulk action." });
  }
  if (action === "role" && !validRoles.includes(role)) {
    return res.status(400).json({ message: "Choose a valid user role." });
  }
  if (action === "role" && ["lecturer", "hod"].includes(role) && !department) {
    return res.status(400).json({ message: "Choose a department for the selected role." });
  }
  if (action === "deactivate" && userIds.includes(String(req.user.id))) {
    return res.status(400).json({ message: "You cannot deactivate your own admin account." });
  }
  if (action === "role" && role !== "admin" && userIds.includes(String(req.user.id))) {
    return res.status(400).json({ message: "You cannot remove your own admin role." });
  }

  try {
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      return res.status(404).json({ message: "One or more selected users could not be found." });
    }

    const updates = users.map((user) => {
      const changes = [];

      if (action === "activate" || action === "deactivate") {
        const isActive = action === "activate";
        if (user.isActive !== isActive) {
          user.isActive = isActive;
          changes.push("isActive");
        }
      } else {
        if (user.role !== role) {
          user.role = role;
          user.sessionVersion = (user.sessionVersion ?? 0) + 1;
          changes.push("role");
        }

        const nextDepartment = ["lecturer", "hod"].includes(role) ? department : "";
        if (String(user.department ?? "") !== String(nextDepartment)) {
          user.department = nextDepartment;
          changes.push("department");
        }
      }

      return { user, changes };
    }).filter(({ changes }) => changes.length > 0);

    await Promise.all(updates.map(({ user }) => user.validate()));
    const updatedUsers = await Promise.all(updates.map(({ user }) => user.save()));
    await Promise.all(updates.map(({ user, changes }) => {
      const actionName = action === "activate"
        ? "user_activated"
        : action === "deactivate"
          ? "user_deactivated"
          : "user_updated";
      return recordAuditLog(req, actionName, user, changes, {
        details: `Updated through bulk ${action} action.`
      });
    }));

    res.json({
      updatedCount: updatedUsers.length,
      users: updatedUsers.map((user) => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isActive: user.isActive
      }))
    });
  } catch (error) {
    console.error("Error applying bulk user action:", error);
    res.status(400).json({ message: error.message || "Unable to update selected users." });
  }
};

export const bulkDeleteUsers = async (req, res) => {
  const userIds = Array.isArray(req.body.userIds)
    ? [...new Set(req.body.userIds.map(String))]
    : [];

  if (userIds.length === 0 || userIds.length > 200 || userIds.some((id) => !/^[a-f\d]{24}$/i.test(id))) {
    return res.status(400).json({ message: "Select between 1 and 200 valid users to delete." });
  }
  if (userIds.includes(String(req.user.id))) {
    return res.status(400).json({ message: "You cannot delete your own admin account." });
  }

  try {
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      return res.status(404).json({ message: "One or more selected users could not be found." });
    }

    const result = await User.deleteMany({ _id: { $in: userIds } });
    await Promise.all(users.map((user) => recordAuditLog(req, "user_deleted", user, [], {
      details: "Deleted through bulk action."
    })));

    res.json({ deletedCount: result.deletedCount, deletedIds: users.map((user) => String(user._id)) });
  } catch (error) {
    console.error("Error deleting users in bulk:", error);
    res.status(500).json({ message: "Unable to delete the selected users." });
  }
};

