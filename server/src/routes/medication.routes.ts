import { Router } from "express";
import * as medicationController from "../controllers/medication.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/", asyncHandler(medicationController.listMedication));
router.post("/", authMiddleware, asyncHandler(medicationController.createMedication));

export default router;
