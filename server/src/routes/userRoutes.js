import express from "express";
import {
  createUser,
  importUsers,
  getUsers,
  deleteUser,
  updateUser,
  bulkUpdateUsers,
  bulkDeleteUsers
} from "../controllers/userController.js";
import { getAuditLogs } from "../controllers/auditController.js";

import { requireAuth, allowRoles } from "../middleware/auth.js";

const router = express.Router();

// Admin only
router.get("/audit-logs", requireAuth, allowRoles("admin"), getAuditLogs);
router.post("/import", requireAuth, allowRoles("admin"), importUsers);
router.post("/", requireAuth, allowRoles("admin"), createUser);
router.get("/", requireAuth, allowRoles("admin"), getUsers);
router.patch("/bulk", requireAuth, allowRoles("admin"), bulkUpdateUsers);
router.delete("/bulk", requireAuth, allowRoles("admin"), bulkDeleteUsers);
router.delete("/:id", requireAuth, allowRoles("admin"), deleteUser);
router.put("/:id", requireAuth, allowRoles("admin"), updateUser);

export default router;