import express from "express";
import Recommendation from "../models/Recommendation.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const filter =
      req.user.role === "lecturer"
        ? { submittedBy: req.user._id }
        : {};

    const recommendations = await Recommendation.find(filter)
      .populate("submittedBy", "name department")
      .populate("reviewedBy", "name department")
      .sort({ createdAt: -1 });

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post(
  "/",
  requireAuth,
  allowRoles("lecturer", "librarian"),
  async (req, res) => {
    try {
      const {
        title,
        author,
        isbn,
        publisher,
        edition,
        year,
        binding,
        copies,
        price,
        additionalNotes,
      } = req.body;

      const recommendation = await Recommendation.create({
        title,
        author,
        isbn,
        publisher,
        edition,
        year: year ? Number(year) : undefined,
        binding,
        copies: copies ? Number(copies) : 0,
        price: price ? Number(price) : undefined,
        additionalNotes,
        submittedBy: req.user._id,
        department: req.user.department,
      });

      res.status(201).json(recommendation);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.patch(
  "/:id/priority",
  requireAuth,
  allowRoles("hod"),
  async (req, res) => {
    try {
      const recommendation = await Recommendation.findByIdAndUpdate(
        req.params.id,
        {
          priority: req.body.priority,
          priorityReason: req.body.priorityReason,
          status: "under_review",
          reviewedBy: req.user._id,
        },
        { new: true }
      ).populate("submittedBy", "name department");

      if (!recommendation) {
        return res.status(404).json({ message: "Recommendation not found" });
      }

      res.json(recommendation);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.patch(
  "/:id/status",
  requireAuth,
  allowRoles("librarian"),
  async (req, res) => {
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
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.get(
  "/export/:format",
  requireAuth,
  allowRoles("librarian"),
  async (req, res) => {
    try {
      const rows = await Recommendation.find()
        .populate("submittedBy", "name department")
        .sort({ createdAt: -1 });

      const data = rows.map((item) => ({
        title: item.title,
        author: item.author,
        isbn: item.isbn,
        edition: item.edition,
        year: item.year,
        binding: item.binding,
        copies: item.copies,
        price: item.price,
        publisher: item.publisher,
        submittedBy: item.submittedBy?.name || "",
        priority: item.priority,
        status: item.status,
      }));

      if (req.params.format === "pdf") {
        return res.json({ message: "PDF export data prepared", data });
      }

      const csvHeaders =
        "Title,Author,ISBN,Edition,Year,Binding,Copies,Price (LKR),Publisher,Submitted By,Priority,Status";

      const csvRows = data.map((row) =>
        [
          row.title,
          row.author,
          row.isbn,
          row.edition,
          row.year,
          row.binding,
          row.copies,
          row.price,
          row.publisher,
          row.submittedBy,
          row.priority,
          row.status,
        ]
          .map((value) =>
            `"${String(value || "").replaceAll('"', '""')}"`
          )
          .join(",")
      );

      const csv = [csvHeaders, ...csvRows].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=recommendations.csv"
      );
      res.send(csv);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;