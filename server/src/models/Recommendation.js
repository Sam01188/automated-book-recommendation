import mongoose from "mongoose";

const recommendationSchema = new mongoose.Schema(
  {
    title:           { type: String, required: true, trim: true },
    author:          { type: String, required: true, trim: true },
    isbn:            { type: String, required: true, trim: true },
    publisher:       { type: String, required: true, trim: true },
    edition:         { type: String, required: true, trim: true },
    publishPlace:    { type: String, trim: true },
    numberOfPages:   { type: Number },
    additionalNotes: { type: String, trim: true },

    publicationYear: { type: Number },
    binding:         { type: String, trim: true },
    agreeLatest:     { type: String, enum: ["A", "NA", ""], default: "" },
    price:           { type: Number },
    currency:        { type: String, default: "LKR", trim: true },
    copies:          { type: Number, default: 1 },

    submittedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderPeriod:    { type: mongoose.Schema.Types.ObjectId, ref: "OrderPeriod" },
    department:     { type: String, default: "" },
    status: {
      type: String,
      enum: ["submitted", "under_review", "rejected"],
      default: "submitted",
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low", "unassigned"],
      default: "unassigned",
    },
    priorityRank:   { type: Number, min: 1 },
    priorityReason: { type: String, trim: true },
    reviewedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    forwardedToHodAt: { type: Date },
    submittedToLibrarianAt: { type: Date },
    submittedToLibrarianBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export default mongoose.models.Recommendation || mongoose.model("Recommendation", recommendationSchema);
