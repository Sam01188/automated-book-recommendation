import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },

    passwordHash: { type: String, required: true, select: false },

    mustChangePassword: { type: Boolean, default: false },

    sessionVersion: { type: Number, default: 0 },

    passwordResetTokenHash: { type: String, select: false },

    passwordResetExpires: { type: Date, select: false },

    role: {
      type: String,
      enum: ["lecturer", "hod", "librarian", "admin"],
      required: true
    },

    department: {
      type: String,
      required: function() {
        return this.role !== "admin" && this.role !== "librarian";
      }
    }
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);