import express from "express";
import Recommendation from "../models/Recommendation.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    // Fix: use req.user.id (set by auth middleware), NOT req.user._id (undefined)
    const filter = req.user.role === "lecturer" ? { submittedBy: req.user.id } : {};

    const [total, pending, approved, highPriority] = await Promise.all([
      Recommendation.countDocuments(filter),
      Recommendation.countDocuments({ ...filter, status: { $in: ["submitted", "under_review"] } }),
      Recommendation.countDocuments({ ...filter, status: "approved" }),
      Recommendation.countDocuments({ ...filter, priority: "high" })
    ]);

    res.json({ total, pending, approved, highPriority });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats", error: err.message });
  }
});

export default router;
