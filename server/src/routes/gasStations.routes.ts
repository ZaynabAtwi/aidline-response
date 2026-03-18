import { Router } from "express";
import * as gasStationsController from "../controllers/gasStations.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(gasStationsController.listGasStations));

export default router;
