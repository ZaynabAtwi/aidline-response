/**
 * Secure Messages Routes
 * Handles encrypted communication between users and service providers within a request context.
 */
import { Router, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { body, param, query } from "express-validator";
import { pool } from "../config/database.js";
import { authenticate } from "../middleware/auth.js";
import { handleValidationErrors } from "../middleware/validation.js";
import { AuthRequest } from "../types/index.js";

const router = Router();

// GET /api/messages/:requestId — fetch all messages for a request
router.get(
  "/:requestId",
  authenticate,
  [param("requestId").isUUID()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { requestId } = req.params;

    // Verify user has access to this request
    const [reqRows] = await pool.query<any[]>(
      "SELECT user_id FROM service_requests WHERE id = ?",
      [requestId]
    );
    const serviceRequest = (reqRows as any[])[0];
    if (!serviceRequest) {
      res.status(404).json({ success: false, error: "Request not found" });
      return;
    }

    const isAdmin = ["ngo_admin", "system_admin", "healthcare_provider", "pharmacy_staff"].includes(req.user!.role);
    if (serviceRequest.user_id !== req.user!.userId && !isAdmin) {
      res.status(403).json({ success: false, error: "Access denied" });
      return;
    }

    const [messages] = await pool.query(
      "SELECT * FROM secure_messages WHERE request_id = ? ORDER BY sent_at ASC",
      [requestId]
    );

    // Mark messages as read for the calling user
    const senderType = isAdmin ? "user" : "provider";
    await pool.query(
      `UPDATE secure_messages
       SET is_read = TRUE
       WHERE request_id = ? AND sender_type = ? AND is_read = FALSE`,
      [requestId, senderType]
    );

    res.json({ success: true, data: messages });
  }
);

// POST /api/messages/:requestId — send a message within a request
router.post(
  "/:requestId",
  authenticate,
  [
    param("requestId").isUUID(),
    body("content").trim().notEmpty().isLength({ max: 2000 }),
    body("attachments").optional().isArray(),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { requestId } = req.params;
    const { content, attachments } = req.body;

    const [reqRows] = await pool.query<any[]>(
      "SELECT user_id, status FROM service_requests WHERE id = ?",
      [requestId]
    );
    const serviceRequest = (reqRows as any[])[0];
    if (!serviceRequest) {
      res.status(404).json({ success: false, error: "Request not found" });
      return;
    }
    if (["resolved", "cancelled"].includes(serviceRequest.status)) {
      res.status(400).json({ success: false, error: "Cannot message on a closed request" });
      return;
    }

    const isAdmin = ["ngo_admin", "system_admin", "healthcare_provider", "pharmacy_staff"].includes(req.user!.role);
    if (serviceRequest.user_id !== req.user!.userId && !isAdmin) {
      res.status(403).json({ success: false, error: "Access denied" });
      return;
    }

    const senderType = isAdmin ? "provider" : "user";
    const msgId = uuidv4();

    await pool.query(
      `INSERT INTO secure_messages (id, request_id, sender_id, sender_type, content, attachments)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        msgId, requestId, req.user!.userId, senderType, content,
        attachments ? JSON.stringify(attachments) : null,
      ]
    );

    // Keep the request alive by touching updated_at
    await pool.query(
      "UPDATE service_requests SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [requestId]
    );

    const [newMsg] = await pool.query<any[]>(
      "SELECT * FROM secure_messages WHERE id = ?",
      [msgId]
    );

    res.status(201).json({ success: true, data: (newMsg as any[])[0] });
  }
);

// GET /api/messages/:requestId/unread-count
router.get(
  "/:requestId/unread-count",
  authenticate,
  [param("requestId").isUUID()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const isAdmin = ["ngo_admin", "system_admin", "healthcare_provider", "pharmacy_staff"].includes(req.user!.role);
    const countSenderType = isAdmin ? "user" : "provider";

    const [[{ count }]] = await pool.query<any[]>(
      "SELECT COUNT(*) AS count FROM secure_messages WHERE request_id = ? AND sender_type = ? AND is_read = FALSE",
      [req.params.requestId, countSenderType]
    ) as any;

    res.json({ success: true, data: { unread: count } });
  }
);

export default router;
