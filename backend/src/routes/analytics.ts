/**
 * Crisis Analytics & Institutional Dashboard Routes
 * Aggregated anonymous data — no individual user information exposed.
 */
import { Router, Response } from "express";
import { query } from "express-validator";
import { pool } from "../config/database.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { handleValidationErrors } from "../middleware/validation.js";
import { AuthRequest } from "../types/index.js";

const router = Router();

// GET /api/analytics/summary — overall platform statistics
router.get(
  "/summary",
  authenticate,
  requireRole("ngo_admin", "system_admin"),
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const [[totals]] = await pool.query<any[]>(
      `SELECT
         COUNT(*)                               AS total_requests,
         SUM(status = 'resolved')               AS resolved_requests,
         SUM(status = 'pending')                AS pending_requests,
         SUM(status IN ('routed','accepted','in_progress')) AS active_requests,
         SUM(urgency = 'critical')              AS critical_requests,
         SUM(type = 'sos')                      AS sos_count,
         SUM(type = 'medical')                  AS medical_count,
         SUM(type = 'medication')               AS medication_count,
         SUM(type = 'humanitarian')             AS humanitarian_count
       FROM service_requests`
    ) as any;

    const [[providerCounts]] = await pool.query<any[]>(
      `SELECT
         COUNT(*)                          AS total_providers,
         SUM(is_active = 1)                AS active_providers,
         SUM(type = 'healthcare')          AS healthcare_count,
         SUM(type = 'pharmacy')            AS pharmacy_count,
         SUM(type = 'ngo')                 AS ngo_count
       FROM service_providers`
    ) as any;

    const [[volunteerCounts]] = await pool.query<any[]>(
      `SELECT
         COUNT(*)                       AS total_volunteers,
         SUM(status = 'available')      AS available_volunteers,
         SUM(status = 'assigned')       AS assigned_volunteers
       FROM volunteers`
    ) as any;

    res.json({
      success: true,
      data: { requests: totals, providers: providerCounts, volunteers: volunteerCounts },
    });
  }
);

// GET /api/analytics/trends?days=30 — daily request trends
router.get(
  "/trends",
  authenticate,
  requireRole("ngo_admin", "system_admin"),
  [query("days").optional().isInt({ min: 1, max: 365 })],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const days = parseInt(req.query.days as string || "30", 10);

    const [rows] = await pool.query(
      `SELECT
         DATE(created_at)               AS day,
         type                           AS request_type,
         COUNT(*)                       AS total,
         SUM(status = 'resolved')       AS resolved,
         SUM(urgency = 'critical')      AS critical_count
       FROM service_requests
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at), type
       ORDER BY day ASC`,
      [days]
    );
    res.json({ success: true, data: rows });
  }
);

// GET /api/analytics/medication-shortages — medication demand intelligence
router.get(
  "/medication-shortages",
  authenticate,
  requireRole("ngo_admin", "system_admin", "pharmacy_staff"),
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const [rows] = await pool.query(
      `SELECT
         mr.medication_name,
         COUNT(*)                           AS total_requests,
         SUM(mr.status = 'pending')         AS pending_requests,
         SUM(mr.urgency = 'critical')       AS critical_requests,
         SUM(mr.urgency = 'high')           AS high_urgency_requests,
         MAX(mr.created_at)                 AS last_request_at,
         IFNULL(
           SUM(mi.is_available = 1), 0
         )                                  AS pharmacies_with_stock
       FROM medication_requests mr
       LEFT JOIN medication_inventory mi ON mi.medication_name LIKE CONCAT('%', mr.medication_name, '%')
       WHERE mr.status IN ('pending', 'approved')
       GROUP BY mr.medication_name
       ORDER BY pending_requests DESC, critical_requests DESC`
    );
    res.json({ success: true, data: rows });
  }
);

// GET /api/analytics/provider-workload
router.get(
  "/provider-workload",
  authenticate,
  requireRole("ngo_admin", "system_admin"),
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const [rows] = await pool.query(
      `SELECT
         sp.id,
         sp.name,
         sp.type,
         COUNT(ra.id)                               AS total_assignments,
         SUM(ra.status = 'accepted')                AS active_cases,
         SUM(ra.status = 'completed')               AS completed_cases,
         SUM(ra.status = 'pending')                 AS pending_cases,
         AVG(TIMESTAMPDIFF(MINUTE, ra.assigned_at, ra.accepted_at)) AS avg_accept_minutes
       FROM service_providers sp
       LEFT JOIN request_assignments ra ON ra.provider_id = sp.id
       GROUP BY sp.id, sp.name, sp.type
       ORDER BY active_cases DESC`
    );
    res.json({ success: true, data: rows });
  }
);

// GET /api/analytics/sos-stats
router.get(
  "/sos-stats",
  authenticate,
  requireRole("ngo_admin", "system_admin"),
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const [rows] = await pool.query(
      `SELECT
         status,
         COUNT(*)                  AS count,
         AVG(TIMESTAMPDIFF(MINUTE, created_at, COALESCE(resolved_at, NOW()))) AS avg_minutes
       FROM sos_alerts
       GROUP BY status`
    );
    res.json({ success: true, data: rows });
  }
);

export default router;
