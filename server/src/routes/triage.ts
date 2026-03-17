import { Router, Request, Response } from 'express';
import pool from '../config/database.js';
import { classifyAndStoreRequest, classifyRequest } from '../services/triageEngine.js';
import type { RowDataPacket } from 'mysql2';

const router = Router();

router.post('/classify/:requestId', async (req: Request, res: Response) => {
  try {
    const { classificationId, result } = await classifyAndStoreRequest(req.params.requestId);
    res.json({ classificationId, classification: result });
  } catch (error) {
    console.error('Classification error:', error);
    res.status(500).json({ error: 'Classification failed' });
  }
});

router.post('/preview', (req: Request, res: Response) => {
  try {
    const { request_type, title, description, urgency_level } = req.body;
    const result = classifyRequest(
      request_type || 'general_inquiry',
      title || '',
      description || '',
      urgency_level || 'medium'
    );
    res.json({ classification: result });
  } catch (error) {
    console.error('Preview classification error:', error);
    res.status(500).json({ error: 'Preview failed' });
  }
});

router.get('/classification/:requestId', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM request_classifications WHERE request_id = ?',
      [req.params.requestId]
    );

    if (!rows[0]) {
      res.status(404).json({ error: 'Classification not found' });
      return;
    }

    res.json({ classification: rows[0] });
  } catch (error) {
    console.error('Get classification error:', error);
    res.status(500).json({ error: 'Failed to get classification' });
  }
});

export default router;
