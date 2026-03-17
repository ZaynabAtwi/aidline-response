/**
 * Medication Request Routes
 * User-facing medication requests routed to pharmacies in the platform network.
 */
import { Router, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { body, param } from "express-validator";
import { pool } from "../config/database.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { handleValidationErrors } from "../middleware/validation.js";
import { AuthRequest } from "../types/index.js";

const router = Router();

// GET /api/medication — list all requests (admin) or own requests (user)
router.get(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const isAdmin = ["ngo_admin", "system_admin", "pharmacy_staff"].includes(req.user!.role);
    const where  = isAdmin ? "1=1" : "mr.user_id = ?";
    const params = isAdmin ? []    : [req.user!.userId];

    const [rows] = await pool.query(
      `SELECT mr.*, sp.name AS pharmacy_name
       FROM medication_requests mr
       LEFT JOIN service_providers sp ON sp.id = mr.pharmacy_id
       WHERE ${where}
       ORDER BY mr.created_at DESC`,
      params
    );
    res.json({ success: true, data: rows });
  }
);

// POST /api/medication — submit a medication request
router.post(
  "/",
  authenticate,
  [
    body("medication_name").trim().notEmpty().isLength({ max: 255 }),
    body("urgency").optional().isIn(["low", "medium", "high", "critical"]),
    body("notes").optional().trim().isLength({ max: 1000 }),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { medication_name, urgency = "medium", notes } = req.body;
    const userId = req.user!.userId;
    const medReqId = uuidv4();

    // Find a pharmacy that has the medication
    const [pharmacies] = await pool.query<any[]>(
      `SELECT sp.id FROM service_providers sp
       JOIN medication_inventory mi ON mi.provider_id = sp.id AND mi.is_available = TRUE
       WHERE sp.type = 'pharmacy' AND sp.is_active = TRUE AND mi.medication_name LIKE ?
       LIMIT 1`,
      [`%${medication_name}%`]
    );
    const pharmacy = (pharmacies as any[])[0];

    // Create a service request for routing
    const reqId = uuidv4();
    const title = `Medication Request: ${medication_name}`;
    await pool.query(
      `INSERT INTO service_requests (id, user_id, type, title, description, urgency, status)
       VALUES (?, ?, 'medication', ?, ?, ?, 'pending')`,
      [reqId, userId, title, notes || null, urgency]
    );

    // Classification
    const priorityMap: Record<string, number> = { critical: 90, high: 75, medium: 55, low: 35 };
    await pool.query(
      `INSERT INTO request_classifications
         (id, request_id, category, priority_score, recommended_provider_type)
       VALUES (?, ?, 'medication_need', ?, 'pharmacy')`,
      [uuidv4(), reqId, priorityMap[urgency] ?? 55]
    );
    await pool.query(
      "UPDATE service_requests SET status = 'classified' WHERE id = ?",
      [reqId]
    );

    // Create the medication request record
    await pool.query(
      `INSERT INTO medication_requests
         (id, user_id, request_id, medication_name, urgency, notes, pharmacy_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [medReqId, userId, reqId, medication_name, urgency, notes || null, pharmacy?.id || null]
    );

    // Route if we found a matching pharmacy
    if (pharmacy) {
      await pool.query(
        "INSERT INTO request_assignments (id, request_id, provider_id, status) VALUES (?, ?, ?, 'pending')",
        [uuidv4(), reqId, pharmacy.id]
      );
      await pool.query(
        "UPDATE service_requests SET status = 'routed' WHERE id = ?",
        [reqId]
      );
    } else {
      // Route to any pharmacy if none has the med, or escalate to NGO
      const [anyPharmacy] = await pool.query<any[]>(
        "SELECT id FROM service_providers WHERE type = 'pharmacy' AND is_active = TRUE LIMIT 1"
      );
      const fallback = (anyPharmacy as any[])[0];
      if (fallback) {
        await pool.query(
          "INSERT INTO request_assignments (id, request_id, provider_id, status) VALUES (?, ?, ?, 'pending')",
          [uuidv4(), reqId, fallback.id]
        );
        await pool.query(
          "UPDATE service_requests SET status = 'routed' WHERE id = ?",
          [reqId]
        );
      }
    }

    const [newReq] = await pool.query<any[]>(
      "SELECT * FROM medication_requests WHERE id = ?",
      [medReqId]
    );
    res.status(201).json({ success: true, data: (newReq as any[])[0] });
  }
);

// PATCH /api/medication/:id/status — update status (pharmacy staff / admin)
router.patch(
  "/:id/status",
  authenticate,
  requireRole("pharmacy_staff", "ngo_admin", "system_admin"),
  [
    param("id").isUUID(),
    body("status").isIn(["approved", "fulfilled", "cancelled"]),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { status } = req.body;
    await pool.query(
      "UPDATE medication_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, req.params.id]
    );
    res.json({ success: true, message: `Medication request ${status}` });
  }
);

export default router;
