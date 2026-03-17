import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import type { RowDataPacket } from 'mysql2';

const router = Router();

router.post('/anonymous', async (_req: Request, res: Response) => {
  try {
    const userId = uuidv4();
    const profileId = uuidv4();

    await pool.query(
      'INSERT INTO users (id, is_anonymous) VALUES (?, TRUE)',
      [userId]
    );

    await pool.query(
      'INSERT INTO profiles (id, user_id) VALUES (?, ?)',
      [profileId, userId]
    );

    await pool.query(
      'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
      [uuidv4(), userId, 'displaced_user']
    );

    res.json({ user: { id: userId, is_anonymous: true } });
  } catch (error) {
    console.error('Anonymous auth error:', error);
    res.status(500).json({ error: 'Failed to create anonymous user' });
  }
});

router.get('/me', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT id, is_anonymous, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!users[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const [profiles] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM profiles WHERE user_id = ?',
      [userId]
    );

    const [roles] = await pool.query<RowDataPacket[]>(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [userId]
    );

    res.json({
      user: users[0],
      profile: profiles[0] || null,
      roles: (roles as RowDataPacket[]).map(r => r.role),
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

router.post('/validate-ngo-token', async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ error: 'Token required' });
    return;
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT t.id, t.ngo_id, t.label, n.name as ngo_name
       FROM ngo_access_tokens t
       LEFT JOIN ngos n ON t.ngo_id = n.id
       WHERE t.token = ? AND t.is_active = TRUE
       AND (t.expires_at IS NULL OR t.expires_at > NOW())`,
      [token]
    );

    if (!rows[0]) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    await pool.query(
      'UPDATE ngo_access_tokens SET last_used_at = NOW() WHERE id = ?',
      [rows[0].id]
    );

    res.json({ valid: true, tokenId: rows[0].id, ngoName: rows[0].ngo_name });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

export default router;
