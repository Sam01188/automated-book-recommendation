import express from "express";
import {
	login,
	logout,
	me,
	changePassword,
	updateProfile,
	requestPasswordReset,
	resetPassword
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", login);
router.post("/password-reset/request", requestPasswordReset);
router.post("/password-reset/confirm", resetPassword);
router.post("/change-password", requireAuth, changePassword);
router.put("/profile", requireAuth, updateProfile);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);

export default router;