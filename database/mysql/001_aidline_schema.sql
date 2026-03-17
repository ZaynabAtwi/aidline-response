-- AidLine MySQL schema (no geolocation dependency)
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS aidline
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE aidline;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  anonymous_code VARCHAR(32) NOT NULL UNIQUE,
  preferred_language VARCHAR(8) NOT NULL DEFAULT 'en',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organizations (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  type ENUM('healthcare', 'pharmacy', 'ngo', 'government') NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS responders (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NOT NULL,
  display_name VARCHAR(120) NOT NULL,
  role ENUM('clinician', 'pharmacist', 'ngo_coordinator', 'support_agent', 'admin') NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_responders_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS aid_requests (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  public_id CHAR(26) NOT NULL UNIQUE,
  user_id CHAR(36) NOT NULL,
  entry_action ENUM('sos', 'healthcare', 'medication', 'ngo', 'message') NOT NULL,
  description TEXT NOT NULL,
  urgency_level ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  status ENUM('submitted', 'triaged', 'routed', 'accepted', 'in_progress', 'resolved', 'cancelled') NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_requests_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  INDEX idx_requests_status_created (status, created_at),
  INDEX idx_requests_action (entry_action),
  INDEX idx_requests_urgency (urgency_level)
);

CREATE TABLE IF NOT EXISTS request_attachments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  file_size_bytes BIGINT UNSIGNED NOT NULL,
  secure_url TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attachments_request
    FOREIGN KEY (request_id) REFERENCES aid_requests(id)
    ON DELETE CASCADE,
  INDEX idx_attachments_request (request_id)
);

CREATE TABLE IF NOT EXISTS triage_results (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  category ENUM('medical_emergency', 'medication_need', 'humanitarian_aid', 'general_inquiry') NOT NULL,
  priority_level ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  responder_type ENUM('healthcare_provider', 'pharmacy', 'ngo', 'support_agent') NOT NULL,
  confidence_score DECIMAL(5,4) NOT NULL DEFAULT 0.7500,
  triage_reason JSON NULL,
  triaged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_triage_request
    FOREIGN KEY (request_id) REFERENCES aid_requests(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_triage_request (request_id),
  INDEX idx_triage_category_priority (category, priority_level)
);

CREATE TABLE IF NOT EXISTS request_routing (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  route_module ENUM('healthcare_network', 'medication_supply', 'ngo_coordination', 'secure_messaging') NOT NULL,
  route_status ENUM('pending', 'offered', 'accepted', 'escalated', 'closed') NOT NULL DEFAULT 'pending',
  routed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  CONSTRAINT fk_routing_request
    FOREIGN KEY (request_id) REFERENCES aid_requests(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_routing_request (request_id),
  INDEX idx_routing_module_status (route_module, route_status)
);

CREATE TABLE IF NOT EXISTS route_assignments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  routing_id BIGINT UNSIGNED NOT NULL,
  organization_id BIGINT UNSIGNED NOT NULL,
  responder_id BIGINT UNSIGNED NULL,
  assignment_status ENUM('offered', 'accepted', 'rejected', 'expired') NOT NULL DEFAULT 'offered',
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP NULL,
  CONSTRAINT fk_assignments_routing
    FOREIGN KEY (routing_id) REFERENCES request_routing(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_assignments_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_assignments_responder
    FOREIGN KEY (responder_id) REFERENCES responders(id)
    ON DELETE SET NULL,
  INDEX idx_assignments_routing (routing_id),
  INDEX idx_assignments_status (assignment_status)
);

CREATE TABLE IF NOT EXISTS secure_conversations (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  conversation_status ENUM('open', 'in_progress', 'closed') NOT NULL DEFAULT 'open',
  opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  CONSTRAINT fk_conversations_request
    FOREIGN KEY (request_id) REFERENCES aid_requests(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_conversation_request (request_id),
  INDEX idx_conversations_status (conversation_status)
);

CREATE TABLE IF NOT EXISTS secure_messages (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  conversation_id BIGINT UNSIGNED NOT NULL,
  sender_kind ENUM('user', 'responder', 'system') NOT NULL,
  sender_user_id CHAR(36) NULL,
  sender_responder_id BIGINT UNSIGNED NULL,
  message_text TEXT NOT NULL,
  encrypted_payload MEDIUMTEXT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES secure_conversations(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender_user
    FOREIGN KEY (sender_user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_messages_sender_responder
    FOREIGN KEY (sender_responder_id) REFERENCES responders(id)
    ON DELETE SET NULL,
  INDEX idx_messages_conversation_time (conversation_id, sent_at),
  INDEX idx_messages_unread (conversation_id, is_read)
);

CREATE TABLE IF NOT EXISTS medication_catalog (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(180) NOT NULL,
  generic_name VARCHAR(180) NULL,
  strength VARCHAR(60) NULL,
  form VARCHAR(60) NULL,
  UNIQUE KEY uq_medication_name (name)
);

CREATE TABLE IF NOT EXISTS medication_inventory (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NOT NULL,
  medication_id BIGINT UNSIGNED NOT NULL,
  available_units INT NOT NULL DEFAULT 0,
  stock_status ENUM('in_stock', 'low_stock', 'out_of_stock') NOT NULL DEFAULT 'in_stock',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inventory_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_inventory_medication
    FOREIGN KEY (medication_id) REFERENCES medication_catalog(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_inventory_org_medication (organization_id, medication_id),
  INDEX idx_inventory_stock (stock_status)
);

CREATE TABLE IF NOT EXISTS case_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  event_data JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_events_request
    FOREIGN KEY (request_id) REFERENCES aid_requests(id)
    ON DELETE CASCADE,
  INDEX idx_events_request_time (request_id, created_at),
  INDEX idx_events_type (event_type)
);

CREATE OR REPLACE VIEW v_crisis_intelligence AS
SELECT
  DATE(ar.created_at) AS event_date,
  tr.category,
  tr.priority_level,
  rr.route_module,
  COUNT(*) AS request_count
FROM aid_requests ar
LEFT JOIN triage_results tr ON tr.request_id = ar.id
LEFT JOIN request_routing rr ON rr.request_id = ar.id
GROUP BY DATE(ar.created_at), tr.category, tr.priority_level, rr.route_module;

DELIMITER $$

CREATE PROCEDURE sp_submit_aid_request (
  IN p_public_id CHAR(26),
  IN p_user_id CHAR(36),
  IN p_entry_action VARCHAR(16),
  IN p_description TEXT,
  IN p_urgency VARCHAR(16)
)
BEGIN
  INSERT INTO aid_requests (public_id, user_id, entry_action, description, urgency_level)
  VALUES (p_public_id, p_user_id, p_entry_action, p_description, p_urgency);
END$$

DELIMITER ;
