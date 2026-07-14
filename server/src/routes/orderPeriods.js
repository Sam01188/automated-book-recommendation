import express from "express";
import OrderPeriod from "../models/OrderPeriod.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";
import { calculateHodDeadline, finalizeExpiredHodPeriods } from "../utils/hodWorkflow.js";

const router = express.Router();
const DEFAULT_FACULTY = "Engineering Faculty";

function normalizePeriodPayload(body) {
  return {
    faculty: body.faculty || DEFAULT_FACULTY,
    startDate: body.startDate,
    endDate: body.endDate,
    hodRecommendationDays: body.hodRecommendationDays
  };
}

router.get("/", requireAuth, allowRoles("librarian", "hod", "admin"), async (req, res) => {
  try {
    await finalizeExpiredHodPeriods();
    const periods = await OrderPeriod.find()
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.json(periods);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch order periods" });
  }
});

router.get("/current", requireAuth, async (req, res) => {
  try {
    await finalizeExpiredHodPeriods();
    const period = await OrderPeriod.findOne({ status: "open" }).sort({ createdAt: -1, startDate: -1 });

    res.json({ isOpen: Boolean(period), period });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch current order period" });
  }
});

router.get("/current-hod", requireAuth, async (req, res) => {
  try {
    await finalizeExpiredHodPeriods();
    const period = await OrderPeriod.findOne({
      status: "hod_priority"
    }).sort({ startDate: -1 });

    res.json({ isOpen: Boolean(period), period });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch current HOD order period" });
  }
});

router.post("/", requireAuth, allowRoles("librarian"), async (req, res) => {
  try {
    const period = await OrderPeriod.create({
      ...normalizePeriodPayload(req.body),
      status: "open",
      createdBy: req.user.id
    });

    res.status(201).json(period);
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to create order period" });
  }
});

router.patch("/:id", requireAuth, allowRoles("librarian"), async (req, res) => {
  try {
    const period = await OrderPeriod.findById(req.params.id);
    if (!period) {
      return res.status(404).json({ message: "Order period not found" });
    }

    if (period.status === "open" && req.body.startDate) {
      return res.status(400).json({ message: "Start date cannot be changed after a period is opened" });
    }

    const updates = normalizePeriodPayload(req.body);
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        period[key] = value;
      }
    });

    await period.save();
    res.json(period);
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to update order period" });
  }
});


router.patch("/:id/close", requireAuth, allowRoles("librarian"), async (req, res) => {
  try {
    const existing = await OrderPeriod.findById(req.params.id);
    if (existing?.status === "hod_priority") {
      await finalizeExpiredHodPeriods(calculateHodDeadline(existing));
    }

    const period = await OrderPeriod.findByIdAndUpdate(
      req.params.id,
      { status: "closed" },
      { new: true, runValidators: true }
    );

    if (!period) {
      return res.status(404).json({ message: "Order period not found" });
    }

    res.json(period);
  } catch (err) {
    res.status(500).json({ message: "Failed to close order period" });
  }
});

router.patch("/:id/open-hod", requireAuth, allowRoles("librarian"), async (req, res) => {
  try {
    const period = await OrderPeriod.findByIdAndUpdate(
      req.params.id,
      { status: "hod_priority" },
      { new: true, runValidators: true }
    );

    if (!period) {
      return res.status(404).json({ message: "Order period not found" });
    }

    res.json(period);
  } catch (err) {
    res.status(500).json({ message: "Failed to open HOD period" });
  }
});

router.delete("/:id", requireAuth, allowRoles("librarian"), async (req, res) => {
  try {
    const period = await OrderPeriod.findById(req.params.id);
    if (!period) {
      return res.status(404).json({ message: "Order period not found" });
    }

    if (period.status === "open") {
      return res.status(400).json({ message: "Close the order period before deleting it" });
    }

    await period.deleteOne();
    res.json({ message: "Order period deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete order period" });
  }
});

export default router;
