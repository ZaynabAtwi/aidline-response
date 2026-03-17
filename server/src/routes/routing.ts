import { Router, Request, Response } from 'express';
import pool from '../config/database.js';
import { RowDataPacket } from 'mysql2';
import { acceptRoute, completeRoute, escalateRoute } from '../services/routing.js';

const router = Router();

// Get all routes (admin)
router.get('/', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT rr.*, sp.name as provider_name, sp.provider_type,
              sr.request_type, sr.description, sr.urgency_level
       FROM request_routing rr
       LEFT JOIN service_providers sp ON sp.id = rr.provider_id
       LEFT JOIN service_requests sr ON sr.id = rr.request_id
       ORDER BY rr.created_at DESC`
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get routes for a provider
router.get('/provider/:providerId', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT rr.*, sr.request_type, sr.description, sr.urgency_level
       FROM request_routing rr
       LEFT JOIN service_requests sr ON sr.id = rr.request_id
       WHERE rr.provider_id = ?
       ORDER BY rr.created_at DESC`,
      [req.params.providerId]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Accept a route
router.patch('/:routeId/accept', async (req: Request, res: Response) => {
  try {
    await acceptRoute(req.params.routeId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Complete a route
router.patch('/:routeId/complete', async (req: Request, res: Response) => {
  try {
    await completeRoute(req.params.routeId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Escalate a route
router.patch('/:routeId/escalate', async (req: Request, res: Response) => {
  try {
    await escalateRoute(req.params.routeId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
