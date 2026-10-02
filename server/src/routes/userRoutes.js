import express from "express";
import {
  createUser,
  getUsers,
  deleteUser,
  updateUser
} from "../controllers/userController.js";
import { getAuditLogs } from "../controllers/auditController.js";

import { requireAuth, allowRoles } from "../middleware/auth.js";

const router = express.Router();

// Admin only
router.get("/audit-logs", requireAuth, allowRoles("admin"), getAuditLogs);
router.post("/", requireAuth, allowRoles("admin"), createUser);
router.get("/", requireAuth, allowRoles("admin"), getUsers);
router.delete("/:id", requireAuth, allowRoles("admin"), deleteUser);
router.put("/:id", requireAuth, allowRoles("admin"), updateUser);

export default router;