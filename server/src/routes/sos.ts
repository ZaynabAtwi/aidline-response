import { Router, Request, Response } from 'express';
import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';
import { performTriage } from '../services/triage.js';
import { routeRequest } from '../services/routing.js';

const router = Router();

// Send SOS alert (no location data)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, message } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Create a service request for the SOS
    const requestId = uuidv4();
    await pool.execute(
      `INSERT INTO service_requests (id, user_id, request_type, description, urgency_level, status)
       VALUES (?, ?, 'sos', ?, 'critical', 'submitted')`,
      [requestId, user_id, message || 'Emergency SOS Alert']
    );

    // Create SOS alert
    const sosId = uuidv4();
    await pool.execute(
      `INSERT INTO sos_alerts (id, user_id, request_id, message, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [sosId, user_id, requestId, message || null]
    );

    // Automatic triage and routing
    const triageResult = await performTriage(requestId, 'sos', message || 'Emergency SOS', 'critical');
    const routeResult = await routeRequest(requestId, triageResult.required_responder_type);

    const [alert] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sos_alerts WHERE id = ?',
      [sosId]
    );

    res.status(201).json({
      alert: alert[0],
      triage: triageResult,
      routing: routeResult,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all SOS alerts
router.get('/', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sos_alerts ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update SOS status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const fields: string[] = ['status = ?'];
    const params: any[] = [status];

    if (status === 'resolved') {
      fields.push('resolved_at = NOW()');
    }

    params.push(req.params.id);
    await pool.execute(
      `UPDATE sos_alerts SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
