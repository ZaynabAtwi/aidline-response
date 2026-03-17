import { Router, Request, Response } from 'express';
import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';

const router = Router();

// Get all volunteers
router.get('/', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM volunteers ORDER BY rating DESC, created_at DESC'
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Register as volunteer (no location)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, skills, bio } = req.body;

    if (!user_id || !skills || skills.length === 0) {
      return res.status(400).json({ error: 'user_id and skills are required' });
    }

    const id = uuidv4();
    await pool.execute(
      `INSERT INTO volunteers (id, user_id, skills, bio, status)
       VALUES (?, ?, ?, ?, 'available')`,
      [id, user_id, JSON.stringify(skills), bio || null]
    );

    const [vol] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM volunteers WHERE id = ?',
      [id]
    );

    res.status(201).json(vol[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update volunteer status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    await pool.execute(
      'UPDATE volunteers SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
