import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { body } from "express-validator";
import { pool } from "../config/database.js";
import { handleValidationErrors } from "../middleware/validation.js";
import { authenticate } from "../middleware/auth.js";
import { AuthRequest, UserRow } from "../types/index.js";

const router = Router();
const JWT_SECRET  = process.env.JWT_SECRET  || "change_me_in_production";
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || "7d";

function signToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES } as jwt.SignOptions);
}

// POST /api/auth/register
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("full_name").trim().notEmpty(),
    body("preferred_language").optional().isIn(["ar", "en"]),
  ],
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    const { email, password, full_name, preferred_language = "en", phone } = req.body;

    const [existing] = await pool.query<any[]>(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if ((existing as any[]).length > 0) {
      res.status(409).json({ success: false, error: "Email already registered" });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);
    const id = uuidv4();

    await pool.query(
      `INSERT INTO users (id, email, phone, full_name, password_hash, preferred_language, role)
       VALUES (?, ?, ?, ?, ?, ?, 'displaced_user')`,
      [id, email, phone || null, full_name, password_hash, preferred_language]
    );

    const token = signToken(id, "displaced_user");
    res.status(201).json({
      success: true,
      data: { token, user: { id, email, full_name, role: "displaced_user" } },
    });
  }
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const [rows] = await pool.query<any[]>(
      "SELECT id, email, full_name, password_hash, role, is_active FROM users WHERE email = ?",
      [email]
    );
    const user = (rows as UserRow[])[0];

    if (!user || !user.password_hash) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }
    if (!user.is_active) {
      res.status(403).json({ success: false, error: "Account disabled" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    const token = signToken(user.id, user.role);
    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      },
    });
  }
);

// POST /api/auth/anonymous — creates a temporary anonymous user
router.post("/anonymous", async (_req: Request, res: Response): Promise<void> => {
  const id = uuidv4();
  await pool.query(
    `INSERT INTO users (id, role, is_anonymous) VALUES (?, 'displaced_user', TRUE)`,
    [id]
  );
  const token = signToken(id, "displaced_user");
  res.status(201).json({ success: true, data: { token, user: { id, is_anonymous: true } } });
});

// GET /api/auth/me
router.get("/me", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const [rows] = await pool.query<any[]>(
    "SELECT id, email, phone, full_name, preferred_language, role, is_anonymous, created_at FROM users WHERE id = ?",
    [req.user!.userId]
  );
  const user = (rows as any[])[0];
  if (!user) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }
  res.json({ success: true, data: user });
});

// PATCH /api/auth/me
router.patch(
  "/me",
  authenticate,
  [
    body("full_name").optional().trim().notEmpty(),
    body("phone").optional().trim(),
    body("preferred_language").optional().isIn(["ar", "en"]),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { full_name, phone, preferred_language } = req.body;
    await pool.query(
      `UPDATE users SET
         full_name          = COALESCE(?, full_name),
         phone              = COALESCE(?, phone),
         preferred_language = COALESCE(?, preferred_language),
         updated_at         = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [full_name || null, phone || null, preferred_language || null, req.user!.userId]
    );
    res.json({ success: true, message: "Profile updated" });
  }
);

export default router;
