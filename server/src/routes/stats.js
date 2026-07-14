import express from "express";
import Recommendation from "../models/Recommendation.js";
import { requireAuth } from "../middleware/auth.js";
import { buildDepartmentFilter, finalizeExpiredHodPeriods } from "../utils/hodWorkflow.js";

const router = express.Router();

function buildStatsFilter(user) {
  if (user.role === "lecturer") {
    return { submittedBy: user.id };
  }

  if (user.role === "hod") {
    return buildDepartmentFilter(user.department);
  }

  if (user.role === "librarian") {
    return {
      status: "submitted",
      submittedToLibrarianAt: { $exists: true, $ne: null },
      priorityRank: { $exists: true, $ne: null }
    };
  }

  return {};
}

function buildPendingFilter(user, baseFilter) {
  if (user.role === "librarian") {
    return baseFilter;
  }

  return {
    ...baseFilter,
    $or: [
      { status: "under_review" },
      { status: "submitted", reviewedBy: { $exists: false } }
    ]
  };
}

router.get("/", requireAuth, async (req, res) => {
  try {
    await finalizeExpiredHodPeriods();
    const filter = buildStatsFilter(req.user);
    const pendingFilter = buildPendingFilter(req.user, filter);

    const [total, pending, approved, prioritized, priorityPending] = await Promise.all([
      Recommendation.countDocuments(filter),
      Recommendation.countDocuments({
        ...filter,
        $or: [
          { status: "under_review" },
          { status: "submitted", reviewedBy: { $exists: false } }
        ]
      }),
      Recommendation.countDocuments({ ...filter, status: { $in: ["approved", "submitted"] } }),
      Recommendation.countDocuments({ ...filter, priority: { $ne: "unassigned" } }),
      Recommendation.countDocuments({
        ...filter,
        priority: "unassigned",
        $or: [
          { status: "under_review" },
          { status: "submitted", reviewedBy: { $exists: false } }
        ]
      })
    ]);

    res.json({ total, pending, approved, highPriority: prioritized, priorityPending });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats", error: err.message });
  }
});

export default router;
