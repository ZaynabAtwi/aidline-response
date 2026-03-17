-- AidLine MySQL Analytics Procedures & Views
-- Migration: 002_analytics_procedures

USE aidline;

-- ─────────────────────────────────────────────────────────────────────────────
-- VIEW: Active Requests Summary
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_active_requests AS
SELECT
  sr.id,
  sr.type,
  sr.urgency,
  sr.status,
  sr.created_at,
  rc.category,
  rc.priority_score,
  rc.recommended_provider_type,
  ra.provider_id       AS assigned_provider_id,
  ra.status            AS assignment_status,
  sp.name              AS provider_name
FROM service_requests sr
LEFT JOIN request_classifications rc ON rc.request_id  = sr.id
LEFT JOIN request_assignments     ra ON ra.request_id  = sr.id AND ra.status = 'accepted'
LEFT JOIN service_providers       sp ON sp.id          = ra.provider_id
WHERE sr.status NOT IN ('resolved', 'cancelled');

-- ─────────────────────────────────────────────────────────────────────────────
-- VIEW: Crisis Dashboard (anonymous aggregated data)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_crisis_dashboard AS
SELECT
  DATE(created_at)       AS day,
  type                   AS request_type,
  COUNT(*)               AS total,
  SUM(status = 'resolved')   AS resolved,
  SUM(status = 'pending')    AS pending,
  SUM(urgency = 'critical')  AS critical_count,
  SUM(urgency = 'high')      AS high_count
FROM service_requests
GROUP BY DATE(created_at), type;

-- ─────────────────────────────────────────────────────────────────────────────
-- VIEW: Medication Shortage Monitor
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_medication_shortage AS
SELECT
  mr.medication_name,
  COUNT(*)                      AS total_requests,
  SUM(mr.status = 'pending')    AS pending_requests,
  SUM(mr.urgency = 'critical')  AS critical_requests,
  SUM(mr.urgency = 'high')      AS high_urgency_requests,
  MAX(mr.created_at)            AS last_request_at
FROM medication_requests mr
WHERE mr.status IN ('pending', 'approved')
GROUP BY mr.medication_name
ORDER BY pending_requests DESC, critical_requests DESC;

-- ─────────────────────────────────────────────────────────────────────────────
-- VIEW: Provider Workload
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_provider_workload AS
SELECT
  sp.id,
  sp.name,
  sp.type,
  COUNT(ra.id)                      AS total_assignments,
  SUM(ra.status = 'accepted')       AS active_cases,
  SUM(ra.status = 'completed')      AS completed_cases,
  SUM(ra.status = 'pending')        AS pending_cases,
  AVG(TIMESTAMPDIFF(MINUTE, ra.assigned_at, ra.accepted_at)) AS avg_accept_minutes
FROM service_providers sp
LEFT JOIN request_assignments ra ON ra.provider_id = sp.id
GROUP BY sp.id, sp.name, sp.type;

-- ─────────────────────────────────────────────────────────────────────────────
-- PROCEDURE: Auto-classify a service request (rule-based triage)
-- In production this would be replaced by an AI/ML service call
-- ─────────────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS classify_request;

DELIMITER $$
CREATE PROCEDURE classify_request(IN p_request_id VARCHAR(36))
BEGIN
  DECLARE v_type    VARCHAR(50);
  DECLARE v_urgency VARCHAR(50);
  DECLARE v_category VARCHAR(50);
  DECLARE v_provider_type VARCHAR(50);
  DECLARE v_priority INT DEFAULT 50;

  SELECT type, urgency INTO v_type, v_urgency
  FROM service_requests
  WHERE id = p_request_id;

  -- Determine category and recommended provider based on request type
  CASE v_type
    WHEN 'sos' THEN
      SET v_category      = 'medical_emergency';
      SET v_provider_type = 'healthcare';
      SET v_priority      = 100;
    WHEN 'medical' THEN
      SET v_category      = 'medical_emergency';
      SET v_provider_type = 'healthcare';
      SET v_priority      = CASE v_urgency WHEN 'critical' THEN 95 WHEN 'high' THEN 80 WHEN 'medium' THEN 60 ELSE 40 END;
    WHEN 'medication' THEN
      SET v_category      = 'medication_need';
      SET v_provider_type = 'pharmacy';
      SET v_priority      = CASE v_urgency WHEN 'critical' THEN 90 WHEN 'high' THEN 75 WHEN 'medium' THEN 55 ELSE 35 END;
    WHEN 'humanitarian' THEN
      SET v_category      = 'humanitarian_aid';
      SET v_provider_type = 'ngo';
      SET v_priority      = CASE v_urgency WHEN 'critical' THEN 85 WHEN 'high' THEN 70 WHEN 'medium' THEN 50 ELSE 30 END;
    ELSE
      SET v_category      = 'general_inquiry';
      SET v_provider_type = 'ngo';
      SET v_priority      = 20;
  END CASE;

  -- Insert classification record
  INSERT INTO request_classifications
    (id, request_id, category, priority_score, recommended_provider_type)
  VALUES
    (UUID(), p_request_id, v_category, v_priority, v_provider_type)
  ON DUPLICATE KEY UPDATE
    category                  = v_category,
    priority_score            = v_priority,
    recommended_provider_type = v_provider_type,
    classified_at             = CURRENT_TIMESTAMP;

  -- Mark request as classified
  UPDATE service_requests
  SET status = 'classified', updated_at = CURRENT_TIMESTAMP
  WHERE id = p_request_id AND status = 'pending';

