import express from "express";
import Recommendation from "../models/Recommendation.js";
import OrderPeriod from "../models/OrderPeriod.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";
import {
  buildDepartmentFilter,
  finalizeExpiredHodPeriods,
  normalizeDepartment,
  submitDepartmentListToLibrarian
} from "../utils/hodWorkflow.js";

const router = express.Router();

function buildRecommendationFilter(user) {
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

async function findCurrentOpenPeriod() {
  const now = new Date();
  return OrderPeriod.findOne({
    status: "open",
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).sort({ startDate: -1 });
}

async function findActiveHodPeriod(periodId) {
  const period = await OrderPeriod.findById(periodId);
  if (!period || period.status !== "hod_priority") {
    return null;
  }

  return period;
}

async function findCurrentHodPeriod() {
  return OrderPeriod.findOne({ status: "hod_priority" }).sort({ startDate: -1 });
}

// GET recommendations by role.
router.get("/", requireAuth, async (req, res) => {
  try {
    await finalizeExpiredHodPeriods();
    const filter = buildRecommendationFilter(req.user);
    const recommendations = await Recommendation.find(filter)
      .populate("submittedBy", "name department")
      .populate("reviewedBy", "name")
      .populate("orderPeriod", "faculty startDate endDate hodRecommendationDays status")
      .sort(req.user.role === "librarian" ? { department: 1, priorityRank: 1 } : { createdAt: -1 });
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch recommendations" });
  }
});

router.patch("/submit", requireAuth, allowRoles("hod"), async (req, res) => {
  try {
    await finalizeExpiredHodPeriods();
    const activeHodPeriod = await findCurrentHodPeriod();
    if (!activeHodPeriod) {
      return res.status(403).json({ message: "The HOD priority assignment period is closed" });
    }

    const departmentFilter = buildDepartmentFilter(req.user.department);
    const unrankedCount = await Recommendation.countDocuments({
      ...departmentFilter,
      orderPeriod: activeHodPeriod._id,
      status: { $ne: "rejected" },
      submittedToLibrarianAt: { $exists: false },
      $or: [{ priorityRank: { $exists: false } }, { priorityRank: null }]
    });
    if (unrankedCount > 0) {
      return res.status(400).json({ message: "Please order every recommendation before submitting to the librarian." });
    }

    await submitDepartmentListToLibrarian({
      orderPeriodId: activeHodPeriod._id,
      department: req.user.department,
      hodId: req.user.id
    });

    const recommendations = await Recommendation.find(buildRecommendationFilter(req.user))
      .populate("submittedBy", "name department")
      .populate("reviewedBy", "name")
      .populate("orderPeriod", "faculty startDate endDate hodRecommendationDays status")
      .sort({ createdAt: -1 });

    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ message: "Failed to submit recommendations" });
  }
});

router.patch("/rank-order", requireAuth, allowRoles("hod"), async (req, res) => {
  try {
    await finalizeExpiredHodPeriods();
    const activeHodPeriod = await findCurrentHodPeriod();
    if (!activeHodPeriod) {
      return res.status(403).json({ message: "The HOD priority assignment period is closed" });
    }

    const orderedIds = Array.isArray(req.body.orderedIds) ? req.body.orderedIds : [];
    if (orderedIds.length === 0) {
      return res.status(400).json({ message: "No recommendation order was provided" });
    }

    const departmentFilter = buildDepartmentFilter(req.user.department);
    const recommendations = await Recommendation.find({
      _id: { $in: orderedIds },
      ...departmentFilter,
      orderPeriod: activeHodPeriod._id,
      status: { $ne: "rejected" },
      submittedToLibrarianAt: { $exists: false }
    });

    if (recommendations.length !== orderedIds.length) {
      return res.status(400).json({ message: "The ordered list contains recommendations outside your department or active period." });
    }

    await Promise.all(
      orderedIds.map((id, index) =>
        Recommendation.findByIdAndUpdate(id, {
          priorityRank: index + 1,
          priority: "medium",
          priorityReason: "Ordered during department review",
          status: "under_review",
          reviewedBy: req.user.id
        })
      )
    );

    const updated = await Recommendation.find(buildRecommendationFilter(req.user))
      .populate("submittedBy", "name department")
      .populate("reviewedBy", "name")
      .populate("orderPeriod", "faculty startDate endDate hodRecommendationDays status")
      .sort({ priorityRank: 1, createdAt: -1 });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to save recommendation order" });
  }
});

