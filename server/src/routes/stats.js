import express from "express";
import Recommendation from "../models/Recommendation.js";
import OrderPeriod from "../models/OrderPeriod.js";
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

async function findLibrarianDisplayPeriod() {
  const activePeriod = await OrderPeriod.findOne({
    status: { $in: ["open", "hod_priority"] }
  }).sort({ createdAt: -1, startDate: -1 });

  if (activePeriod) {
    return activePeriod;
  }

  return OrderPeriod.findOne({ status: "closed" }).sort({ endDate: -1, updatedAt: -1 });
}

async function findCurrentLecturerPeriod() {
  return OrderPeriod.findOne({ status: "open" }).sort({ createdAt: -1, startDate: -1 });
}

async function findCurrentHodPeriod() {
  return OrderPeriod.findOne({ status: "hod_priority" }).sort({ createdAt: -1, startDate: -1 });
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
    const activeLibrarianPeriod = req.user.role === "librarian" ? await findLibrarianDisplayPeriod() : null;
    const activeLecturerPeriod = req.user.role === "lecturer" ? await findCurrentLecturerPeriod() : null;
    const activeHodPeriod = req.user.role === "hod" ? await findCurrentHodPeriod() : null;

    if (req.user.role === "librarian" && !activeLibrarianPeriod) {
      return res.json({ total: 0, pending: 0, approved: 0, highPriority: 0, priorityPending: 0 });
    }

    if (req.user.role === "lecturer" && !activeLecturerPeriod) {
      return res.json({ total: 0, pending: 0, approved: 0, highPriority: 0, priorityPending: 0 });
    }

    if (req.user.role === "hod" && !activeHodPeriod) {
      return res.json({ total: 0, pending: 0, approved: 0, highPriority: 0, priorityPending: 0 });
    }

    let filter = buildStatsFilter(req.user);

    if (req.user.role === "librarian") {
      filter = { ...filter, orderPeriod: activeLibrarianPeriod._id };
    } else if (req.user.role === "lecturer") {
      filter = { ...filter, orderPeriod: activeLecturerPeriod._id };
    } else if (req.user.role === "hod") {
      filter = { ...filter, orderPeriod: activeHodPeriod._id };
    }

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
