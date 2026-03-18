import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller";
import { authMiddleware, requireRoles } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get(
  "/summary",
  authMiddleware,
  requireRoles("ADMIN", "COORDINATOR"),
  asyncHandler(dashboardController.getSummary)
);

export default router;
