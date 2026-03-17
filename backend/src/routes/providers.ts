/**
 * Service Provider Routes
 * Manages healthcare providers, pharmacies, and NGOs registered on the platform.
 */
import { Router, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { body, param, query } from "express-validator";
import { pool } from "../config/database.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { handleValidationErrors } from "../middleware/validation.js";
import { AuthRequest } from "../types/index.js";

const router = Router();

// GET /api/providers — list all active providers
router.get(
  "/",
  [
    query("type").optional().isIn(["healthcare", "pharmacy", "ngo", "government"]),
    query("page").optional().isInt({ min: 1 }),
    query("pageSize").optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { type, page = 1, pageSize = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    let where = "is_active = TRUE";
    const params: any[] = [];
    if (type) { where += " AND type = ?"; params.push(type); }

    const [rows] = await pool.query(
      `SELECT id, name, type, contact_email, contact_phone, description, services, operating_hours, is_active
       FROM service_providers
       WHERE ${where}
       ORDER BY name ASC
       LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );

    const [[{ total }]] = await pool.query<any[]>(
      `SELECT COUNT(*) AS total FROM service_providers WHERE ${where}`,
      params
    ) as any;

    res.json({ success: true, data: { items: rows, total, page: Number(page), pageSize: Number(pageSize) } });
  }
);

// GET /api/providers/:id
router.get(
  "/:id",
  [param("id").isUUID()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const [rows] = await pool.query<any[]>(
      `SELECT id, name, type, contact_email, contact_phone, description, services, operating_hours, is_active, created_at
       FROM service_providers WHERE id = ?`,
      [req.params.id]
    );
    const provider = (rows as any[])[0];
    if (!provider) {
      res.status(404).json({ success: false, error: "Provider not found" });
      return;
    }
    res.json({ success: true, data: provider });
  }
);

// POST /api/providers — register a new provider (admin only)
router.post(
  "/",
  authenticate,
  requireRole("system_admin"),
  [
    body("name").trim().notEmpty(),
    body("type").isIn(["healthcare", "pharmacy", "ngo", "government"]),
    body("contact_email").optional().isEmail().normalizeEmail(),
    body("contact_phone").optional().trim(),
    body("description").optional().trim(),
    body("services").optional().isArray(),
    body("operating_hours").optional().trim(),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, type, contact_email, contact_phone, description, services, operating_hours } = req.body;
    const id = uuidv4();

    await pool.query(
      `INSERT INTO service_providers (id, name, type, contact_email, contact_phone, description, services, operating_hours)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, name, type,
        contact_email   || null,
        contact_phone   || null,
        description     || null,
        services        ? JSON.stringify(services) : null,
        operating_hours || null,
      ]
    );

    const [newProvider] = await pool.query<any[]>("SELECT * FROM service_providers WHERE id = ?", [id]);
    res.status(201).json({ success: true, data: (newProvider as any[])[0] });
  }
);

// PATCH /api/providers/:id
router.patch(
  "/:id",
  authenticate,
  requireRole("system_admin", "ngo_admin"),
  [
    param("id").isUUID(),
    body("name").optional().trim().notEmpty(),
    body("contact_email").optional().isEmail().normalizeEmail(),
    body("contact_phone").optional().trim(),
    body("description").optional().trim(),
    body("services").optional().isArray(),
    body("operating_hours").optional().trim(),
    body("is_active").optional().isBoolean(),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, contact_email, contact_phone, description, services, operating_hours, is_active } = req.body;

    await pool.query(
      `UPDATE service_providers SET
         name            = COALESCE(?, name),
         contact_email   = COALESCE(?, contact_email),
         contact_phone   = COALESCE(?, contact_phone),
         description     = COALESCE(?, description),
         services        = COALESCE(?, services),
         operating_hours = COALESCE(?, operating_hours),
         is_active       = COALESCE(?, is_active),
         updated_at      = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name            || null,
        contact_email   || null,
        contact_phone   || null,
        description     || null,
        services        ? JSON.stringify(services) : null,
        operating_hours || null,
        is_active       !== undefined ? is_active : null,
        req.params.id,
      ]
    );

    res.json({ success: true, message: "Provider updated" });
  }
);

// GET /api/providers/:id/inventory — medication inventory for a pharmacy
router.get(
  "/:id/inventory",
  [param("id").isUUID()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const [rows] = await pool.query(
      "SELECT * FROM medication_inventory WHERE provider_id = ? ORDER BY medication_name",
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  }
);

// PUT /api/providers/:id/inventory — update inventory (pharmacy staff)
router.put(
  "/:id/inventory",
  authenticate,
  requireRole("pharmacy_staff", "system_admin"),
  [
    param("id").isUUID(),
    body("medications").isArray(),
    body("medications.*.medication_name").trim().notEmpty(),
    body("medications.*.is_available").isBoolean(),
    body("medications.*.quantity").optional().isInt({ min: 0 }),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { medications } = req.body;
    const providerId = req.params.id;

    for (const med of medications as any[]) {
      await pool.query(
        `INSERT INTO medication_inventory (id, provider_id, medication_name, is_available, quantity, notes)
         VALUES (UUID(), ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           is_available = VALUES(is_available),
           quantity     = VALUES(quantity),
           notes        = VALUES(notes),
           updated_at   = CURRENT_TIMESTAMP`,
        [
          providerId,
          med.medication_name,
          med.is_available,
          med.quantity ?? 0,
          med.notes || null,
        ]
      );
    }

    res.json({ success: true, message: "Inventory updated" });
  }
);

// GET /api/providers/medications/search?name=... — check availability across pharmacies
router.get(
  "/medications/search",
  [query("name").trim().notEmpty()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const [rows] = await pool.query(
      `SELECT
         mi.medication_name,
         mi.is_available,
         mi.quantity,
         mi.notes,
         sp.id   AS provider_id,
         sp.name AS provider_name,
         sp.contact_phone,
         sp.operating_hours
       FROM medication_inventory mi
       JOIN service_providers sp ON sp.id = mi.provider_id AND sp.is_active = TRUE
       WHERE mi.medication_name LIKE ?
       ORDER BY mi.is_available DESC, sp.name ASC`,
      [`%${req.query.name}%`]
    );
    res.json({ success: true, data: rows });
  }
);

export default router;