// POST - create new recommendation while an announced order period is open.
router.post("/", requireAuth, allowRoles("lecturer"), async (req, res) => {
  try {
    const lecturerDepartment = normalizeDepartment(req.user.department);
    if (!lecturerDepartment) {
      return res.status(400).json({ message: "Your user account is not assigned to a department." });
    }

    const openPeriod = await findCurrentOpenPeriod();
    if (!openPeriod) {
      return res.status(403).json({ message: "Book submissions are closed. Please wait until the librarian opens an order period and sends the announcement." });
    }

    const {
      title, author, isbn, publisher, edition,
      publicationYear, binding, agreeLatest, price, currency, copies,
      publishPlace, numberOfPages, additionalNotes
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
      currency,
      copies,
      publishPlace,
      numberOfPages,
      additionalNotes,
      submittedBy: req.user.id,
      orderPeriod: openPeriod._id,
      department: lecturerDepartment
    });

    // Re-fetch with populated submittedBy so frontend gets full object
    const populated = await Recommendation.findById(recommendation._id)
      .populate("submittedBy", "name department")
      .populate("orderPeriod", "faculty startDate endDate hodRecommendationDays status");

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to create recommendation", error: err.message });
  }
});

// PATCH - HOD assigns priority
router.patch("/:id/priority", requireAuth, allowRoles("hod"), async (req, res) => {
  try {
    const allowedPriorities = ["high", "medium", "low", "rejected"];
    if (!allowedPriorities.includes(req.body.priority)) {
      return res.status(400).json({ message: "Invalid recommendation priority" });
    }

    const existing = await Recommendation.findOne({
      _id: req.params.id,
      ...buildDepartmentFilter(req.user.department)
    });

    if (!existing) {
      return res.status(404).json({ message: "Recommendation not found" });
    }

    if (existing.submittedToLibrarianAt) {
      return res.status(400).json({ message: "This recommendation has already been submitted to the librarian" });
    }

    if (existing.orderPeriod) {
      const activePeriod = await findActiveHodPeriod(existing.orderPeriod);
      if (!activePeriod) {
        return res.status(403).json({ message: "The HOD priority assignment period is closed" });
      }
    }

    const isRejected = req.body.priority === "rejected";
    const recommendation = await Recommendation.findByIdAndUpdate(
      req.params.id,
      isRejected
        ? {
            priority: "unassigned",
            priorityReason: req.body.priorityReason || "Rejected during department review",
            status: "rejected",
            reviewedBy: req.user.id
          }
        : {
            priority: req.body.priority,
            priorityReason: req.body.priorityReason || "Assigned during department review",
            status: "under_review",
            reviewedBy: req.user.id
          },
      { new: true }
    )
      .populate("submittedBy", "name department")
      .populate("reviewedBy", "name")
      .populate("orderPeriod", "faculty startDate endDate hodRecommendationDays status");

    if (!recommendation) {
      return res.status(404).json({ message: "Recommendation not found" });
    }
    res.json(recommendation);
  } catch (err) {
    res.status(500).json({ message: "Failed to update priority" });
  }
});

// PATCH - HOD restores a rejected recommendation back to active
router.patch("/:id/restore", requireAuth, allowRoles("hod"), async (req, res) => {
  try {
    await finalizeExpiredHodPeriods();
    const activeHodPeriod = await findCurrentHodPeriod();
    if (!activeHodPeriod) {
      return res.status(403).json({ message: "The HOD priority assignment period is closed" });
    }

    const existing = await Recommendation.findOne({
      _id: req.params.id,
      ...buildDepartmentFilter(req.user.department),
      status: "rejected"
    });

    if (!existing) {
      return res.status(404).json({ message: "Rejected recommendation not found" });
    }

    if (existing.submittedToLibrarianAt) {
      return res.status(400).json({ message: "This recommendation has already been submitted to the librarian" });
    }

    const recommendation = await Recommendation.findByIdAndUpdate(
      req.params.id,
      {
        status: "submitted",
        priority: "unassigned",
        priorityRank: null,
        priorityReason: null,
        reviewedBy: null
      },
      { new: true }
    )
      .populate("submittedBy", "name department")
      .populate("reviewedBy", "name")
      .populate("orderPeriod", "faculty startDate endDate hodRecommendationDays status");

    if (!recommendation) {
      return res.status(404).json({ message: "Recommendation not found" });
    }
    res.json(recommendation);
  } catch (err) {
    res.status(500).json({ message: "Failed to restore recommendation" });
  }
});


