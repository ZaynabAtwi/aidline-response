/**
 * NGO Portal Routes
 * Token-based API access for NGO organizations (mirrors the Supabase Edge Function).
 */
import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { body } from "express-validator";
import { pool } from "../config/database.js";
import { handleValidationErrors } from "../middleware/validation.js";
import { NgoAccessTokenRow } from "../types/index.js";

const router = Router();

async function validateToken(token: string): Promise<{ valid: boolean; tokenId?: string; providerId?: string }> {
  const [rows] = await pool.query<any[]>(
    `SELECT id, provider_id FROM ngo_access_tokens
     WHERE token = ? AND is_active = TRUE AND expires_at > NOW()`,
    [token]
  );
  const row = (rows as NgoAccessTokenRow[])[0];
  if (!row) return { valid: false };

  await pool.query(
    "UPDATE ngo_access_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?",
    [row.id]
  );
  return { valid: true, tokenId: row.id, providerId: (row as any).provider_id };
}

// POST /api/ngo/action — authenticated NGO action endpoint
router.post(
  "/action",
  [
    body("token").trim().notEmpty(),
    body("action").trim().notEmpty(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    const { token, action, payload = {} } = req.body;

    const { valid, tokenId, providerId } = await validateToken(token);
    if (!valid) {
      res.status(401).json({ success: false, error: "Invalid or expired NGO token" });
      return;
    }

    switch (action) {
      case "get_requests": {
        const [rows] = await pool.query(
          `SELECT sr.*, rc.category, rc.priority_score
           FROM service_requests sr
           LEFT JOIN request_classifications rc ON rc.request_id = sr.id
           LEFT JOIN request_assignments ra ON ra.request_id = sr.id AND ra.provider_id = ?
           ORDER BY sr.created_at DESC
           LIMIT 100`,
          [providerId]
        );
        res.json({ success: true, data: rows });
        return;
      }

      case "get_medication_requests": {
        const [rows] = await pool.query(
          "SELECT * FROM medication_requests ORDER BY created_at DESC LIMIT 100"
        );
        res.json({ success: true, data: rows });
        return;
      }

      case "get_sos_alerts": {
        const [rows] = await pool.query(
          "SELECT * FROM sos_alerts ORDER BY created_at DESC LIMIT 100"
        );
        res.json({ success: true, data: rows });
        return;
      }

      case "update_med_status": {
        const { request_id, status } = payload;
        if (!request_id || !["approved", "fulfilled", "cancelled"].includes(status)) {
          res.status(400).json({ success: false, error: "Invalid payload" });
          return;
        }
        await pool.query(
          "UPDATE medication_requests SET status = ? WHERE id = ?",
          [status, request_id]
        );
        res.json({ success: true, message: "Status updated" });
        return;
      }

      case "update_sos_status": {
        const { alert_id, status } = payload;
        if (!alert_id || !["active", "responding", "resolved", "cancelled"].includes(status)) {
          res.status(400).json({ success: false, error: "Invalid payload" });
          return;
        }
        const updates: any = { status };
        if (status === "resolved") updates.resolved_at = new Date();
        const setClauses = Object.keys(updates).map((k) => `${k} = ?`).join(", ");
        await pool.query(
          `UPDATE sos_alerts SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [...Object.values(updates), alert_id]
        );
        res.json({ success: true, message: "SOS status updated" });
        return;
      }

      case "get_notes": {
        const { request_id } = payload;
        const where = request_id ? "request_id = ?" : "1=1";
        const params = request_id ? [request_id] : [];
        const [rows] = await pool.query(
          `SELECT cn.*, nat.token AS author_token
           FROM coordination_notes cn
           JOIN ngo_access_tokens nat ON nat.id = cn.token_id
           WHERE ${where}
           ORDER BY cn.created_at DESC`,
          params
        );
        res.json({ success: true, data: rows });
        return;
      }

      case "add_note": {
        const { request_id, content } = payload;
        if (!content) {
          res.status(400).json({ success: false, error: "Content is required" });
          return;
        }
        const id = uuidv4();
        await pool.query(
          "INSERT INTO coordination_notes (id, request_id, token_id, content) VALUES (?, ?, ?, ?)",
          [id, request_id || null, tokenId, content]
        );
        res.status(201).json({ success: true, message: "Note added" });
        return;
      }

      case "get_analytics": {
        const [[summary]] = await pool.query<any[]>(
          `SELECT
             SUM(type = 'sos')          AS sos_total,
             SUM(type = 'medication')   AS medication_total,
             SUM(type = 'medical')      AS medical_total,
             SUM(type = 'humanitarian') AS humanitarian_total,
             SUM(status = 'resolved')   AS resolved_total,
             SUM(urgency = 'critical')  AS critical_total
           FROM service_requests`
        ) as any;
        res.json({ success: true, data: summary });
        return;
      }

      default:
        res.status(400).json({ success: false, error: `Unknown action: ${action}` });
    }
  }
);

export default router;
