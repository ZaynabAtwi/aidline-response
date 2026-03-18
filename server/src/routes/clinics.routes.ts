import { Router } from "express";
import * as clinicsController from "../controllers/clinics.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(clinicsController.listClinics));
router.get("/:id", asyncHandler(clinicsController.getClinicById));

export default router;
