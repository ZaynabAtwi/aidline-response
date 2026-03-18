import { Router } from "express";
import * as sheltersController from "../controllers/shelters.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(sheltersController.listShelters));
router.get("/:id", asyncHandler(sheltersController.getShelterById));

export default router;
