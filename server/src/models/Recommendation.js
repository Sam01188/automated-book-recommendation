import mongoose from "mongoose";

const recommendationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, trim: true },
    publisher: { type: String, trim: true },
    edition: { type: String, trim: true },
    additionalNotes: { type: String, trim: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    department: { type: String, default: "DCEE" },
    status: {
      type: String,
      enum: ["submitted", "under_review", "approved", "rejected"],
      default: "submitted"
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low", "unassigned"],
      default: "unassigned"
    },
    priorityReason: { type: String, trim: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export default mongoose.model("Recommendation", recommendationSchema);
