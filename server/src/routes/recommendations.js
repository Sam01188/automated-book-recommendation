import express from "express";
import Recommendation from "../models/Recommendation.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";

const router = express.Router();

// GET all recommendations (lecturer sees own; hod/librarian/admin sees all)
router.get("/", requireAuth, async (req, res) => {
  try {
    const filter = req.user.role === "lecturer" ? { submittedBy: req.user.id } : {};
    const recommendations = await Recommendation.find(filter)
      .populate("submittedBy", "name department")
      .sort({ createdAt: -1 });
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch recommendations" });
  }
});

// POST - create new recommendation (lecturer/librarian only)
router.post("/", requireAuth, allowRoles("lecturer", "librarian"), async (req, res) => {
  try {
    const {
      title, author, isbn, publisher, edition,
      publicationYear, binding, agreeLatest, price, copies,
      additionalNotes
    } = req.body;

    const recommendation = await Recommendation.create({
      title,
      author,
      isbn,
      publisher,
      edition,
      publicationYear,
      binding,
      agreeLatest,
      price,
      copies,
      additionalNotes,
      submittedBy: req.user.id,
      department: req.user.department
    });

    // Re-fetch with populated submittedBy so frontend gets full object
    const populated = await Recommendation.findById(recommendation._id)
      .populate("submittedBy", "name department");

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to create recommendation", error: err.message });
  }
});

// PATCH - HOD assigns priority
router.patch("/:id/priority", requireAuth, allowRoles("hod"), async (req, res) => {
  try {
    const recommendation = await Recommendation.findByIdAndUpdate(
      req.params.id,
      {
        priority: req.body.priority,
        priorityReason: req.body.priorityReason || "Assigned during department review",
        status: "under_review",
        reviewedBy: req.user.id
      },
      { new: true }
    ).populate("submittedBy", "name department");

    if (!recommendation) {
      return res.status(404).json({ message: "Recommendation not found" });
    }
    res.json(recommendation);
  } catch (err) {
    res.status(500).json({ message: "Failed to update priority" });
  }
});

// PATCH - Librarian updates status
router.patch("/:id/status", requireAuth, allowRoles("librarian"), async (req, res) => {
  try {
    const recommendation = await Recommendation.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate("submittedBy", "name department");

    if (!recommendation) {
      return res.status(404).json({ message: "Recommendation not found" });
    }
    res.json(recommendation);
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
});

// GET - Export CSV (librarian only)
router.get("/export/:format", requireAuth, allowRoles("librarian"), async (req, res) => {
  try {
    const rows = await Recommendation.find()
      .populate("submittedBy", "name department")
      .sort({ createdAt: -1 });

    const data = rows.map((item) => ({
      title:          item.title,
      author:         item.author,
      isbn:           item.isbn,
      publisher:      item.publisher,
      edition:        item.edition,
      publicationYear: item.publicationYear,
      binding:        item.binding,
      agreeLatest:    item.agreeLatest,
      price:          item.price,
      copies:         item.copies,
      department:     item.department,
      submittedBy:    item.submittedBy?.name || "",
      priority:       item.priority,
      status:         item.status
    }));

    if (req.params.format === "pdf") {
      return res.json({ message: "PDF export data prepared", data });
    }

    const headers = [
      "Title","Author","ISBN","Publisher","Edition",
      "Publication Year","Binding","Agree Latest","Price (LKR)","Copies",
      "Department","Submitted By","Priority","Status"
    ];

    const csv = [
      headers.join(","),
      ...data.map((row) =>
        [
          row.title, row.author, row.isbn, row.publisher, row.edition,
          row.publicationYear, row.binding, row.agreeLatest, row.price, row.copies,
          row.department, row.submittedBy, row.priority, row.status
        ]
          .map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`)
          .join(",")
      )
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=recommendations.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: "Export failed" });
  }
});

export default router;
