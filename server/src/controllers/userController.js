import bcrypt from "bcryptjs";
import User from "../models/user.js";

export const createUser = async (req, res) => {
  try {
    const { name, email, role, department, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      role,
      department,
      passwordHash
    });

    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user
    });

  } catch (err) {
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
  const { role, department } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role, department },
    { new: true }
  );

  res.json(user);
};