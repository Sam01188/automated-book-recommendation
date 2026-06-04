import mongoose from "mongoose";

const recommendationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, trim: true },
    publisher: { type: String, trim: true },
    edition: { type: String, trim: true },
    year: { 
      type: Number, 
      min: [1000, "Year must be valid"], 
      max: [new Date().getFullYear() + 1, "Year cannot be in the future"] 
    },
    binding: { type: String, trim: true },
    copies: { type: Number, min: [0, "Copies cannot be negative"], default: 0 },
    price: { type: Number, min: [0, "Price cannot be negative"] },
    additionalNotes: { type: String, trim: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    department: { type: String, default: "DCEE" },
    status: {
      type: String,
      enum: ["submitted", "under_review", "approved", "rejected"],
      default: "submitted",
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low", "unassigned"],
      default: "unassigned",
    },
    priorityReason: { type: String, trim: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Recommendation", recommendationSchema);