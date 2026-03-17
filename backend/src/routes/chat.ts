/**
 * Chat Routes — Anonymous support chat between users and NGO responders.
 */
import { Router, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { body, param } from "express-validator";
import { pool } from "../config/database.js";
import { authenticate } from "../middleware/auth.js";
import { handleValidationErrors } from "../middleware/validation.js";
import { AuthRequest } from "../types/index.js";

const router = Router();

const MAX_MESSAGE_LENGTH = 500;

// GET /api/chat/conversations — list all conversations (admin) or own (user)
router.get(
  "/conversations",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const isAdmin = ["ngo_admin", "system_admin"].includes(req.user!.role);
    const where  = isAdmin ? "1=1" : "user_id = ?";
    const params = isAdmin ? []    : [req.user!.userId];

    const [rows] = await pool.query(
      `SELECT * FROM chat_conversations WHERE ${where} ORDER BY updated_at DESC`,
      params
    );
    res.json({ success: true, data: rows });
  }
);

// POST /api/chat/conversations — create or resume a conversation
router.post(
  "/conversations",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.userId;

    // Return existing open/in-progress conversation if present
    const [existing] = await pool.query<any[]>(
      "SELECT * FROM chat_conversations WHERE user_id = ? AND status != 'closed' ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    if ((existing as any[]).length > 0) {
      res.json({ success: true, data: (existing as any[])[0] });
      return;
    }

    const id = uuidv4();
    await pool.query(
      "INSERT INTO chat_conversations (id, user_id, status) VALUES (?, ?, 'open')",
      [id, userId]
    );
    const [newConv] = await pool.query<any[]>(
      "SELECT * FROM chat_conversations WHERE id = ?",
      [id]
    );
    res.status(201).json({ success: true, data: (newConv as any[])[0] });
  }
);

// GET /api/chat/conversations/:id/messages
router.get(
  "/conversations/:id/messages",
  authenticate,
  [param("id").isUUID()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const [conv] = await pool.query<any[]>(
      "SELECT user_id FROM chat_conversations WHERE id = ?",
      [req.params.id]
    );
    const conversation = (conv as any[])[0];
    if (!conversation) {
      res.status(404).json({ success: false, error: "Conversation not found" });
      return;
    }

    const isAdmin = ["ngo_admin", "system_admin"].includes(req.user!.role);
    if (conversation.user_id !== req.user!.userId && !isAdmin) {
      res.status(403).json({ success: false, error: "Access denied" });
      return;
    }

    const [messages] = await pool.query(
      "SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC",
      [req.params.id]
    );

    // Mark messages from opposite side as read
    const markSender = isAdmin ? "user" : "ngo";
    await pool.query(
      "UPDATE chat_messages SET is_read = TRUE WHERE conversation_id = ? AND sender = ? AND is_read = FALSE",
      [req.params.id, markSender]
    );

    res.json({ success: true, data: messages });
  }
);

// POST /api/chat/conversations/:id/messages
router.post(
  "/conversations/:id/messages",
  authenticate,
  [
    param("id").isUUID(),
    body("message").trim().notEmpty().isLength({ max: MAX_MESSAGE_LENGTH }),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { message } = req.body;

    const [conv] = await pool.query<any[]>(
      "SELECT user_id, status FROM chat_conversations WHERE id = ?",
      [req.params.id]
    );
    const conversation = (conv as any[])[0];
    if (!conversation) {
      res.status(404).json({ success: false, error: "Conversation not found" });
      return;
    }
    if (conversation.status === "closed") {
      res.status(400).json({ success: false, error: "This conversation is closed" });
      return;
    }

    const isAdmin = ["ngo_admin", "system_admin"].includes(req.user!.role);
    if (conversation.user_id !== req.user!.userId && !isAdmin) {
      res.status(403).json({ success: false, error: "Access denied" });
      return;
    }

    const sender = isAdmin ? "ngo" : "user";
    const msgId  = uuidv4();

    await pool.query(
      "INSERT INTO chat_messages (id, conversation_id, sender, message) VALUES (?, ?, ?, ?)",
      [msgId, req.params.id, sender, message]
    );

    // Update conversation status and timestamp
    const newStatus = isAdmin ? "in_progress" : conversation.status;
    await pool.query(
      "UPDATE chat_conversations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [newStatus, req.params.id]
    );

    const [newMsg] = await pool.query<any[]>(
      "SELECT * FROM chat_messages WHERE id = ?",
      [msgId]
    );
    res.status(201).json({ success: true, data: (newMsg as any[])[0] });
  }
);

// PATCH /api/chat/conversations/:id/status
router.patch(
  "/conversations/:id/status",
  authenticate,
  [
    param("id").isUUID(),
    body("status").isIn(["open", "in_progress", "closed"]),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const isAdmin = ["ngo_admin", "system_admin"].includes(req.user!.role);
    if (!isAdmin) {
      res.status(403).json({ success: false, error: "Only admins can change conversation status" });
      return;
    }
    await pool.query(
      "UPDATE chat_conversations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [req.body.status, req.params.id]
    );
    res.json({ success: true, message: `Conversation status updated to ${req.body.status}` });
  }
);

export default router;
