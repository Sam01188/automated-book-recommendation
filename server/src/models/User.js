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

    passwordHash: { type: String, required: true },

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