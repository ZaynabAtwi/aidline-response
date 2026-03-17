-- AidLine MySQL Analytics Views
-- Run after 001_schema.sql

USE aidline;

CREATE OR REPLACE VIEW vw_request_volume_by_category AS
SELECT
  DATE(created_at) AS request_date,
  request_category,
  urgency_level,
  COUNT(*) AS request_count
FROM aid_requests
GROUP BY DATE(created_at), request_category, urgency_level;

CREATE OR REPLACE VIEW vw_medication_shortages AS
SELECT
  DATE(mr.created_at) AS event_date,
  mr.medication_name,
  COUNT(*) AS shortage_events
FROM medication_responses mr
WHERE mr.availability_status = 'unavailable'
GROUP BY DATE(mr.created_at), mr.medication_name;

CREATE OR REPLACE VIEW vw_humanitarian_demand AS
SELECT
  DATE(ar.created_at) AS request_date,
  COUNT(*) AS humanitarian_requests
FROM aid_requests ar
WHERE ar.request_category = 'humanitarian_aid'
GROUP BY DATE(ar.created_at);

CREATE OR REPLACE VIEW vw_responder_network_load AS
SELECT
  pa.id AS provider_account_id,
  pa.provider_type,
  o.name AS organization_name,
  COUNT(CASE WHEN rr.route_status IN ('queued', 'delivered', 'accepted', 'escalated') THEN 1 END) AS open_routes,
  COUNT(CASE WHEN rr.route_status = 'completed' THEN 1 END) AS completed_routes
FROM provider_accounts pa
JOIN organizations o ON o.id = pa.organization_id
LEFT JOIN request_routes rr ON rr.routed_provider_account_id = pa.id
GROUP BY pa.id, pa.provider_type, o.name;

CREATE OR REPLACE VIEW vw_institutional_dashboard AS
SELECT
  DATE(ar.created_at) AS request_date,
  COUNT(*) AS total_requests,
  SUM(CASE WHEN ar.request_channel = 'sos' THEN 1 ELSE 0 END) AS sos_requests,
  SUM(CASE WHEN ar.request_category = 'medical_emergency' THEN 1 ELSE 0 END) AS medical_emergencies,
  SUM(CASE WHEN ar.request_category = 'medication_need' THEN 1 ELSE 0 END) AS medication_needs,
  SUM(CASE WHEN ar.request_category = 'humanitarian_aid' THEN 1 ELSE 0 END) AS humanitarian_needs,
  SUM(CASE WHEN ar.urgency_level = 'critical' THEN 1 ELSE 0 END) AS critical_priority_requests
FROM aid_requests ar
GROUP BY DATE(ar.created_at);
