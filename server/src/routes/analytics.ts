import { Router, Request, Response } from 'express';
import pool from '../config/database.js';
import type { RowDataPacket } from 'mysql2';

const router = Router();

router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const [totalRequests] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM service_requests'
    );

    const [requestsByType] = await pool.query<RowDataPacket[]>(
      `SELECT request_type, COUNT(*) as count 
       FROM service_requests 
       GROUP BY request_type`
    );

    const [requestsByStatus] = await pool.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) as count 
       FROM service_requests 
       GROUP BY status`
    );

    const [requestsByUrgency] = await pool.query<RowDataPacket[]>(
      `SELECT urgency_level, COUNT(*) as count 
       FROM service_requests 
       GROUP BY urgency_level`
    );

    const [activeProviders] = await pool.query<RowDataPacket[]>(
      `SELECT 
        (SELECT COUNT(*) FROM healthcare_providers WHERE is_operational = TRUE) as healthcare,
        (SELECT COUNT(*) FROM pharmacies WHERE is_operational = TRUE) as pharmacies,
        (SELECT COUNT(*) FROM ngos WHERE is_active = TRUE) as ngos,
        (SELECT COUNT(*) FROM volunteers WHERE status = 'available') as volunteers`
    );

    const [recentActivity] = await pool.query<RowDataPacket[]>(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM service_requests 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at) 
       ORDER BY date`
    );

    const [sosCount] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM service_requests 
       WHERE request_type = 'sos_emergency' AND status NOT IN ('resolved', 'cancelled')`
    );

    const [avgResponseTime] = await pool.query<RowDataPacket[]>(
      `SELECT AVG(TIMESTAMPDIFF(MINUTE, sr.created_at, srt.accepted_at)) as avg_minutes
       FROM service_requests sr
       JOIN service_routes srt ON sr.id = srt.request_id
       WHERE srt.route_status = 'accepted' AND srt.accepted_at IS NOT NULL`
    );

    const [resolutionRate] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
        COUNT(*) as total
       FROM service_requests
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );

    const [medicationDemand] = await pool.query<RowDataPacket[]>(
      `SELECT title as medication, COUNT(*) as demand_count
       FROM service_requests
       WHERE request_type = 'medication_need'
       GROUP BY title
       ORDER BY demand_count DESC
       LIMIT 10`
    );

    res.json({
      overview: {
        totalRequests: totalRequests[0]?.count || 0,
        activeSOS: sosCount[0]?.count || 0,
        avgResponseMinutes: Math.round(avgResponseTime[0]?.avg_minutes || 0),
        resolutionRate: resolutionRate[0]?.total > 0
          ? Math.round((resolutionRate[0].resolved / resolutionRate[0].total) * 100)
          : 0,
      },
      requestsByType,
      requestsByStatus,
      requestsByUrgency,
      activeProviders: activeProviders[0],
      recentActivity,
      medicationDemand,
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

router.get('/crisis-trends', async (_req: Request, res: Response) => {
  try {
    const [trends] = await pool.query<RowDataPacket[]>(
      `SELECT 
        DATE(created_at) as date,
        request_type,
        urgency_level,
        COUNT(*) as count
       FROM service_requests
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
       GROUP BY DATE(created_at), request_type, urgency_level
       ORDER BY date DESC`
    );

    const [shortages] = await pool.query<RowDataPacket[]>(
      `SELECT medication_name, SUM(quantity) as total_stock
       FROM medication_inventory
       WHERE is_available = TRUE
       GROUP BY medication_name
       HAVING total_stock < 10
       ORDER BY total_stock ASC`
    );

    res.json({ trends, medicationShortages: shortages });
  } catch (error) {
    console.error('Crisis trends error:', error);
    res.status(500).json({ error: 'Failed to load crisis trends' });
  }
});

router.get('/request-volume', async (_req: Request, res: Response) => {
  try {
    const [daily] = await pool.query<RowDataPacket[]>(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM service_requests
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date`
    );

    const [byHour] = await pool.query<RowDataPacket[]>(
      `SELECT HOUR(created_at) as hour, COUNT(*) as count
       FROM service_requests
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       GROUP BY HOUR(created_at)
       ORDER BY hour`
    );

    res.json({ daily, byHour });
  } catch (error) {
    console.error('Request volume error:', error);
    res.status(500).json({ error: 'Failed to load request volume' });
  }
});

export default router;
