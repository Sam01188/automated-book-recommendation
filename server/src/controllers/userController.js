import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import User from "../models/user.js";

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

export const getUsers = async (req, res) => {
  const users = await User.find().select("-passwordHash");
  res.json(users);
};

export const deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
};

export const updateUser = async (req, res) => {
  const { name, role, department } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, role, department },
    { new: true }
  ).select("-passwordHash");

  res.json(user);
};
