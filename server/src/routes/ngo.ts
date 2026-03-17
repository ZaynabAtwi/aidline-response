import { Router, Request, Response } from 'express';
import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';

const router = Router();

// Get NGO providers
router.get('/providers', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM service_providers WHERE provider_type = 'ngo' ORDER BY name`
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create NGO case
router.post('/cases', async (req: Request, res: Response) => {
  try {
    const { request_id, ngo_id } = req.body;

    const id = uuidv4();
    await pool.execute(
      `INSERT INTO ngo_cases (id, request_id, ngo_id) VALUES (?, ?, ?)`,
      [id, request_id, ngo_id]
    );

    const [ngoCase] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM ngo_cases WHERE id = ?',
      [id]
    );

    res.status(201).json(ngoCase[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get NGO cases
router.get('/cases', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT nc.*, sr.request_type, sr.description, sr.urgency_level, sp.name as ngo_name
       FROM ngo_cases nc
       LEFT JOIN service_requests sr ON sr.id = nc.request_id
       LEFT JOIN service_providers sp ON sp.id = nc.ngo_id
       ORDER BY nc.created_at DESC`
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update NGO case status
router.patch('/cases/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, evaluation_notes, coordination_details } = req.body;
    const fields: string[] = ['status = ?'];
    const params: any[] = [status];

    if (evaluation_notes !== undefined) {
      fields.push('evaluation_notes = ?');
      params.push(evaluation_notes);
    }
    if (coordination_details !== undefined) {
      fields.push('coordination_details = ?');
      params.push(coordination_details);
    }

    params.push(req.params.id);
    await pool.execute(
      `UPDATE ngo_cases SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Validate NGO token
router.post('/validate-token', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, label FROM ngo_access_tokens
       WHERE token = ? AND is_active = TRUE
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    await pool.execute(
      `UPDATE ngo_access_tokens SET last_used_at = NOW() WHERE id = ?`,
      [rows[0].id]
    );

    res.json({ valid: true, tokenId: rows[0].id, label: rows[0].label });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// NGO secure channel data
router.post('/secure/data', async (req: Request, res: Response) => {
  try {
    const { token, action, payload } = req.body;

    const [tokens] = await pool.execute<RowDataPacket[]>(
      `SELECT id FROM ngo_access_tokens
       WHERE token = ? AND is_active = TRUE
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [token]
    );

    if (tokens.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const tokenId = tokens[0].id;
    await pool.execute(`UPDATE ngo_access_tokens SET last_used_at = NOW() WHERE id = ?`, [tokenId]);

    let data: any;

    switch (action) {
      case 'get_sos_alerts': {
        const [rows] = await pool.execute<RowDataPacket[]>(
          `SELECT id, message, status, created_at FROM sos_alerts ORDER BY created_at DESC`
        );
        data = rows;
        break;
      }
      case 'get_medication_requests': {
        const [rows] = await pool.execute<RowDataPacket[]>(
          `SELECT id, medication_name, urgency, status, created_at, notes FROM medication_requests ORDER BY created_at DESC`
        );
        data = rows;
        break;
      }
      case 'get_shelters': {
        const [rows] = await pool.execute<RowDataPacket[]>(
          `SELECT id, name, address, capacity, available_spots, is_operational FROM shelters ORDER BY name`
        );
        data = rows;
        break;
      }
      case 'get_notes': {
        const [rows] = await pool.execute<RowDataPacket[]>(
          `SELECT id, content, created_at FROM coordination_notes ORDER BY created_at DESC`
        );
        data = rows;
        break;
      }
      case 'update_sos_status': {
        const update: any = { status: payload.status };
        if (payload.status === 'resolved') {
          await pool.execute(
            `UPDATE sos_alerts SET status = ?, resolved_at = NOW() WHERE id = ?`,
            [payload.status, payload.id]
          );
        } else {
          await pool.execute(
            `UPDATE sos_alerts SET status = ? WHERE id = ?`,
            [payload.status, payload.id]
          );
        }
        data = { success: true };
        break;
      }
      case 'update_med_status': {
        await pool.execute(
          `UPDATE medication_requests SET status = ? WHERE id = ?`,
          [payload.status, payload.id]
        );
        data = { success: true };
        break;
      }
      case 'update_shelter': {
        await pool.execute(
          `UPDATE shelters SET capacity = ?, available_spots = ?, is_operational = ? WHERE id = ?`,
          [payload.capacity, payload.available_spots, payload.is_operational, payload.id]
        );
        data = { success: true };
        break;
      }
      case 'add_note': {
        const noteId = uuidv4();
        await pool.execute(
          `INSERT INTO coordination_notes (id, author_token_id, content) VALUES (?, ?, ?)`,
          [noteId, tokenId, payload.content]
        );
        const [note] = await pool.execute<RowDataPacket[]>(
          'SELECT * FROM coordination_notes WHERE id = ?',
          [noteId]
        );
        data = note[0];
        break;
      }
      default:
        return res.status(400).json({ error: 'Unknown action' });
    }

    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Coordination notes
router.get('/notes', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM coordination_notes ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/notes', async (req: Request, res: Response) => {
  try {
    const { content, author_token_id } = req.body;
    const id = uuidv4();
    await pool.execute(
      `INSERT INTO coordination_notes (id, author_token_id, content) VALUES (?, ?, ?)`,
      [id, author_token_id || null, content]
    );
    const [note] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM coordination_notes WHERE id = ?',
      [id]
    );
    res.status(201).json(note[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
