USE aidline;

DELIMITER $$

CREATE PROCEDURE sp_triage_and_route(IN p_request_id BIGINT UNSIGNED)
BEGIN
  DECLARE v_action VARCHAR(16);
  DECLARE v_description TEXT;
  DECLARE v_urgency VARCHAR(16);
  DECLARE v_category VARCHAR(32);
  DECLARE v_priority VARCHAR(16);
  DECLARE v_responder_type VARCHAR(32);
  DECLARE v_route_module VARCHAR(32);
  DECLARE v_reason JSON;

  SELECT entry_action, LOWER(description), urgency_level
    INTO v_action, v_description, v_urgency
  FROM aid_requests
  WHERE id = p_request_id;

  IF v_action = 'sos'
      OR LOCATE('emergency', v_description) > 0
      OR LOCATE('bleeding', v_description) > 0
      OR LOCATE('critical', v_description) > 0 THEN
    SET v_category = 'medical_emergency';
    SET v_responder_type = 'healthcare_provider';
    SET v_route_module = 'healthcare_network';
  ELSEIF v_action = 'medication'
      OR LOCATE('medication', v_description) > 0
      OR LOCATE('insulin', v_description) > 0
      OR LOCATE('pharmacy', v_description) > 0 THEN
    SET v_category = 'medication_need';
    SET v_responder_type = 'pharmacy';
    SET v_route_module = 'medication_supply';
  ELSEIF v_action = 'ngo'
      OR LOCATE('shelter', v_description) > 0
      OR LOCATE('food', v_description) > 0
      OR LOCATE('humanitarian', v_description) > 0 THEN
    SET v_category = 'humanitarian_aid';
    SET v_responder_type = 'ngo';
    SET v_route_module = 'ngo_coordination';
  ELSE
    SET v_category = 'general_inquiry';
    SET v_responder_type = 'support_agent';
    SET v_route_module = 'secure_messaging';
  END IF;

  IF v_urgency IS NOT NULL THEN
    SET v_priority = v_urgency;
  ELSEIF v_category = 'medical_emergency' THEN
    SET v_priority = 'critical';
  ELSE
    SET v_priority = 'medium';
  END IF;

  SET v_reason = JSON_OBJECT(
    'action', v_action,
    'derived_category', v_category,
    'derived_route', v_route_module
  );

  INSERT INTO triage_results (
    request_id,
    category,
    priority_level,
    responder_type,
    confidence_score,
    triage_reason
  )
  VALUES (
    p_request_id,
    v_category,
    v_priority,
    v_responder_type,
    0.85,
    v_reason
  )
  ON DUPLICATE KEY UPDATE
    category = VALUES(category),
    priority_level = VALUES(priority_level),
    responder_type = VALUES(responder_type),
    confidence_score = VALUES(confidence_score),
    triage_reason = VALUES(triage_reason),
    triaged_at = CURRENT_TIMESTAMP;

  INSERT INTO request_routing (request_id, route_module, route_status)
  VALUES (p_request_id, v_route_module, 'pending')
  ON DUPLICATE KEY UPDATE
    route_module = VALUES(route_module),
    route_status = 'pending',
    routed_at = CURRENT_TIMESTAMP,
    closed_at = NULL;

  UPDATE aid_requests
  SET status = 'routed'
  WHERE id = p_request_id;

  INSERT INTO case_events (request_id, event_type, event_data)
  VALUES (
    p_request_id,
    'request_triaged_and_routed',
    JSON_OBJECT('category', v_category, 'priority', v_priority, 'route_module', v_route_module)
  );
END$$

CREATE PROCEDURE sp_accept_route_assignment(
  IN p_assignment_id BIGINT UNSIGNED,
  IN p_responder_id BIGINT UNSIGNED
)
BEGIN
  DECLARE v_routing_id BIGINT UNSIGNED;
  DECLARE v_request_id BIGINT UNSIGNED;

  SELECT routing_id
    INTO v_routing_id
  FROM route_assignments
  WHERE id = p_assignment_id;

  UPDATE route_assignments
  SET assignment_status = 'accepted',
      responder_id = p_responder_id,
      responded_at = CURRENT_TIMESTAMP
  WHERE id = p_assignment_id;

  UPDATE route_assignments
  SET assignment_status = 'rejected',
      responded_at = CURRENT_TIMESTAMP
  WHERE routing_id = v_routing_id
    AND id <> p_assignment_id
    AND assignment_status = 'offered';

  UPDATE request_routing
  SET route_status = 'accepted'
  WHERE id = v_routing_id;

  SELECT request_id
    INTO v_request_id
  FROM request_routing
  WHERE id = v_routing_id;

  UPDATE aid_requests
  SET status = 'accepted'
  WHERE id = v_request_id;

  INSERT INTO secure_conversations (request_id, conversation_status)
  VALUES (v_request_id, 'open')
  ON DUPLICATE KEY UPDATE
    conversation_status = 'open';

  INSERT INTO case_events (request_id, event_type, event_data)
  VALUES (
    v_request_id,
    'assignment_accepted',
    JSON_OBJECT('assignment_id', p_assignment_id, 'responder_id', p_responder_id)
  );
END$$

DELIMITER ;

CREATE OR REPLACE VIEW v_institutional_dashboard AS
SELECT
  DATE(ar.created_at) AS event_date,
  COUNT(*) AS total_requests,
  SUM(ar.status = 'submitted') AS submitted_requests,
  SUM(ar.status = 'routed') AS routed_requests,
  SUM(ar.status = 'accepted') AS accepted_requests,
  SUM(ar.status = 'resolved') AS resolved_requests,
  SUM(tr.priority_level = 'critical') AS critical_requests
FROM aid_requests ar
LEFT JOIN triage_results tr ON tr.request_id = ar.id
GROUP BY DATE(ar.created_at)
ORDER BY event_date DESC;
