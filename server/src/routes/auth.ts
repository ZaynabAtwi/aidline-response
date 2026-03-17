import { Router, Request, Response } from 'express';
import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';

const router = Router();

// Anonymous sign-in: creates or retrieves a user
router.post('/anonymous', async (req: Request, res: Response) => {
  try {
    const { existingId } = req.body;

    if (existingId) {
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM users WHERE id = ?',
        [existingId]
      );
      if (rows.length > 0) {
        return res.json({ user: rows[0] });
      }
    }

    const id = uuidv4();
    await pool.execute(
      'INSERT INTO users (id) VALUES (?)',
      [id]
    );

    const [newUser] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    res.json({ user: newUser[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [req.params.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [roles] = await pool.execute<RowDataPacket[]>(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [req.params.userId]
    );

    res.json({ user: rows[0], roles: roles.map((r: any) => r.role) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Check role
router.get('/role/:userId/:role', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM user_roles WHERE user_id = ? AND role = ?',
      [req.params.userId, req.params.role]
    );
    res.json({ hasRole: rows.length > 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Save onboarding
router.post('/onboarding', async (req: Request, res: Response) => {
  try {
    const { user_id, needs_shelter, needs_medication, is_volunteering, district, urgency } = req.body;

    const id = uuidv4();
    await pool.execute(
      `INSERT INTO onboarding_responses (id, user_id, needs_shelter, needs_medication, is_volunteering, district, urgency)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE needs_shelter = VALUES(needs_shelter), needs_medication = VALUES(needs_medication),
       is_volunteering = VALUES(is_volunteering), district = VALUES(district), urgency = VALUES(urgency)`,
      [id, user_id, needs_shelter, needs_medication, is_volunteering, district, urgency]
    );

    const role = is_volunteering ? 'volunteer' : 'displaced_user';
    const roleId = uuidv4();
    await pool.execute(
      `INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE role = VALUES(role)`,
      [roleId, user_id, role]
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
