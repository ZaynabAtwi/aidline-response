import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import type { RowDataPacket } from 'mysql2';

const router = Router();

// ── Healthcare Providers ──

router.get('/healthcare', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM healthcare_providers ORDER BY name'
    );
    res.json({ providers: rows });
  } catch (error) {
    console.error('List healthcare providers error:', error);
    res.status(500).json({ error: 'Failed to list providers' });
  }
});

router.post('/healthcare', async (req: Request, res: Response) => {
  try {
    const { name, provider_type, address, phone, email, services, operating_hours, ngo_affiliation } = req.body;
    const id = uuidv4();

    await pool.query(
      `INSERT INTO healthcare_providers
       (id, name, provider_type, address, phone, email, services, operating_hours, ngo_affiliation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, provider_type || 'clinic', address, phone, email, services ? JSON.stringify(services) : null, operating_hours, ngo_affiliation]
    );

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM healthcare_providers WHERE id = ?', [id]);
    res.status(201).json({ provider: rows[0] });
  } catch (error) {
    console.error('Create healthcare provider error:', error);
    res.status(500).json({ error: 'Failed to create provider' });
  }
});

router.patch('/healthcare/:id', async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (['name', 'address', 'phone', 'email', 'operating_hours', 'is_operational', 'capacity_status', 'ngo_affiliation'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
      if (key === 'services') {
        fields.push('services = ?');
        values.push(JSON.stringify(value));
      }
    }

    if (fields.length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    values.push(req.params.id);
    await pool.query(`UPDATE healthcare_providers SET ${fields.join(', ')} WHERE id = ?`, values);

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM healthcare_providers WHERE id = ?', [req.params.id]);
    res.json({ provider: rows[0] });
  } catch (error) {
    console.error('Update healthcare provider error:', error);
    res.status(500).json({ error: 'Failed to update provider' });
  }
});

// ── Pharmacies ──

router.get('/pharmacies', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM pharmacies ORDER BY name'
    );
    res.json({ pharmacies: rows });
  } catch (error) {
    console.error('List pharmacies error:', error);
    res.status(500).json({ error: 'Failed to list pharmacies' });
  }
});

router.post('/pharmacies', async (req: Request, res: Response) => {
  try {
    const { name, address, phone, email, operating_hours, ngo_affiliation } = req.body;
    const id = uuidv4();

    await pool.query(
      `INSERT INTO pharmacies (id, name, address, phone, email, operating_hours, ngo_affiliation)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, address, phone, email, operating_hours, ngo_affiliation]
    );

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM pharmacies WHERE id = ?', [id]);
    res.status(201).json({ pharmacy: rows[0] });
  } catch (error) {
    console.error('Create pharmacy error:', error);
    res.status(500).json({ error: 'Failed to create pharmacy' });
  }
});

router.get('/pharmacies/:id/inventory', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM medication_inventory WHERE pharmacy_id = ? ORDER BY medication_name',
      [req.params.id]
    );
    res.json({ inventory: rows });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to get inventory' });
  }
});

router.post('/pharmacies/:id/inventory', async (req: Request, res: Response) => {
  try {
    const { medication_name, quantity, notes } = req.body;
    const id = uuidv4();

    await pool.query(
      `INSERT INTO medication_inventory (id, pharmacy_id, medication_name, quantity, is_available, notes)
       VALUES (?, ?, ?, ?, TRUE, ?)`,
      [id, req.params.id, medication_name, quantity || 0, notes]
    );

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM medication_inventory WHERE id = ?', [id]);
    res.status(201).json({ item: rows[0] });
  } catch (error) {
    console.error('Add inventory error:', error);
    res.status(500).json({ error: 'Failed to add inventory item' });
  }
});

