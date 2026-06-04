import mongoose from "mongoose";

const recommendationSchema = new mongoose.Schema(
  {
    // Core fields
    title:           { type: String, required: true, trim: true },
    author:          { type: String, required: true, trim: true },
    isbn:            { type: String, trim: true },
    publisher:       { type: String, trim: true },
    edition:         { type: String, trim: true },
    additionalNotes: { type: String, trim: true },

    // Excel form fields
    publicationYear: { type: Number },
    binding:         { type: String, trim: true },
    agreeLatest:     { type: String, enum: ["A", "NA", ""], default: "" },
    price:           { type: Number },
    copies:          { type: Number, default: 1 },

    // Relations & workflow
    submittedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    department:     { type: String, default: "" },
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
    reviewedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export default mongoose.model("Recommendation", recommendationSchema);