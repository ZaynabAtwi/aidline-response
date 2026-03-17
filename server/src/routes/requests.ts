import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import { authenticateUser } from '../middleware/auth.js';
import { classifyAndStoreRequest } from '../services/triageEngine.js';
import { routeRequest } from '../services/routingEngine.js';
import type { RowDataPacket } from 'mysql2';

const router = Router();

router.post('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { request_type, title, description, urgency_level, attachments } = req.body;

    if (!request_type || !title) {
      res.status(400).json({ error: 'request_type and title are required' });
      return;
    }

    const requestId = uuidv4();

    await pool.query(
      `INSERT INTO service_requests
       (id, user_id, request_type, title, description, urgency_level, attachments, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted')`,
      [
        requestId,
        req.userId,
        request_type,
        title,
        description || null,
        urgency_level || 'medium',
        attachments ? JSON.stringify(attachments) : null,
      ]
    );

    await pool.query(
      'UPDATE service_requests SET status = ? WHERE id = ?',
      ['classifying', requestId]
    );
    const { classificationId, result: classification } = await classifyAndStoreRequest(requestId);

    await pool.query(
      'UPDATE service_requests SET status = ? WHERE id = ?',
      ['routing', requestId]
    );
    const routes = await routeRequest(requestId, classificationId);

    const [requestRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM service_requests WHERE id = ?',
      [requestId]
    );

    res.status(201).json({
      request: requestRows[0],
      classification,
      routes,
      pipeline: {
        step: 'routed',
        message: `Request classified as ${classification.category} and routed to ${routes.length} provider(s)`,
      },
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

router.get('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { status, type, limit = '50', offset = '0' } = req.query;

    let query = 'SELECT * FROM service_requests WHERE user_id = ?';
    const params: any[] = [req.userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      query += ' AND request_type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    res.json({ requests: rows });
  } catch (error) {
    console.error('List requests error:', error);
    res.status(500).json({ error: 'Failed to list requests' });
  }
});

router.get('/all', async (req: Request, res: Response) => {
  try {
    const { status, type, limit = '50', offset = '0' } = req.query;

    let query = 'SELECT * FROM service_requests WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      query += ' AND request_type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    res.json({ requests: rows });
  } catch (error) {
    console.error('List all requests error:', error);
    res.status(500).json({ error: 'Failed to list requests' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const [requests] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM service_requests WHERE id = ?',
      [req.params.id]
    );

    if (!requests[0]) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    const [classifications] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM request_classifications WHERE request_id = ?',
      [req.params.id]
    );

    const [routes] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM service_routes WHERE request_id = ?',
      [req.params.id]
    );

    res.json({
      request: requests[0],
      classification: classifications[0] || null,
      routes,
    });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ error: 'Failed to get request' });
  }
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, resolved_at } = req.body;
    const updates: string[] = ['status = ?'];
    const params: any[] = [status];

    if (status === 'resolved') {
      updates.push('resolved_at = ?');
      params.push(resolved_at || new Date().toISOString());
    }

    params.push(req.params.id);

    await pool.query(
      `UPDATE service_requests SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM service_requests WHERE id = ?',
      [req.params.id]
    );

    res.json({ request: rows[0] });
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

export default router;
