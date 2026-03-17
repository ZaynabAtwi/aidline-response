/**
 * Volunteer Routes — no geolocation, skill-based matching only.
 */
import { Router, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { body, param } from "express-validator";
import { pool } from "../config/database.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { handleValidationErrors } from "../middleware/validation.js";
import { AuthRequest } from "../types/index.js";

const router = Router();

// GET /api/volunteers
router.get(
  "/",
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const [rows] = await pool.query(
      `SELECT v.id, v.user_id, v.skills, v.bio, v.status, v.rating, v.created_at,
              u.full_name
       FROM volunteers v
       LEFT JOIN users u ON u.id = v.user_id
       ORDER BY v.rating DESC NULLS LAST, v.created_at DESC`
    );
    res.json({ success: true, data: rows });
  }
);

// POST /api/volunteers — register as a volunteer
router.post(
  "/",
  authenticate,
  [
    body("skills").isArray({ min: 1 }),
    body("skills.*").trim().notEmpty(),
    body("bio").optional().trim().isLength({ max: 500 }),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { skills, bio } = req.body;
    const userId = req.user!.userId;

    const [existing] = await pool.query<any[]>(
      "SELECT id FROM volunteers WHERE user_id = ?",
      [userId]
    );
    if ((existing as any[]).length > 0) {
      res.status(409).json({ success: false, error: "Already registered as volunteer" });
      return;
    }

    const id = uuidv4();
    await pool.query(
      "INSERT INTO volunteers (id, user_id, skills, bio, status) VALUES (?, ?, ?, ?, 'available')",
      [id, userId, JSON.stringify(skills), bio || null]
    );

    const [newVol] = await pool.query<any[]>("SELECT * FROM volunteers WHERE id = ?", [id]);
    res.status(201).json({ success: true, data: (newVol as any[])[0] });
  }
);

// PATCH /api/volunteers/:id/status
router.patch(
  "/:id/status",
  authenticate,
  requireRole("ngo_admin", "system_admin"),
  [
    param("id").isUUID(),
    body("status").isIn(["available", "assigned", "unavailable"]),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { status } = req.body;
    await pool.query(
      "UPDATE volunteers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, req.params.id]
    );
    res.json({ success: true, message: `Volunteer status updated to ${status}` });
  }
);

export default router;
