import { Router, Request, Response } from 'express';
import pool from '../config/database.js';
import { routeRequest, acceptRoute, declineRoute, escalateRoute } from '../services/routingEngine.js';
import type { RowDataPacket } from 'mysql2';

const router = Router();

router.post('/route/:requestId', async (req: Request, res: Response) => {
  try {
    const { classificationId } = req.body;
    if (!classificationId) {
      res.status(400).json({ error: 'classificationId required' });
      return;
    }

    const routes = await routeRequest(req.params.requestId, classificationId);
    res.json({ routes });
  } catch (error) {
    console.error('Routing error:', error);
    res.status(500).json({ error: 'Routing failed' });
  }
});

router.post('/accept/:routeId', async (req: Request, res: Response) => {
  try {
    await acceptRoute(req.params.routeId);
    res.json({ success: true, message: 'Route accepted' });
  } catch (error) {
    console.error('Accept route error:', error);
    res.status(500).json({ error: 'Failed to accept route' });
  }
});

router.post('/decline/:routeId', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    await declineRoute(req.params.routeId, reason);
    res.json({ success: true, message: 'Route declined' });
  } catch (error) {
    console.error('Decline route error:', error);
    res.status(500).json({ error: 'Failed to decline route' });
  }
});

router.post('/escalate/:routeId', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      res.status(400).json({ error: 'Escalation reason required' });
      return;
    }
    await escalateRoute(req.params.routeId, reason);
    res.json({ success: true, message: 'Route escalated' });
  } catch (error) {
    console.error('Escalate route error:', error);
    res.status(500).json({ error: 'Failed to escalate route' });
  }
});

router.get('/routes/:requestId', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT sr.*, 
       CASE sr.routed_to_type
         WHEN 'healthcare_provider' THEN (SELECT name FROM healthcare_providers WHERE id = sr.routed_to_id)
         WHEN 'pharmacy' THEN (SELECT name FROM pharmacies WHERE id = sr.routed_to_id)
         WHEN 'ngo' THEN (SELECT name FROM ngos WHERE id = sr.routed_to_id)
       END as provider_name
       FROM service_routes sr WHERE sr.request_id = ?
       ORDER BY sr.created_at DESC`,
      [req.params.requestId]
    );

    res.json({ routes: rows });
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ error: 'Failed to get routes' });
  }
});

export default router;
