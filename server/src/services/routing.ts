import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';

interface RouteResult {
  routeId: string;
  providerId: string;
  providerName: string;
  routeType: string;
}

export async function routeRequest(
  requestId: string,
  responderType: 'healthcare' | 'pharmacy' | 'ngo' | 'general'
): Promise<RouteResult | null> {
  const typeMap: Record<string, string> = {
    healthcare: 'healthcare',
    pharmacy: 'pharmacy',
    ngo: 'ngo',
    general: 'ngo',
  };

  const providerType = typeMap[responderType] || 'ngo';

  const [providers] = await pool.execute<RowDataPacket[]>(
    `SELECT id, name FROM service_providers
     WHERE provider_type = ? AND is_operational = TRUE
     ORDER BY created_at ASC LIMIT 1`,
    [providerType]
  );

  if (!providers || providers.length === 0) {
    const [fallback] = await pool.execute<RowDataPacket[]>(
      `SELECT id, name FROM service_providers WHERE is_operational = TRUE ORDER BY created_at ASC LIMIT 1`
    );
    if (!fallback || fallback.length === 0) return null;

    const routeId = uuidv4();
    await pool.execute(
      `INSERT INTO request_routing (id, request_id, provider_id, route_type, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [routeId, requestId, fallback[0].id, 'general']
    );

    await pool.execute(
      `UPDATE service_requests SET status = 'routed' WHERE id = ?`,
      [requestId]
    );

    return {
      routeId,
      providerId: fallback[0].id,
      providerName: fallback[0].name,
      routeType: 'general',
    };
  }

  const routeId = uuidv4();
  const routeType = responderType === 'general' ? 'ngo' : responderType;

  await pool.execute(
    `INSERT INTO request_routing (id, request_id, provider_id, route_type, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [routeId, requestId, providers[0].id, routeType]
  );

  await pool.execute(
    `UPDATE service_requests SET status = 'routed' WHERE id = ?`,
    [requestId]
  );

  return {
    routeId,
    providerId: providers[0].id,
    providerName: providers[0].name,
    routeType,
  };
}

export async function acceptRoute(routeId: string) {
  await pool.execute(
    `UPDATE request_routing SET status = 'accepted', accepted_at = NOW() WHERE id = ?`,
    [routeId]
  );

  const [routes] = await pool.execute<RowDataPacket[]>(
    `SELECT request_id FROM request_routing WHERE id = ?`,
    [routeId]
  );

  if (routes.length > 0) {
    await pool.execute(
      `UPDATE service_requests SET status = 'accepted' WHERE id = ?`,
      [routes[0].request_id]
    );
  }
}

export async function completeRoute(routeId: string) {
  await pool.execute(
    `UPDATE request_routing SET status = 'completed', completed_at = NOW() WHERE id = ?`,
    [routeId]
  );

  const [routes] = await pool.execute<RowDataPacket[]>(
    `SELECT request_id FROM request_routing WHERE id = ?`,
    [routeId]
  );

  if (routes.length > 0) {
    await pool.execute(
      `UPDATE service_requests SET status = 'resolved', resolved_at = NOW() WHERE id = ?`,
      [routes[0].request_id]
    );
  }
}

export async function escalateRoute(routeId: string) {
  await pool.execute(
    `UPDATE request_routing SET status = 'escalated' WHERE id = ?`,
    [routeId]
  );
}
