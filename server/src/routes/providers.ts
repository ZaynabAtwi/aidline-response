import { Router, Request, Response } from 'express';
import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';

const router = Router();

// Get all service providers
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM service_providers';
    const params: any[] = [];

    if (type) {
      query += ' WHERE provider_type = ?';
      params.push(type);
    }

    query += ' ORDER BY name';
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single provider
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM service_providers WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create provider
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name, provider_type, description, address, phone, email,
      services, operating_hours, is_operational, capacity,
      available_spots, available_medications, ngo_name, created_by
    } = req.body;

    const id = uuidv4();
    await pool.execute(
      `INSERT INTO service_providers (id, name, provider_type, description, address, phone, email,
       services, operating_hours, is_operational, capacity, available_spots, available_medications, ngo_name, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, provider_type, description || null, address || null, phone || null, email || null,
       services ? JSON.stringify(services) : null, operating_hours || null,
       is_operational !== false, capacity || null, available_spots || null,
       available_medications ? JSON.stringify(available_medications) : null, ngo_name || null, created_by || null]
    );

    const [provider] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM service_providers WHERE id = ?',
      [id]
    );

    res.status(201).json(provider[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update provider
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const fields: string[] = [];
    const params: any[] = [];

    const allowedFields = [
      'name', 'description', 'address', 'phone', 'email',
      'operating_hours', 'is_operational', 'capacity', 'available_spots', 'ngo_name'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    }

    if (req.body.services !== undefined) {
      fields.push('services = ?');
      params.push(JSON.stringify(req.body.services));
    }
    if (req.body.available_medications !== undefined) {
      fields.push('available_medications = ?');
      params.push(JSON.stringify(req.body.available_medications));
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(req.params.id);
    await pool.execute(
      `UPDATE service_providers SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
