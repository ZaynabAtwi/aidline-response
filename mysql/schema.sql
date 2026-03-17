-- AidLine MySQL schema (no GPS/location tracking)
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS aidline
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE aidline;

CREATE TABLE IF NOT EXISTS aid_users (
  id CHAR(36) NOT NULL,
  anonymous_label VARCHAR(64) NOT NULL,
  preferred_language CHAR(2) NOT NULL DEFAULT 'en',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_aid_users_anonymous_label (anonymous_label)
);

CREATE TABLE IF NOT EXISTS organizations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_type ENUM(
    'healthcare_provider',
    'pharmacy',
    'ngo',
    'government_authority'
  ) NOT NULL,
  name VARCHAR(190) NOT NULL,
  contact_email VARCHAR(190) NULL,
  contact_phone VARCHAR(32) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_organizations_type_active (organization_type, is_active)
);

CREATE TABLE IF NOT EXISTS organization_capabilities (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NOT NULL,
  capability ENUM(
    'medical_consultation',
    'emergency_medical_assistance',
    'hospital_or_clinic_access',
    'medication_stock_confirmation',
    'humanitarian_case_support',
    'secure_case_messaging'
  ) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_org_capability (organization_id, capability),
  CONSTRAINT fk_org_capability_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS aid_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  request_type ENUM(
    'sos_emergency',
    'healthcare_service',
    'medication_availability',
    'ngo_support',
    'secure_message'
  ) NOT NULL,
  description TEXT NULL,
  urgency ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  source_channel ENUM('web', 'mobile', 'api') NOT NULL DEFAULT 'web',
  status ENUM(
    'submitted',
    'triaged',
    'routed',
    'accepted',
    'in_progress',
    'resolved',
    'cancelled',
    'escalated'
  ) NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_aid_requests_public_id (public_id),
  KEY idx_aid_requests_status_created (status, created_at),
  KEY idx_aid_requests_type_urgency (request_type, urgency),
  CONSTRAINT fk_aid_requests_user
    FOREIGN KEY (user_id) REFERENCES aid_users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS request_attachments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  storage_url VARCHAR(500) NOT NULL,
  checksum_sha256 CHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_request_attachments_request (request_id),
  CONSTRAINT fk_request_attachments_request
    FOREIGN KEY (request_id) REFERENCES aid_requests(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS triage_results (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  category ENUM(
    'medical_emergency',
    'medication_need',
    'humanitarian_aid',
    'general_inquiry'
  ) NOT NULL,
  priority ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  required_responder ENUM(
    'emergency_medical_team',
    'healthcare_provider',
    'pharmacy_team',
    'ngo_case_worker',
    'support_agent'
  ) NOT NULL,
  confidence_score DECIMAL(5,2) NULL,
  triage_notes TEXT NULL,
  triaged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_triage_results_request (request_id),
  KEY idx_triage_category_priority (category, priority),
  CONSTRAINT fk_triage_results_request
    FOREIGN KEY (request_id) REFERENCES aid_requests(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS request_routes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  routing_module ENUM(
    'healthcare_network',
    'medication_supply',
    'ngo_coordination',
    'secure_communication'
  ) NOT NULL,
  organization_id BIGINT UNSIGNED NULL,
  route_status ENUM('pending', 'accepted', 'declined', 'escalated', 'closed') NOT NULL DEFAULT 'pending',
  escalation_reason VARCHAR(255) NULL,
  routed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP NULL,
  closed_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_request_routes_request_status (request_id, route_status),
  KEY idx_request_routes_module_status (routing_module, route_status),
  CONSTRAINT fk_request_routes_request
    FOREIGN KEY (request_id) REFERENCES aid_requests(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_request_routes_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS secure_conversations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  status ENUM('open', 'in_progress', 'closed') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_secure_conversations_request (request_id),
  CONSTRAINT fk_secure_conversations_request
    FOREIGN KEY (request_id) REFERENCES aid_requests(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS secure_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  conversation_id BIGINT UNSIGNED NOT NULL,
  sender_type ENUM('user', 'organization', 'system') NOT NULL,
  sender_user_id CHAR(36) NULL,
  sender_organization_id BIGINT UNSIGNED NULL,
  message_type ENUM('text', 'document', 'instruction', 'follow_up') NOT NULL DEFAULT 'text',
  encrypted_body TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_secure_messages_conversation (conversation_id, created_at),
  KEY idx_secure_messages_read (conversation_id, is_read),
  CONSTRAINT fk_secure_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES secure_conversations(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_secure_messages_user
    FOREIGN KEY (sender_user_id) REFERENCES aid_users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_secure_messages_org
    FOREIGN KEY (sender_organization_id) REFERENCES organizations(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS request_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  event_payload JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_request_events_request_created (request_id, created_at),
  KEY idx_request_events_type_created (event_type, created_at),
  CONSTRAINT fk_request_events_request
    FOREIGN KEY (request_id) REFERENCES aid_requests(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_crisis_metrics (
  metric_date DATE NOT NULL,
  category ENUM(
    'medical_emergency',
    'medication_need',
    'humanitarian_aid',
    'general_inquiry'
  ) NOT NULL,
  urgency ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  request_count INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (metric_date, category, urgency)
);

CREATE OR REPLACE VIEW vw_open_request_workload AS
SELECT
  rr.routing_module,
  rr.route_status,
  COUNT(*) AS total_requests
FROM request_routes rr
JOIN aid_requests ar ON ar.id = rr.request_id
WHERE ar.status IN ('submitted', 'triaged', 'routed', 'accepted', 'in_progress', 'escalated')
GROUP BY rr.routing_module, rr.route_status;
