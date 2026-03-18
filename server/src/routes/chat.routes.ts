import { Router } from "express";
import * as chatController from "../controllers/chat.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/messages", authMiddleware, asyncHandler(chatController.listMessages));
router.post("/messages", authMiddleware, asyncHandler(chatController.createMessage));

export default router;
