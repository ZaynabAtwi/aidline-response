import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import type { RowDataPacket } from 'mysql2';

type ResponderType = 'healthcare_provider' | 'pharmacy' | 'ngo';

interface RouteResult {
  routeId: string;
  providerId: string;
  providerType: ResponderType;
  providerName: string;
}

async function findAvailableProviders(
  responderType: ResponderType
): Promise<{ id: string; name: string }[]> {
  let query: string;

  switch (responderType) {
    case 'healthcare_provider':
      query = `SELECT id, name FROM healthcare_providers
               WHERE is_operational = TRUE AND capacity_status != 'full'
               ORDER BY FIELD(capacity_status, 'available', 'limited') LIMIT 5`;
      break;
    case 'pharmacy':
      query = `SELECT id, name FROM pharmacies
               WHERE is_operational = TRUE
               ORDER BY created_at LIMIT 5`;
      break;
    case 'ngo':
      query = `SELECT id, name FROM ngos
               WHERE is_active = TRUE
               ORDER BY created_at LIMIT 5`;
      break;
    default:
      return [];
  }

  const [rows] = await pool.query<RowDataPacket[]>(query);
  return rows as { id: string; name: string }[];
}

export async function routeRequest(
  requestId: string,
  classificationId: string
): Promise<RouteResult[]> {
  const [classRows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM request_classifications WHERE id = ?',
    [classificationId]
  );

  if (!classRows[0]) throw new Error('Classification not found');

  const classification = classRows[0];
  let responderType = classification.required_responder_type as ResponderType;

  if (responderType === 'general_support') {
    responderType = 'ngo';
  }

  const providers = await findAvailableProviders(responderType);

  if (providers.length === 0) {
    const fallbackTypes: ResponderType[] = ['ngo', 'healthcare_provider', 'pharmacy'];
    for (const fallback of fallbackTypes) {
      if (fallback === responderType) continue;
      const fallbackProviders = await findAvailableProviders(fallback);
      if (fallbackProviders.length > 0) {
        providers.push(...fallbackProviders);
        responderType = fallback;
        break;
      }
    }
  }

  const routes: RouteResult[] = [];

  for (const provider of providers) {
    const routeId = uuidv4();
    await pool.query(
      `INSERT INTO service_routes
       (id, request_id, classification_id, routed_to_type, routed_to_id, route_status)
       VALUES (?, ?, ?, ?, ?, 'notified')`,
      [routeId, requestId, classificationId, responderType, provider.id]
    );

    routes.push({
      routeId,
      providerId: provider.id,
      providerType: responderType,
      providerName: provider.name,
    });
  }

  await pool.query(
    'UPDATE service_requests SET status = ? WHERE id = ?',
    ['routed', requestId]
  );

  return routes;
}

export async function acceptRoute(routeId: string): Promise<void> {
  await pool.query(
    `UPDATE service_routes SET route_status = 'accepted', accepted_at = NOW()
     WHERE id = ?`,
    [routeId]
  );

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT request_id FROM service_routes WHERE id = ?',
    [routeId]
  );

  if (rows[0]) {
    await pool.query(
      'UPDATE service_requests SET status = ? WHERE id = ?',
      ['accepted', rows[0].request_id]
    );

    await pool.query(
      `UPDATE service_routes SET route_status = 'declined'
       WHERE request_id = ? AND id != ? AND route_status = 'notified'`,
      [rows[0].request_id, routeId]
    );
  }
}

export async function declineRoute(routeId: string, reason?: string): Promise<void> {
  await pool.query(
    `UPDATE service_routes SET route_status = 'declined', declined_at = NOW(), escalation_reason = ?
     WHERE id = ?`,
    [reason || null, routeId]
  );
}

export async function escalateRoute(routeId: string, reason: string): Promise<void> {
  await pool.query(
    `UPDATE service_routes SET route_status = 'escalated', escalation_reason = ?
     WHERE id = ?`,
    [reason, routeId]
  );
}
