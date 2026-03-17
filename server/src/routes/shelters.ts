import { Router, Request, Response } from 'express';
import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';

const router = Router();

// Get all shelters
router.get('/', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM shelters ORDER BY name'
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get shelter by id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM shelters WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Shelter not found' });
    }
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update shelter
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { capacity, available_spots, is_operational } = req.body;
    await pool.execute(
      `UPDATE shelters SET capacity = ?, available_spots = ?, is_operational = ? WHERE id = ?`,
      [capacity, available_spots, is_operational, req.params.id]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create shelter
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, address, phone, capacity, available_spots, amenities, is_operational, ngo, created_by } = req.body;
    const id = uuidv4();
    await pool.execute(
      `INSERT INTO shelters (id, name, address, phone, capacity, available_spots, amenities, is_operational, ngo, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, address || null, phone || null, capacity || 0, available_spots || 0,
       amenities ? JSON.stringify(amenities) : null, is_operational !== false, ngo || null, created_by || null]
    );
    const [shelter] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM shelters WHERE id = ?',
      [id]
    );
    res.status(201).json(shelter[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
