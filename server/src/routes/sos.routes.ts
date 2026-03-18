import { Router } from "express";
import * as sosController from "../controllers/sos.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { authMiddleware, requireRoles } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authMiddleware, asyncHandler(sosController.listSos));
router.post("/", asyncHandler(sosController.createSos));
router.patch(
  "/:id/status",
  authMiddleware,
  requireRoles("ADMIN", "COORDINATOR"),
  asyncHandler(sosController.updateSosStatus)
);

export default router;
