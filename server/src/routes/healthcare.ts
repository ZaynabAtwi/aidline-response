import { Router, Request, Response } from 'express';
import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';

const router = Router();

// Get clinics (healthcare providers)
router.get('/clinics', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM service_providers WHERE provider_type = 'healthcare' ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create healthcare interaction
router.post('/interactions', async (req: Request, res: Response) => {
  try {
    const { request_id, provider_id, interaction_type, instructions, notes } = req.body;

    const id = uuidv4();
    await pool.execute(
      `INSERT INTO healthcare_interactions (id, request_id, provider_id, interaction_type, instructions, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, request_id, provider_id, interaction_type, instructions || null, notes || null]
    );

    const [interaction] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM healthcare_interactions WHERE id = ?',
      [id]
    );

    res.status(201).json(interaction[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get interactions for a request
router.get('/interactions/request/:requestId', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT hi.*, sp.name as provider_name
       FROM healthcare_interactions hi
       LEFT JOIN service_providers sp ON sp.id = hi.provider_id
       WHERE hi.request_id = ?
       ORDER BY hi.created_at DESC`,
      [req.params.requestId]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update interaction status
router.patch('/interactions/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, instructions } = req.body;
    const fields: string[] = ['status = ?'];
    const params: any[] = [status];

    if (instructions !== undefined) {
      fields.push('instructions = ?');
      params.push(instructions);
    }

    params.push(req.params.id);
    await pool.execute(
      `UPDATE healthcare_interactions SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Request additional patient info
router.patch('/interactions/:id/request-info', async (req: Request, res: Response) => {
  try {
    await pool.execute(
      `UPDATE healthcare_interactions SET patient_info_requested = TRUE WHERE id = ?`,
      [req.params.id]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
