import { Router, Request, Response } from 'express';
import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';
import { performTriage } from '../services/triage.js';
import { routeRequest } from '../services/routing.js';

const router = Router();

// 1. User Request Entry Layer - Submit a new request
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, request_type, description, urgency_level, attachments } = req.body;

    if (!user_id || !request_type) {
      return res.status(400).json({ error: 'user_id and request_type are required' });
    }

    const id = uuidv4();
    await pool.execute(
      `INSERT INTO service_requests (id, user_id, request_type, description, urgency_level, attachments)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, user_id, request_type, description || null, urgency_level || 'medium', attachments ? JSON.stringify(attachments) : null]
    );

    // 2. Automatic AI Triage
    const triageResult = await performTriage(id, request_type, description || '', urgency_level || 'medium');

    // 3. Automatic Service Routing
    const routeResult = await routeRequest(id, triageResult.required_responder_type);

    const [request] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM service_requests WHERE id = ?',
      [id]
    );

    res.status(201).json({
      request: request[0],
      triage: triageResult,
      routing: routeResult,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all requests for a user
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT sr.*, rt.category as triage_category, rt.priority_level as triage_priority,
              rt.required_responder_type
       FROM service_requests sr
       LEFT JOIN request_triage rt ON rt.request_id = sr.id
       WHERE sr.user_id = ?
       ORDER BY sr.created_at DESC`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single request with full details
router.get('/:requestId', async (req: Request, res: Response) => {
  try {
    const [request] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM service_requests WHERE id = ?',
      [req.params.requestId]
    );

    if (request.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const [triage] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM request_triage WHERE request_id = ?',
      [req.params.requestId]
    );

    const [routing] = await pool.execute<RowDataPacket[]>(
      `SELECT rr.*, sp.name as provider_name, sp.provider_type
       FROM request_routing rr
       LEFT JOIN service_providers sp ON sp.id = rr.provider_id
       WHERE rr.request_id = ?`,
      [req.params.requestId]
    );

    res.json({
      request: request[0],
      triage: triage[0] || null,
      routing: routing[0] || null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update request status
router.patch('/:requestId/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const updateFields: string[] = ['status = ?'];
    const values: any[] = [status];

    if (status === 'resolved') {
      updateFields.push('resolved_at = NOW()');
    }

    values.push(req.params.requestId);
    await pool.execute(
      `UPDATE service_requests SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all requests (admin)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, request_type, limit = '50' } = req.query;
    let query = `SELECT sr.*, rt.category as triage_category, rt.priority_level as triage_priority
                 FROM service_requests sr
                 LEFT JOIN request_triage rt ON rt.request_id = sr.id`;
    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      conditions.push('sr.status = ?');
      params.push(status);
    }
    if (request_type) {
      conditions.push('sr.request_type = ?');
      params.push(request_type);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY sr.created_at DESC LIMIT ?';
    params.push(parseInt(limit as string));

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
