import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import { authenticateUser } from '../middleware/auth.js';
import type { RowDataPacket } from 'mysql2';

const router = Router();

router.post('/conversations', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { request_id, responder_type } = req.body;
    const convId = uuidv4();

    await pool.query(
      `INSERT INTO conversations (id, request_id, user_id, responder_type, status)
       VALUES (?, ?, ?, ?, 'open')`,
      [convId, request_id || null, req.userId, responder_type || 'system']
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM conversations WHERE id = ?',
      [convId]
    );

    res.status(201).json({ conversation: rows[0] });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

router.get('/conversations', authenticateUser, async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.*, 
       (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.is_read = FALSE AND m.sender_id != ?) as unread_count
       FROM conversations c 
       WHERE c.user_id = ?
       ORDER BY c.updated_at DESC`,
      [req.userId, req.userId]
    );

    res.json({ conversations: rows });
  } catch (error) {
    console.error('List conversations error:', error);
    res.status(500).json({ error: 'Failed to list conversations' });
  }
});

router.get('/conversations/all', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.*,
       (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.is_read = FALSE AND m.sender_type = 'user') as unread_count
       FROM conversations c
       ORDER BY c.updated_at DESC`
    );

    res.json({ conversations: rows });
  } catch (error) {
    console.error('List all conversations error:', error);
    res.status(500).json({ error: 'Failed to list conversations' });
  }
});

router.get('/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );

    res.json({ messages: rows });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

router.post('/conversations/:id/messages', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { content, sender_type, message_type } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Message content required' });
      return;
    }

    if (content.length > 2000) {
      res.status(400).json({ error: 'Message too long (max 2000 characters)' });
      return;
    }

    const msgId = uuidv4();

    await pool.query(
      `INSERT INTO messages (id, conversation_id, sender_id, sender_type, content, message_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        msgId,
        req.params.id,
        req.userId,
        sender_type || 'user',
        content.trim(),
        message_type || 'text',
      ]
    );

    await pool.query(
      'UPDATE conversations SET updated_at = NOW(), status = ? WHERE id = ?',
      ['active', req.params.id]
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM messages WHERE id = ?',
      [msgId]
    );

    res.status(201).json({ message: rows[0] });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.patch('/conversations/:id/messages/read', async (req: Request, res: Response) => {
  try {
    const { sender_type } = req.body;
    await pool.query(
      `UPDATE messages SET is_read = TRUE
       WHERE conversation_id = ? AND sender_type = ? AND is_read = FALSE`,
      [req.params.id, sender_type || 'user']
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

router.patch('/conversations/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    await pool.query(
      'UPDATE conversations SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, req.params.id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Update conversation status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;
