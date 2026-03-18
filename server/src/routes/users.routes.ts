import { Router } from "express";
import * as usersController from "../controllers/users.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/me", authMiddleware, asyncHandler(usersController.getMe));

export default router;