END$$
DELIMITER ;

-- ─────────────────────────────────────────────────────────────────────────────
-- PROCEDURE: Route a classified request to available providers
-- ─────────────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS route_request;

DELIMITER $$
CREATE PROCEDURE route_request(IN p_request_id VARCHAR(36))
BEGIN
  DECLARE v_provider_type VARCHAR(50);
  DECLARE v_provider_id   VARCHAR(36);

  SELECT rc.recommended_provider_type INTO v_provider_type
  FROM request_classifications rc
  WHERE rc.request_id = p_request_id;

  -- Find the first available active provider of the recommended type
  SELECT id INTO v_provider_id
  FROM service_providers
  WHERE type = v_provider_type AND is_active = TRUE
  LIMIT 1;

  IF v_provider_id IS NOT NULL THEN
    INSERT INTO request_assignments (id, request_id, provider_id, status)
    VALUES (UUID(), p_request_id, v_provider_id, 'pending');

    UPDATE service_requests
    SET status = 'routed', updated_at = CURRENT_TIMESTAMP
    WHERE id = p_request_id AND status = 'classified';
  END IF;

END$$
DELIMITER ;

-- ─────────────────────────────────────────────────────────────────────────────
-- PROCEDURE: Aggregate daily analytics
-- Should be called via a scheduled event or cron job
-- ─────────────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS aggregate_daily_analytics;

DELIMITER $$
CREATE PROCEDURE aggregate_daily_analytics(IN p_date DATE)
BEGIN
  INSERT INTO crisis_analytics
    (id, analytics_date, request_type, total_count, resolved_count, pending_count,
     avg_response_time_minutes, avg_resolution_time_minutes)
  SELECT
    UUID(),
    p_date,
    sr.type,
    COUNT(*),
    SUM(sr.status = 'resolved'),
    SUM(sr.status IN ('pending', 'classified', 'routed')),
    AVG(TIMESTAMPDIFF(MINUTE, sr.created_at, ra.accepted_at)),
    AVG(TIMESTAMPDIFF(MINUTE, sr.created_at, sr.resolved_at))
  FROM service_requests sr
  LEFT JOIN request_assignments ra ON ra.request_id = sr.id AND ra.status = 'accepted'
  WHERE DATE(sr.created_at) = p_date
  GROUP BY sr.type
  ON DUPLICATE KEY UPDATE
    total_count                 = VALUES(total_count),
    resolved_count              = VALUES(resolved_count),
    pending_count               = VALUES(pending_count),
    avg_response_time_minutes   = VALUES(avg_response_time_minutes),
    avg_resolution_time_minutes = VALUES(avg_resolution_time_minutes),
    updated_at                  = CURRENT_TIMESTAMP;
END$$
DELIMITER ;

-- ─────────────────────────────────────────────────────────────────────────────
-- SCHEDULED EVENT: Nightly analytics aggregation (requires event_scheduler=ON)
-- ─────────────────────────────────────────────────────────────────────────────
DROP EVENT IF EXISTS evt_nightly_analytics;

CREATE EVENT evt_nightly_analytics
  ON SCHEDULE EVERY 1 DAY STARTS (DATE(NOW()) + INTERVAL 1 DAY + INTERVAL 2 HOUR)
  DO CALL aggregate_daily_analytics(DATE(NOW() - INTERVAL 1 DAY));
