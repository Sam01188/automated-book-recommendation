import express from "express";
import Recommendation from "../models/Recommendation.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const filter = req.user.role === "lecturer" ? { submittedBy: req.user._id } : {};
  const [total, pending, approved, highPriority] = await Promise.all([
    Recommendation.countDocuments(filter),
    Recommendation.countDocuments({ ...filter, status: { $in: ["submitted", "under_review"] } }),
    Recommendation.countDocuments({ ...filter, status: "approved" }),
    Recommendation.countDocuments({ ...filter, priority: "high" })
  ]);

  res.json({ total, pending, approved, highPriority });
});

export default router;
