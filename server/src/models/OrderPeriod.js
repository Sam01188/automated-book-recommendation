import mongoose from "mongoose";

const orderPeriodSchema = new mongoose.Schema(
  {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    hodRecommendationDays: {
      type: Number,
      default: 7,
      min: 1
    },
    status: {
      type: String,
      enum: ["draft", "open", "hod_priority", "closed"],
      default: "draft"
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

orderPeriodSchema.index(
  { faculty: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "open" }
  }
);

orderPeriodSchema.pre("validate", function validateDateRange(next) {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    this.invalidate("endDate", "End date must be after start date");
  }
  next();
});

export default mongoose.models.OrderPeriod || mongoose.model("OrderPeriod", orderPeriodSchema);