router.patch('/pharmacies/:pharmacyId/inventory/:id', async (req: Request, res: Response) => {
  try {
    const { quantity, is_available, notes } = req.body;
    await pool.query(
      `UPDATE medication_inventory SET quantity = COALESCE(?, quantity), is_available = COALESCE(?, is_available), notes = COALESCE(?, notes)
       WHERE id = ? AND pharmacy_id = ?`,
      [quantity, is_available, notes, req.params.id, req.params.pharmacyId]
    );

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM medication_inventory WHERE id = ?', [req.params.id]);
    res.json({ item: rows[0] });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

// ── NGOs ──

router.get('/ngos', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM ngos WHERE is_active = TRUE ORDER BY name'
    );
    res.json({ ngos: rows });
  } catch (error) {
    console.error('List NGOs error:', error);
    res.status(500).json({ error: 'Failed to list NGOs' });
  }
});

router.post('/ngos', async (req: Request, res: Response) => {
  try {
    const { name, description, contact_email, contact_phone, services_offered } = req.body;
    const id = uuidv4();

    await pool.query(
      `INSERT INTO ngos (id, name, description, contact_email, contact_phone, services_offered)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, description, contact_email, contact_phone, services_offered ? JSON.stringify(services_offered) : null]
    );

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM ngos WHERE id = ?', [id]);
    res.status(201).json({ ngo: rows[0] });
  } catch (error) {
    console.error('Create NGO error:', error);
    res.status(500).json({ error: 'Failed to create NGO' });
  }
});

// ── Shelters ──

router.get('/shelters', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM shelters ORDER BY name'
    );
    res.json({ shelters: rows });
  } catch (error) {
    console.error('List shelters error:', error);
    res.status(500).json({ error: 'Failed to list shelters' });
  }
});

router.patch('/shelters/:id', async (req: Request, res: Response) => {
  try {
    const { capacity, available_spots, is_operational } = req.body;
    await pool.query(
      `UPDATE shelters SET 
       capacity = COALESCE(?, capacity), 
       available_spots = COALESCE(?, available_spots), 
       is_operational = COALESCE(?, is_operational)
       WHERE id = ?`,
      [capacity, available_spots, is_operational, req.params.id]
    );

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM shelters WHERE id = ?', [req.params.id]);
    res.json({ shelter: rows[0] });
  } catch (error) {
    console.error('Update shelter error:', error);
    res.status(500).json({ error: 'Failed to update shelter' });
  }
});

// ── Volunteers ──

router.get('/volunteers', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM volunteers ORDER BY rating DESC'
    );
    res.json({ volunteers: rows });
  } catch (error) {
    console.error('List volunteers error:', error);
    res.status(500).json({ error: 'Failed to list volunteers' });
  }
});

router.post('/volunteers', async (req: Request, res: Response) => {
  try {
    const { user_id, skills, bio } = req.body;
    const id = uuidv4();

    await pool.query(
      `INSERT INTO volunteers (id, user_id, skills, bio, status)
       VALUES (?, ?, ?, ?, 'available')`,
      [id, user_id, JSON.stringify(skills), bio]
    );

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM volunteers WHERE id = ?', [id]);
    res.status(201).json({ volunteer: rows[0] });
  } catch (error) {
    console.error('Create volunteer error:', error);
    res.status(500).json({ error: 'Failed to create volunteer' });
  }
});

router.patch('/volunteers/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    await pool.query(
      'UPDATE volunteers SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM volunteers WHERE id = ?', [req.params.id]);
    res.json({ volunteer: rows[0] });
  } catch (error) {
    console.error('Update volunteer status error:', error);
    res.status(500).json({ error: 'Failed to update volunteer' });
  }
});

// ── Coordination Notes ──

router.get('/notes', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM coordination_notes ORDER BY created_at DESC'
    );
    res.json({ notes: rows });
  } catch (error) {
    console.error('List notes error:', error);
    res.status(500).json({ error: 'Failed to list notes' });
  }
});

router.post('/notes', async (req: Request, res: Response) => {
  try {
    const { content, author_user_id, author_token_id } = req.body;
    const id = uuidv4();

    await pool.query(
      `INSERT INTO coordination_notes (id, content, author_user_id, author_token_id)
       VALUES (?, ?, ?, ?)`,
      [id, content, author_user_id || null, author_token_id || null]
    );

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM coordination_notes WHERE id = ?', [id]);
    res.status(201).json({ note: rows[0] });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

export default router;
