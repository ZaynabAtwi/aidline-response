import { Router, Request, Response } from 'express';
import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';

const router = Router();

// Get pharmacies
router.get('/pharmacies', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM service_providers WHERE provider_type = 'pharmacy' ORDER BY name`
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update pharmacy medications
router.patch('/pharmacies/:id/medications', async (req: Request, res: Response) => {
  try {
    const { available_medications } = req.body;
    await pool.execute(
      `UPDATE service_providers SET available_medications = ? WHERE id = ?`,
      [JSON.stringify(available_medications), req.params.id]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Submit medication request
router.post('/requests', async (req: Request, res: Response) => {
  try {
    const { user_id, medication_name, urgency, notes, request_id } = req.body;

    if (!user_id || !medication_name) {
      return res.status(400).json({ error: 'user_id and medication_name are required' });
    }

    const id = uuidv4();
    await pool.execute(
      `INSERT INTO medication_requests (id, user_id, medication_name, urgency, notes, request_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, user_id, medication_name, urgency || 'medium', notes || null, request_id || null]
    );

    const [medReq] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM medication_requests WHERE id = ?',
      [id]
    );

    res.status(201).json(medReq[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get medication requests for a user
router.get('/requests/user/:userId', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT mr.*, sp.name as pharmacy_name
       FROM medication_requests mr
       LEFT JOIN service_providers sp ON sp.id = mr.pharmacy_id
       WHERE mr.user_id = ?
       ORDER BY mr.created_at DESC`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all medication requests (admin)
router.get('/requests', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT mr.*, sp.name as pharmacy_name
       FROM medication_requests mr
       LEFT JOIN service_providers sp ON sp.id = mr.pharmacy_id
       ORDER BY mr.created_at DESC`
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update medication request status (pharmacy workflow)
router.patch('/requests/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, alternative_medication, pickup_instructions, pharmacy_id } = req.body;
    const fields: string[] = ['status = ?'];
    const params: any[] = [status];

    if (alternative_medication) {
      fields.push('alternative_medication = ?');
      params.push(alternative_medication);
    }
    if (pickup_instructions) {
      fields.push('pickup_instructions = ?');
      params.push(pickup_instructions);
    }
    if (pharmacy_id) {
      fields.push('pharmacy_id = ?');
      params.push(pharmacy_id);
    }

    // If escalated, the request may be forwarded to NGOs
    if (status === 'escalated') {
      fields.push('notes = CONCAT(COALESCE(notes, \'\'), \' [Escalated to NGO/medical aid]\')');
    }

    params.push(req.params.id);
    await pool.execute(
      `UPDATE medication_requests SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
