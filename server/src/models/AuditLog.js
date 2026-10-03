import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        "user_created", "user_updated", "user_activated", "user_deactivated", "user_deleted",
        "user_login", "user_logout", "password_changed", "password_reset_requested", "password_reset", "profile_updated",
        "recommendation_created", "recommendation_updated", "recommendation_deleted", "recommendation_priority_assigned",
        "recommendation_rejected", "recommendations_ranked", "recommendation_order_reset", "recommendations_submitted",
        "recommendation_status_updated", "order_period_created", "order_period_updated", "order_period_closed",
        "order_period_hod_opened", "order_period_deleted"
      ],
      required: true
    },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorName: { type: String, default: "Unknown" },
    actorEmail: { type: String, default: "" },
    actorRole: { type: String, default: "" },
    targetType: { type: String, enum: ["user", "recommendation", "order_period", "system"], default: "user" },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    targetName: { type: String, default: "" },
    targetEmail: { type: String, default: "" },
    changes: [{ type: String }],
    details: { type: String, default: "" }
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

export default mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);