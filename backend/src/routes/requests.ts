/**
 * Service Request Routes — the heart of the request routing architecture.
 *
 * Pipeline:
 *   POST /requests           → creates request (status: pending)
 *   POST /requests/:id/classify → runs AI triage (status: classified)
 *   POST /requests/:id/route    → assigns to provider (status: routed)
 *   PATCH /requests/:id/status  → provider accepts/resolves (status: accepted / resolved)
 */
import { Router, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { body, param, query } from "express-validator";
import { pool } from "../config/database.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { handleValidationErrors } from "../middleware/validation.js";
import {
  AuthRequest,
  RequestType,
  UrgencyLevel,
  RequestStatus,
  AssignmentStatus,
  ClassificationCategory,
  ProviderType,
} from "../types/index.js";

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

function classifyRequest(
  type: RequestType,
  urgency: UrgencyLevel
): { category: ClassificationCategory; providerType: ProviderType; priority: number } {
  const urgencyScore: Record<UrgencyLevel, number> = {
    critical: 95, high: 75, medium: 55, low: 30,
  };

  switch (type) {
    case "sos":
      return { category: "medical_emergency", providerType: "healthcare", priority: 100 };
    case "medical":
      return { category: "medical_emergency", providerType: "healthcare", priority: urgencyScore[urgency] + 5 };
    case "medication":
      return { category: "medication_need", providerType: "pharmacy", priority: urgencyScore[urgency] };
    case "humanitarian":
      return { category: "humanitarian_aid", providerType: "ngo", priority: urgencyScore[urgency] - 5 };
    default:
      return { category: "general_inquiry", providerType: "ngo", priority: 20 };
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/requests — list requests for current user (or all for admins)
router.get(
  "/",
  authenticate,
  [
    query("status").optional().isIn(["pending", "classified", "routed", "accepted", "in_progress", "resolved", "cancelled"]),
    query("type").optional().isIn(["sos", "medical", "medication", "humanitarian", "general"]),
    query("page").optional().isInt({ min: 1 }),
    query("pageSize").optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { status, type, page = 1, pageSize = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const isAdmin = ["ngo_admin", "system_admin", "healthcare_provider", "pharmacy_staff"].includes(req.user!.role);

    let where = isAdmin ? "1=1" : "sr.user_id = ?";
    const params: any[] = isAdmin ? [] : [req.user!.userId];

    if (status) { where += " AND sr.status = ?"; params.push(status); }
    if (type)   { where += " AND sr.type = ?";   params.push(type);   }

    const [rows] = await pool.query(
      `SELECT
         sr.*,
         rc.category, rc.priority_score, rc.recommended_provider_type,
         ra.provider_id AS assigned_provider_id, ra.status AS assignment_status,
         sp.name AS provider_name
       FROM service_requests sr
       LEFT JOIN request_classifications rc ON rc.request_id = sr.id
       LEFT JOIN request_assignments     ra ON ra.request_id = sr.id AND ra.status IN ('accepted','pending')
       LEFT JOIN service_providers       sp ON sp.id = ra.provider_id
       WHERE ${where}
       ORDER BY sr.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );

    const [[{ total }]] = await pool.query<any[]>(
      `SELECT COUNT(*) AS total FROM service_requests sr WHERE ${where}`,
      params
    ) as any;

    res.json({
      success: true,
      data: { items: rows, total, page: Number(page), pageSize: Number(pageSize) },
    });
  }
);

// GET /api/requests/:id
router.get(
  "/:id",
  authenticate,
  [param("id").isUUID()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const [rows] = await pool.query<any[]>(
      `SELECT
         sr.*,
         rc.category, rc.priority_score, rc.recommended_provider_type,
         ra.provider_id AS assigned_provider_id, ra.status AS assignment_status,
         sp.name AS provider_name, sp.type AS provider_type,
         sp.contact_email, sp.contact_phone
       FROM service_requests sr
       LEFT JOIN request_classifications rc ON rc.request_id = sr.id
       LEFT JOIN request_assignments     ra ON ra.request_id = sr.id
       LEFT JOIN service_providers       sp ON sp.id = ra.provider_id
       WHERE sr.id = ?`,
      [req.params.id]
    );

    const request = (rows as any[])[0];
    if (!request) {
      res.status(404).json({ success: false, error: "Request not found" });
      return;
    }

    const isOwner = request.user_id === req.user!.userId;
    const isAdmin = ["ngo_admin", "system_admin", "healthcare_provider", "pharmacy_staff"].includes(req.user!.role);
    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, error: "Access denied" });
      return;
    }

    res.json({ success: true, data: request });
  }
);

// POST /api/requests — submit a new service request
router.post(
  "/",
  authenticate,
  [
    body("type").isIn(["sos", "medical", "medication", "humanitarian", "general"]),
    body("title").trim().notEmpty().isLength({ max: 255 }),
    body("description").optional().trim(),
    body("urgency").optional().isIn(["low", "medium", "high", "critical"]),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const {
      type,
      title,
      description,
      urgency = "medium",
      attachments,
    } = req.body;

    const id = uuidv4();
    const userId = req.user!.userId;

    await pool.query(
      `INSERT INTO service_requests (id, user_id, type, title, description, urgency, attachments)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id, userId, type, title,
        description || null,
        urgency,
        attachments ? JSON.stringify(attachments) : null,
      ]
    );

    // Auto-classify and auto-route immediately
    const { category, providerType, priority } = classifyRequest(type as RequestType, urgency as UrgencyLevel);
    const classId = uuidv4();

    await pool.query(
      `INSERT INTO request_classifications
         (id, request_id, category, priority_score, recommended_provider_type)
       VALUES (?, ?, ?, ?, ?)`,
      [classId, id, category, priority, providerType]
    );

    await pool.query(
      "UPDATE service_requests SET status = 'classified', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    // Find first available active provider of the recommended type
    const [providers] = await pool.query<any[]>(
      "SELECT id FROM service_providers WHERE type = ? AND is_active = TRUE LIMIT 1",
      [providerType]
    );
    const provider = (providers as any[])[0];

    if (provider) {
      const assignId = uuidv4();
      await pool.query(
        "INSERT INTO request_assignments (id, request_id, provider_id, status) VALUES (?, ?, ?, 'pending')",
        [assignId, id, provider.id]
      );
      await pool.query(
        "UPDATE service_requests SET status = 'routed', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [id]
      );

      // Post a system message to open the communication channel
      await pool.query(
        `INSERT INTO secure_messages (id, request_id, sender_id, sender_type, content)
         VALUES (?, ?, ?, 'system', ?)`,
        [
          uuidv4(), id, userId,
          `Your ${type} request has been received and routed to ${provider.id}. A responder will contact you shortly.`,
        ]
      );
    }

    const [newRequest] = await pool.query<any[]>(
      "SELECT * FROM service_requests WHERE id = ?",
      [id]
    );

    res.status(201).json({ success: true, data: (newRequest as any[])[0] });
  }
);

// PATCH /api/requests/:id/status — update request status (providers)
router.patch(
  "/:id/status",
  authenticate,
  requireRole("ngo_admin", "healthcare_provider", "pharmacy_staff", "system_admin"),
  [
    param("id").isUUID(),
    body("status").isIn(["accepted", "in_progress", "resolved", "cancelled"]),
    body("notes").optional().trim(),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status, notes } = req.body;

    const resolved_at = status === "resolved" ? new Date() : null;

    await pool.query(
      `UPDATE service_requests
       SET status = ?, resolved_at = COALESCE(?, resolved_at), updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, resolved_at, id]
    );

    if (status === "accepted") {
      await pool.query(
        `UPDATE request_assignments
         SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
         WHERE request_id = ? AND status = 'pending'`,
        [id]
      );
    }

    if (notes) {
      await pool.query(
        "INSERT INTO secure_messages (id, request_id, sender_id, sender_type, content) VALUES (?, ?, ?, 'provider', ?)",
        [uuidv4(), id, req.user!.userId, notes]
      );
    }

    res.json({ success: true, message: `Request status updated to ${status}` });
  }
);

// DELETE /api/requests/:id — cancel own request
router.delete(
  "/:id",
  authenticate,
  [param("id").isUUID()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const [rows] = await pool.query<any[]>(
      "SELECT user_id, status FROM service_requests WHERE id = ?",
      [req.params.id]
    );
    const request = (rows as any[])[0];
    if (!request) {
      res.status(404).json({ success: false, error: "Request not found" });
      return;
    }
    if (request.user_id !== req.user!.userId) {
      res.status(403).json({ success: false, error: "Not your request" });
      return;
    }
    if (["resolved", "cancelled"].includes(request.status)) {
      res.status(400).json({ success: false, error: "Cannot cancel a completed request" });
      return;
    }

    await pool.query(
      "UPDATE service_requests SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [req.params.id]
    );
    res.json({ success: true, message: "Request cancelled" });
  }
);

export default router;
