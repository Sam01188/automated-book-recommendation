import express from "express";
import Recommendation from "../models/Recommendation.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const filter = req.user.role === "lecturer" ? { submittedBy: req.user._id } : {};
  const recommendations = await Recommendation.find(filter)
    .populate("submittedBy", "name department")
    .populate("reviewedBy", "name department")
    .sort({ createdAt: -1 });
  res.json(recommendations);
});

router.post("/", requireAuth, allowRoles("lecturer", "librarian"), async (req, res) => {
  const recommendation = await Recommendation.create({
    ...req.body,
    submittedBy: req.user._id,
    department: req.user.department
  });
  res.status(201).json(recommendation);
});

router.patch("/:id/priority", requireAuth, allowRoles("hod"), async (req, res) => {
  const recommendation = await Recommendation.findByIdAndUpdate(
    req.params.id,
    {
      priority: req.body.priority,
      priorityReason: req.body.priorityReason,
      status: "under_review",
      reviewedBy: req.user._id
    },
    { new: true }
  ).populate("submittedBy", "name department");

  if (!recommendation) {
    return res.status(404).json({ message: "Recommendation not found" });
  }

  res.json(recommendation);
});

router.patch("/:id/status", requireAuth, allowRoles("librarian"), async (req, res) => {
  const recommendation = await Recommendation.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  ).populate("submittedBy", "name department");

  if (!recommendation) {
    return res.status(404).json({ message: "Recommendation not found" });
  }

  res.json(recommendation);
});

router.get("/export/:format", requireAuth, allowRoles("librarian"), async (req, res) => {
  const rows = await Recommendation.find().populate("submittedBy", "name department").sort({ createdAt: -1 });
  const data = rows.map((item) => ({
    title: item.title,
    author: item.author,
    publisher: item.publisher,
    submittedBy: item.submittedBy?.name || "",
    priority: item.priority,
    status: item.status
  }));

  if (req.params.format === "pdf") {
    return res.json({ message: "PDF export data prepared", data });
  }

  const csv = [
    "Title,Author,Publisher,Submitted By,Priority,Status",
    ...data.map((row) =>
      [row.title, row.author, row.publisher, row.submittedBy, row.priority, row.status]
        .map((value) => `"${String(value || "").replaceAll('"', '""')}"`)
        .join(",")
    )
  ].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=recommendations.csv");
  res.send(csv);
});

export default router;
