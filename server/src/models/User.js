import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["lecturer", "hod", "librarian"],
      required: true
    },
    department: { type: String, default: "DCEE" }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