router.patch("/:id/status", requireAuth, allowRoles("librarian"), async (req, res) => {
  try {
    const allowedStatuses = ["submitted", "under_review", "rejected"];
    if (!allowedStatuses.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid recommendation status" });
    }

    const recommendation = await Recommendation.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    )
      .populate("submittedBy", "name department")
      .populate("reviewedBy", "name")
      .populate("orderPeriod", "faculty startDate endDate hodRecommendationDays status");

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
    const rows = await Recommendation.find(buildRecommendationFilter(req.user))
      .populate("submittedBy", "name department")
      .populate("reviewedBy", "name")
      .populate("orderPeriod", "faculty startDate endDate hodRecommendationDays status")
      .sort({ department: 1, priorityRank: 1 });

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
      priorityRank:   item.priorityRank,
      status:         item.status,
      orderPeriod:    item.orderPeriod?.faculty || "",
      submittedToLibrarianAt: item.submittedToLibrarianAt
    }));

    if (req.params.format === "pdf") {
      return res.json({ message: "PDF export data prepared", data });
    }

    const headers = [
      "Title","Author","ISBN","Publisher","Edition",
      "Publication Year","Binding","Agree Latest","Price (LKR)","Copies",
      "Department","Submitted By","Rank","Status","Order Period","Submitted To Librarian At"
    ];

    const csv = [
      headers.join(","),
      ...data.map((row) =>
        [
          row.title, row.author, row.isbn, row.publisher, row.edition,
          row.publicationYear, row.binding, row.agreeLatest, row.price, row.copies,
          row.department, row.submittedBy, row.priorityRank, row.status, row.orderPeriod, row.submittedToLibrarianAt
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

// PATCH - Lecturer updates recommendation during submission period
router.patch("/:id", requireAuth, allowRoles("lecturer"), async (req, res) => {
  try {
    const existing = await Recommendation.findOne({
      _id: req.params.id,
      submittedBy: req.user.id
    });

    if (!existing) {
      return res.status(404).json({ message: "Recommendation not found" });
    }

    // Check if period is still open
    if (existing.orderPeriod) {
      const openPeriod = await OrderPeriod.findOne({
        _id: existing.orderPeriod,
        status: "open"
      });

      if (!openPeriod) {
        return res.status(403).json({ message: "The submission period is closed. You cannot edit this recommendation." });
      }
    }

    // Check if already submitted to librarian
    if (existing.reviewedBy || existing.submittedToLibrarianAt) {
      return res.status(400).json({ message: "This recommendation has already been submitted to the librarian and cannot be edited." });
    }

    const {
      title, author, isbn, publisher, edition,
      publicationYear, binding, agreeLatest, price, copies,
      additionalNotes
    } = req.body;

    const updated = await Recommendation.findByIdAndUpdate(
      req.params.id,
      {
        title: title ?? existing.title,
        author: author ?? existing.author,
        isbn: isbn ?? existing.isbn,
        publisher: publisher ?? existing.publisher,
        edition: edition ?? existing.edition,
        publicationYear: publicationYear ?? existing.publicationYear,
        binding: binding ?? existing.binding,
        agreeLatest: agreeLatest ?? existing.agreeLatest,
        price: price ?? existing.price,
        copies: copies ?? existing.copies,
        additionalNotes: additionalNotes ?? existing.additionalNotes
      },
      { new: true, runValidators: true }
    )
      .populate("submittedBy", "name department")
      .populate("orderPeriod", "faculty startDate endDate hodRecommendationDays status");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update recommendation", error: err.message });
  }
});

// DELETE - Lecturer deletes recommendation during submission period
router.delete("/:id", requireAuth, allowRoles("lecturer"), async (req, res) => {
  try {
    const recommendation = await Recommendation.findOne({
      _id: req.params.id,
      submittedBy: req.user.id
    });

    if (!recommendation) {
      return res.status(404).json({ message: "Recommendation not found" });
    }

    // Check if period is still open
    if (recommendation.orderPeriod) {
      const openPeriod = await OrderPeriod.findOne({
        _id: recommendation.orderPeriod,
        status: "open"
      });

      if (!openPeriod) {
        return res.status(403).json({ message: "The submission period is closed. You cannot delete this recommendation." });
      }
    }

    // Check if already submitted to librarian
    if (recommendation.reviewedBy || recommendation.submittedToLibrarianAt) {
      return res.status(400).json({ message: "This recommendation has already been submitted to the librarian and cannot be deleted." });
    }

    await Recommendation.findByIdAndDelete(req.params.id);
    res.json({ message: "Recommendation deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete recommendation", error: err.message });
  }
});

export default router;
