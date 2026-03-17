import { Request, Response, NextFunction } from 'express';
import pool from '../config/database.js';
import type { RowDataPacket } from 'mysql2';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (!rows[0]) {
      res.status(401).json({ error: 'Invalid user' });
      return;
    }

    req.userId = userId;
    next();
  } catch {
    res.status(500).json({ error: 'Authentication error' });
  }
}

export async function authenticateNgoToken(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['x-ngo-token'] as string;

  if (!token) {
    res.status(401).json({ error: 'NGO token required' });
    return;
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, ngo_id FROM ngo_access_tokens
       WHERE token = ? AND is_active = TRUE
       AND (expires_at IS NULL OR expires_at > NOW())`,
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

    req.userId = rows[0].ngo_id;
    next();
  } catch {
    res.status(500).json({ error: 'Token validation error' });
  }
}
