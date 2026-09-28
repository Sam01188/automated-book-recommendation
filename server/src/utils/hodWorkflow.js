import Recommendation from "../models/Recommendation.js";
import OrderPeriod from "../models/OrderPeriod.js";
import User from "../models/User.js";

export function normalizeDepartment(department) {
  return String(department || "").trim().toUpperCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildDepartmentFilter(department) {
  const normalized = normalizeDepartment(department);
  if (!normalized) {
    return { _id: null };
  }

  return { department: new RegExp(`^${escapeRegExp(normalized)}$`, "i") };
}

export function calculateHodDeadline(period) {
  const deadline = new Date(period.endDate);
  deadline.setDate(deadline.getDate() + (period.hodRecommendationDays || 7));
  deadline.setHours(23, 59, 59, 999);
  return deadline;
}

function sortForLibrarianList(a, b) {
  const aRank = Number.isFinite(a.priorityRank) ? a.priorityRank : Number.MAX_SAFE_INTEGER;
  const bRank = Number.isFinite(b.priorityRank) ? b.priorityRank : Number.MAX_SAFE_INTEGER;
  if (aRank !== bRank) return aRank - bRank;
  return new Date(a.createdAt) - new Date(b.createdAt);
}

async function findDepartmentHod(department) {
  return User.findOne({
    role: "hod",
    ...buildDepartmentFilter(department)
  }).select("_id");
}

export async function submitDepartmentListToLibrarian({ orderPeriodId, department, hodId, requireCompleteRanking = true }) {
  const departmentFilter = buildDepartmentFilter(department);
  const query = {
    ...departmentFilter,
    status: { $ne: "rejected" },
    submittedToLibrarianAt: { $exists: false }
  };
  if (orderPeriodId) {
    query.orderPeriod = orderPeriodId;
  }
  const recommendations = await Recommendation.find(query).sort({ priorityRank: 1, createdAt: 1 });

  if (recommendations.length === 0) {
    return { submittedCount: 0 };
  }

  if (requireCompleteRanking && recommendations.some((item) => !Number.isFinite(item.priorityRank))) {
    throw new Error("Please order every recommendation before submitting to the librarian.");
  }

  const reviewerId = hodId || (await findDepartmentHod(department))?._id;
  const orderedRecommendations = recommendations.sort(sortForLibrarianList);
  const submittedAt = new Date();

  await Promise.all(
    orderedRecommendations.map((item, index) => {
      item.priorityRank = index + 1;
      item.priority = item.priority === "unassigned" ? "medium" : item.priority;
      item.status = "submitted";
      item.reviewedBy = reviewerId || item.reviewedBy;
      item.submittedToLibrarianAt = submittedAt;
      return item.save();
    })
  );

  return { submittedCount: orderedRecommendations.length };
}

export async function finalizeExpiredHodPeriods(now = new Date()) {
  const periods = await OrderPeriod.find({ status: "hod_priority" });

  for (const period of periods) {
    if (calculateHodDeadline(period) > now) {
      continue;
    }

    const departments = await Recommendation.distinct("department", {
      orderPeriod: period._id,
      status: { $ne: "rejected" },
      submittedToLibrarianAt: { $exists: false }
    });

    await Promise.all(
      departments.map((department) =>
        submitDepartmentListToLibrarian({
          orderPeriodId: period._id,
          department,
          requireCompleteRanking: false
        })
      )
    );

    period.status = "closed";
    await period.save();
  }
}
