/**
 * SOS Alert Routes
 * Emergency requests routed through the classification pipeline without location data.
 */
import { Router, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { body, param } from "express-validator";
import { pool } from "../config/database.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { handleValidationErrors } from "../middleware/validation.js";
import { AuthRequest } from "../types/index.js";

const router = Router();

// GET /api/sos — list SOS alerts (admin/provider only)
router.get(
  "/",
  authenticate,
  requireRole("ngo_admin", "healthcare_provider", "system_admin"),
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const [rows] = await pool.query(
      `SELECT sa.*, u.full_name AS user_name, sp.name AS responder_name
       FROM sos_alerts sa
       LEFT JOIN users           u  ON u.id  = sa.user_id
       LEFT JOIN service_providers sp ON sp.id = sa.responded_by
       ORDER BY sa.created_at DESC`
    );
    res.json({ success: true, data: rows });
  }
);

// GET /api/sos/my — list own SOS alerts
router.get(
  "/my",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const [rows] = await pool.query(
      "SELECT * FROM sos_alerts WHERE user_id = ? ORDER BY created_at DESC",
      [req.user!.userId]
    );
    res.json({ success: true, data: rows });
  }
);

// POST /api/sos — submit a new SOS alert
router.post(
  "/",
  authenticate,
  [body("message").optional().trim().isLength({ max: 1000 })],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { message } = req.body;
    const userId = req.user!.userId;
    const sosId = uuidv4();

    // Create the SOS alert record
    await pool.query(
      "INSERT INTO sos_alerts (id, user_id, message, status) VALUES (?, ?, ?, 'active')",
      [sosId, userId, message || null]
    );

    // Also create a high-priority service request and link it
    const reqId = uuidv4();
    await pool.query(
      `INSERT INTO service_requests (id, user_id, type, title, description, urgency, status)
       VALUES (?, ?, 'sos', 'SOS Emergency Alert', ?, 'critical', 'pending')`,
      [reqId, userId, message || "Emergency assistance required"]
    );

    // Link SOS alert to the service request
    await pool.query(
      "UPDATE sos_alerts SET request_id = ? WHERE id = ?",
      [reqId, sosId]
    );

    // Auto-classify as critical medical emergency
    const classId = uuidv4();
    await pool.query(
      `INSERT INTO request_classifications
         (id, request_id, category, priority_score, recommended_provider_type, classification_notes)
       VALUES (?, ?, 'medical_emergency', 100, 'healthcare', 'Auto-classified SOS alert - immediate response required')`,
      [classId, reqId]
    );

    await pool.query(
      "UPDATE service_requests SET status = 'classified' WHERE id = ?",
      [reqId]
    );

    // Route to first available healthcare provider
    const [providers] = await pool.query<any[]>(
      "SELECT id FROM service_providers WHERE type = 'healthcare' AND is_active = TRUE LIMIT 1"
    );
    const provider = (providers as any[])[0];

    if (provider) {
      await pool.query(
        "INSERT INTO request_assignments (id, request_id, provider_id, status) VALUES (?, ?, ?, 'pending')",
        [uuidv4(), reqId, provider.id]
      );
      await pool.query(
        "UPDATE service_requests SET status = 'routed' WHERE id = ?",
        [reqId]
      );

      // System message
      await pool.query(
        `INSERT INTO secure_messages (id, request_id, sender_id, sender_type, content)
         VALUES (?, ?, ?, 'system', 'CRITICAL: SOS alert received. Emergency responders have been notified.')`,
        [uuidv4(), reqId, userId]
      );
    }

    const [alert] = await pool.query<any[]>(
      "SELECT * FROM sos_alerts WHERE id = ?",
      [sosId]
    );

    res.status(201).json({
      success: true,
      data: {
        ...(alert as any[])[0],
        service_request_id: reqId,
      },
    });
  }
);

// PATCH /api/sos/:id/status — update SOS status (responders)
router.patch(
  "/:id/status",
  authenticate,
  requireRole("ngo_admin", "healthcare_provider", "system_admin"),
  [
    param("id").isUUID(),
    body("status").isIn(["active", "responding", "resolved", "cancelled"]),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;

    const updates: any = { status };
    if (status === "resolved") updates.resolved_at = new Date();
    if (status === "responding") updates.responded_by = req.user!.userId;

    const setClauses = Object.keys(updates)
      .map((k) => `${k} = ?`)
      .join(", ");

    await pool.query(
      `UPDATE sos_alerts SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...Object.values(updates), id]
    );

    res.json({ success: true, message: `SOS alert updated to ${status}` });
  }
);

export default router;
