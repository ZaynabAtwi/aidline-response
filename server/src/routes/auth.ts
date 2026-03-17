import { Router, Request, Response } from 'express';
import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';
import { generateAidlineIdentity } from '../utils/identity.js';

const router = Router();

// Identity-based login / registration
router.post('/identity-login', async (req: Request, res: Response) => {
  try {
    const { full_name, mother_full_name, sejel_number, date_of_birth } = req.body;

    if (!full_name || !mother_full_name || !sejel_number || !date_of_birth) {
      return res.status(400).json({
        error: 'full_name, mother_full_name, sejel_number, and date_of_birth are required',
      });
    }

    const identity = generateAidlineIdentity({
      full_name,
      mother_full_name,
      sejel_number,
      date_of_birth,
    });

    const [existingRows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM users
       WHERE full_name = ? AND mother_full_name = ? AND sejel_number = ? AND date_of_birth = ?
       LIMIT 1`,
      [identity.fullName, identity.motherName, identity.sejelNumber, date_of_birth]
    );

    let userId: string;
    if (existingRows.length > 0) {
      userId = existingRows[0].id;
      await pool.execute(
        `UPDATE users
         SET family_name = ?, generated_identity_id = ?, initials_hash = ?, intake_completed = TRUE
         WHERE id = ?`,
        [identity.familyName, identity.generated_identity_id, identity.initialsHash, userId]
      );
    } else {
      userId = uuidv4();
      await pool.execute(
        `INSERT INTO users (
          id, full_name, mother_full_name, family_name, sejel_number, date_of_birth,
          generated_identity_id, initials_hash, intake_completed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [
          userId,
          identity.fullName,
          identity.motherName,
          identity.familyName,
          identity.sejelNumber,
          date_of_birth,
          identity.generated_identity_id,
          identity.initialsHash,
        ]
      );
    }

    const [roles] = await pool.execute<RowDataPacket[]>(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [userId]
    );

    const [onboardingRows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM onboarding_responses WHERE user_id = ? LIMIT 1',
      [userId]
    );

    const [userRows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      user: userRows[0],
      roles: roles.map((r: RowDataPacket) => r.role),
      onboarding_completed: onboardingRows.length > 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Anonymous sign-in: creates or retrieves a user
router.post('/anonymous', async (req: Request, res: Response) => {
  try {
    const { existingId } = req.body;

    if (existingId) {
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM users WHERE id = ?',
        [existingId]
      );
      if (rows.length > 0) {
        return res.json({ user: rows[0] });
      }
    }

    const id = uuidv4();
    await pool.execute(
      'INSERT INTO users (id) VALUES (?)',
      [id]
    );

    const [newUser] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    res.json({ user: newUser[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [req.params.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [roles] = await pool.execute<RowDataPacket[]>(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [req.params.userId]
    );

    const [onboardingRows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM onboarding_responses WHERE user_id = ? LIMIT 1',
      [req.params.userId]
    );

    res.json({
      user: rows[0],
      roles: roles.map((r: any) => r.role),
      onboarding_completed: onboardingRows.length > 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Check role
router.get('/role/:userId/:role', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM user_roles WHERE user_id = ? AND role = ?',
      [req.params.userId, req.params.role]
    );
    res.json({ hasRole: rows.length > 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Save onboarding
router.post('/onboarding', async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      is_displaced,
      lost_house,
      occupation,
      major,
      employee_lost_job_due_to_war,
      needs_shelter,
      needs_medication,
      health_issues,
      health_issue_details,
      has_elderly_at_home,
      wants_to_volunteer,
      urgency,
    } = req.body;

    const id = uuidv4();
    await pool.execute(
      `INSERT INTO onboarding_responses (
        id, user_id, is_displaced, lost_house, occupation, major,
        employee_lost_job_due_to_war, needs_shelter, needs_medication,
        health_issues, health_issue_details, has_elderly_at_home,
        wants_to_volunteer, is_volunteering, urgency
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         is_displaced = VALUES(is_displaced),
         lost_house = VALUES(lost_house),
         occupation = VALUES(occupation),
         major = VALUES(major),
         employee_lost_job_due_to_war = VALUES(employee_lost_job_due_to_war),
         needs_shelter = VALUES(needs_shelter),
         needs_medication = VALUES(needs_medication),
         health_issues = VALUES(health_issues),
         health_issue_details = VALUES(health_issue_details),
         has_elderly_at_home = VALUES(has_elderly_at_home),
         wants_to_volunteer = VALUES(wants_to_volunteer),
         is_volunteering = VALUES(is_volunteering),
         urgency = VALUES(urgency)`,
      [
        id,
        user_id,
        !!is_displaced,
        !!lost_house,
        occupation || null,
        major || null,
        !!employee_lost_job_due_to_war,
        !!needs_shelter,
        !!needs_medication,
        !!health_issues,
        health_issue_details || null,
        !!has_elderly_at_home,
        !!wants_to_volunteer,
        !!wants_to_volunteer,
        urgency || 'medium',
      ]
    );

    const role = wants_to_volunteer ? 'volunteer' : 'displaced_user';
    const roleId = uuidv4();
    await pool.execute(
      `INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE role = VALUES(role)`,
      [roleId, user_id, role]
    );

    await pool.execute(
      'UPDATE users SET intake_completed = TRUE WHERE id = ?',
      [user_id]
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
