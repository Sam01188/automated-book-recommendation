import AuditLog from "../models/AuditLog.js";

export async function recordAuditLog(req, action, target = {}, changes = [], options = {}) {
  try {
    const actor = options.actor || req.user || {};
    await AuditLog.create({
      action,
      actorId: actor.id || actor._id,
      actorName: actor.name || actor.email || "Unknown",
      actorEmail: actor.email || "",
      actorRole: actor.role || "",
      targetType: options.targetType || "user",
      targetId: options.targetId || target._id || target.id,
      targetName: options.targetName || target.name || target.title || target.email || "",
      targetEmail: target.email || "",
      changes,
      details: options.details || ""
    });
  } catch (error) {
    console.error("Unable to record audit activity:", error);
  }
}

export const getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
    const filters = [];

    if (req.query.role) {
      filters.push({
        $or: req.query.role === "admin"
          ? [{ actorRole: "admin" }, { actorRole: { $exists: false } }]
          : [{ actorRole: req.query.role }]
      });
    }
    if (req.query.action === "password_reset") {
      filters.push({ action: { $in: ["password_reset_requested", "password_reset"] } });
    } else if (req.query.action) {
      filters.push({ action: req.query.action });
    }

    const dateRange = {};
    for (const [field, boundary] of [["startDate", "$gte"], ["endDate", "$lt"]]) {
      const value = req.query[field];
      if (!value) continue;
      if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return res.status(400).json({ message: "Use valid start and end dates." });
      }

      const date = new Date(`${value}T00:00:00.000Z`);
      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        return res.status(400).json({ message: "Use valid start and end dates." });
      }
      if (boundary === "$lt") date.setUTCDate(date.getUTCDate() + 1);
      dateRange[boundary] = date;
    }
    if (Object.keys(dateRange).length > 0) filters.push({ createdAt: dateRange });

    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escapedSearch, "i");
      filters.push({
        $or: [
          { actorName: searchRegex },
          { actorEmail: searchRegex },
          { action: searchRegex },
          { targetName: searchRegex },
          { targetEmail: searchRegex },
          { details: searchRegex },
          { changes: searchRegex }
        ]
      });
    }

    const query = filters.length ? { $and: filters } : {};
    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      AuditLog.countDocuments(query)
    ]);

    res.json({ logs, total, page, pages: Math.ceil(total / limit), limit });
  } catch (error) {
    res.status(500).json({ message: "Unable to load audit logs right now." });
  }
};
