import { Router, Request, Response } from 'express';
import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';

const router = Router();

// Create or get conversation
router.post('/conversations', async (req: Request, res: Response) => {
  try {
    const { user_id, provider_id, request_id } = req.body;

    // Check for existing open conversation
    const [existing] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM conversations WHERE user_id = ? AND status != 'closed'
       ORDER BY created_at DESC LIMIT 1`,
      [user_id]
    );

    if (existing.length > 0) {
      return res.json(existing[0]);
    }

    const id = uuidv4();
    await pool.execute(
      `INSERT INTO conversations (id, user_id, provider_id, request_id)
       VALUES (?, ?, ?, ?)`,
      [id, user_id, provider_id || null, request_id || null]
    );

    const [conv] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM conversations WHERE id = ?',
      [id]
    );

    res.status(201).json(conv[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get conversations for a user
router.get('/conversations/user/:userId', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT c.*, sp.name as provider_name
       FROM conversations c
       LEFT JOIN service_providers sp ON sp.id = c.provider_id
       WHERE c.user_id = ?
       ORDER BY c.updated_at DESC`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all conversations (for NGO dashboard)
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT c.*, sp.name as provider_name
       FROM conversations c
       LEFT JOIN service_providers sp ON sp.id = c.provider_id
       ORDER BY c.updated_at DESC`
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`,
      [req.params.conversationId]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send a message
router.post('/messages', async (req: Request, res: Response) => {
  try {
    const { conversation_id, sender_type, sender_id, message, attachments } = req.body;

    if (!conversation_id || !sender_type || !message) {
      return res.status(400).json({ error: 'conversation_id, sender_type, and message are required' });
    }

    const id = uuidv4();
    await pool.execute(
      `INSERT INTO messages (id, conversation_id, sender_type, sender_id, message, attachments)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, conversation_id, sender_type, sender_id || null, message, attachments ? JSON.stringify(attachments) : null]
    );

    // Update conversation timestamp
    await pool.execute(
      `UPDATE conversations SET updated_at = NOW() WHERE id = ?`,
      [conversation_id]
    );

    const [msg] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM messages WHERE id = ?',
      [id]
    );

    res.status(201).json(msg[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark messages as read
router.patch('/conversations/:conversationId/read', async (req: Request, res: Response) => {
  try {
    const { sender_type } = req.body;
    await pool.execute(
      `UPDATE messages SET is_read = TRUE
       WHERE conversation_id = ? AND sender_type = ? AND is_read = FALSE`,
      [req.params.conversationId, sender_type || 'user']
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update conversation status
router.patch('/conversations/:conversationId/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    await pool.execute(
      `UPDATE conversations SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, req.params.conversationId]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
