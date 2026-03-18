import { Router } from "express";
import * as volunteersController from "../controllers/volunteers.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { authMiddleware, requireRoles } from "../middleware/authMiddleware";

const router = Router();

router.get("/", asyncHandler(volunteersController.listVolunteers));
router.post("/", authMiddleware, asyncHandler(volunteersController.createVolunteer));
router.patch(
  "/:id/status",
  authMiddleware,
  requireRoles("ADMIN", "COORDINATOR"),
  asyncHandler(volunteersController.updateVolunteerStatus)
);

export default router;
