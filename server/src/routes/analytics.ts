import { Router, Request, Response } from 'express';
import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';

const router = Router();

// 8. Crisis Intelligence - Get aggregated anonymous data
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const [sosCount] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total, SUM(status = 'active') as active FROM sos_alerts`
    );

    const [requestsByType] = await pool.execute<RowDataPacket[]>(
      `SELECT request_type, COUNT(*) as count FROM service_requests GROUP BY request_type`
    );

    const [requestsByStatus] = await pool.execute<RowDataPacket[]>(
      `SELECT status, COUNT(*) as count FROM service_requests GROUP BY status`
    );

    const [medRequests] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total, SUM(status = 'pending') as pending,
              SUM(status = 'fulfilled') as fulfilled,
              SUM(status = 'escalated') as escalated
       FROM medication_requests`
    );

    const [shelterCapacity] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total,
              SUM(is_operational = TRUE) as operational,
              SUM(capacity) as total_capacity,
              SUM(available_spots) as total_available
       FROM shelters`
    );

    const [volunteerCount] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total,
              SUM(status = 'available') as available,
              SUM(status = 'assigned') as assigned
       FROM volunteers`
    );

    const [providerCount] = await pool.execute<RowDataPacket[]>(
      `SELECT provider_type, COUNT(*) as count, SUM(is_operational) as operational
       FROM service_providers GROUP BY provider_type`
    );

    res.json({
      sos: sosCount[0],
      requests_by_type: requestsByType,
      requests_by_status: requestsByStatus,
      medication: medRequests[0],
      shelters: shelterCapacity[0],
      volunteers: volunteerCount[0],
      providers: providerCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crisis trends over time
router.get('/trends', async (req: Request, res: Response) => {
  try {
    const { days = '30' } = req.query;
    const daysInt = parseInt(days as string);

    const [sosTrend] = await pool.execute<RowDataPacket[]>(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM sos_alerts
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at) ORDER BY date`,
      [daysInt]
    );

    const [requestTrend] = await pool.execute<RowDataPacket[]>(
      `SELECT DATE(created_at) as date, request_type, COUNT(*) as count
       FROM service_requests
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at), request_type ORDER BY date`,
      [daysInt]
    );

    const [medTrend] = await pool.execute<RowDataPacket[]>(
      `SELECT DATE(created_at) as date, medication_name, COUNT(*) as count
       FROM medication_requests
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at), medication_name ORDER BY count DESC`,
      [daysInt]
    );

    res.json({
      sos_trend: sosTrend,
      request_trend: requestTrend,
      medication_trend: medTrend,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Medication shortages
router.get('/medication-shortages', async (req: Request, res: Response) => {
  try {
    const [shortages] = await pool.execute<RowDataPacket[]>(
      `SELECT medication_name, COUNT(*) as request_count,
              SUM(status = 'escalated') as escalated_count,
              SUM(status = 'pending') as pending_count
       FROM medication_requests
       GROUP BY medication_name
       ORDER BY request_count DESC`
    );
    res.json(shortages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Healthcare system stress indicators
router.get('/healthcare-stress', async (req: Request, res: Response) => {
  try {
    const [stress] = await pool.execute<RowDataPacket[]>(
      `SELECT
        (SELECT COUNT(*) FROM service_requests WHERE request_type = 'medical' AND status NOT IN ('resolved', 'cancelled')) as active_medical,
        (SELECT COUNT(*) FROM sos_alerts WHERE status = 'active') as active_sos,
        (SELECT COUNT(*) FROM medication_requests WHERE status = 'pending') as pending_medications,
        (SELECT COUNT(*) FROM healthcare_interactions WHERE status IN ('pending', 'in_progress')) as active_interactions`
    );
    res.json(stress[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Institutional Dashboard - Request volume analytics
router.get('/institutional/volume', async (req: Request, res: Response) => {
  try {
    const { period = '7' } = req.query;
    const periodInt = parseInt(period as string);

    const [volume] = await pool.execute<RowDataPacket[]>(
      `SELECT DATE(created_at) as date, request_type, urgency_level, COUNT(*) as count
       FROM service_requests
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at), request_type, urgency_level
       ORDER BY date DESC`,
      [periodInt]
    );

    res.json(volume);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Humanitarian assistance demand
router.get('/institutional/humanitarian-demand', async (req: Request, res: Response) => {
  try {
    const [demand] = await pool.execute<RowDataPacket[]>(
      `SELECT
        nc.status, COUNT(*) as count
       FROM ngo_cases nc
       GROUP BY nc.status`
    );

    const [onboardingNeeds] = await pool.execute<RowDataPacket[]>(
      `SELECT
        SUM(needs_shelter) as shelter_need,
        SUM(needs_medication) as medication_need,
        COUNT(*) as total_users,
        district, urgency
       FROM onboarding_responses
       GROUP BY district, urgency`
    );

    res.json({ case_status: demand, onboarding_needs: onboardingNeeds });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
