CREATE DATABASE IF NOT EXISTS aidline
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE aidline;

-- No geospatial columns are used in this schema.
-- AidLine routes requests by category, urgency, and responder capability.

CREATE TABLE IF NOT EXISTS aidline_users (
  user_ref CHAR(36) NOT NULL,
  anonymous_label VARCHAR(64) NULL,
  preferred_language ENUM('ar', 'en') NOT NULL DEFAULT 'en',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_ref)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS service_providers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_code VARCHAR(48) NOT NULL,
  name VARCHAR(255) NOT NULL,
  provider_type ENUM(
    'healthcare_provider',
    'pharmacy_partner',
    'ngo_coordinator',
    'support_agent'
  ) NOT NULL,
  organization_name VARCHAR(255) NULL,
  secure_channel_reference VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_service_providers_code (provider_code),
  KEY idx_service_providers_type_active (provider_type, is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS provider_service_modules (
  provider_id BIGINT UNSIGNED NOT NULL,
  routing_module ENUM(
    'healthcare_network',
    'medication_supply',
    'ngo_coordination',
    'secure_messaging'
  ) NOT NULL,
  capability_label VARCHAR(128) NULL,
  accepts_critical_cases TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (provider_id, routing_module),
  CONSTRAINT fk_provider_service_modules_provider
    FOREIGN KEY (provider_id) REFERENCES service_providers (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS service_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_request_id CHAR(36) NOT NULL,
  user_ref CHAR(36) NOT NULL,
  request_type ENUM(
    'sos',
    'healthcare',
    'medication',
    'humanitarian',
    'general_inquiry'
  ) NOT NULL,
  assistance_category ENUM(
    'medical_emergency',
    'healthcare_service',
    'medication_need',
    'humanitarian_aid',
    'general_inquiry'
  ) NOT NULL,
  priority_level ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  routing_module ENUM(
    'healthcare_network',
    'medication_supply',
    'ngo_coordination',
    'secure_messaging'
  ) NOT NULL,
  routing_status ENUM(
    'queued',
    'triaged',
    'routed',
    'accepted',
    'resolved',
    'escalated',
    'cancelled'
  ) NOT NULL DEFAULT 'triaged',
  required_responder ENUM(
    'healthcare_provider',
    'pharmacy_partner',
    'ngo_coordinator',
    'support_agent'
  ) NOT NULL,
  title VARCHAR(255) NULL,
  description TEXT NULL,
  medication_name VARCHAR(255) NULL,
  escalation_target ENUM(
    'healthcare_network',
    'medication_supply',
    'ngo_coordination',
    'secure_messaging'
  ) NULL,
  classification_summary VARCHAR(500) NULL,
  triage_reason VARCHAR(500) NULL,
  attachments_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  accepted_at DATETIME NULL,
  resolved_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_service_requests_public_id (public_request_id),
  KEY idx_service_requests_queue (
    routing_module,
    routing_status,
    priority_level,
    created_at
  ),
  KEY idx_service_requests_user (user_ref, created_at),
  CONSTRAINT fk_service_requests_user
    FOREIGN KEY (user_ref) REFERENCES aidline_users (user_ref)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS request_assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  provider_id BIGINT UNSIGNED NOT NULL,
  assignment_status ENUM(
    'offered',
    'accepted',
    'declined',
    'handover',
    'completed'
  ) NOT NULL DEFAULT 'offered',
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME NULL,
  resolution_notes TEXT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_request_assignment (request_id, provider_id),
  KEY idx_request_assignments_status (assignment_status, assigned_at),
  CONSTRAINT fk_request_assignments_request
    FOREIGN KEY (request_id) REFERENCES service_requests (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_request_assignments_provider
    FOREIGN KEY (provider_id) REFERENCES service_providers (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS request_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  sender_type ENUM('user', 'provider', 'system') NOT NULL,
  sender_reference VARCHAR(64) NULL,
  message_body TEXT NOT NULL,
  is_encrypted TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_request_messages_request (request_id, created_at),
  CONSTRAINT fk_request_messages_request
    FOREIGN KEY (request_id) REFERENCES service_requests (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS request_attachments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  attachment_kind ENUM('image', 'document') NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  storage_reference VARCHAR(255) NOT NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_request_attachments_request (request_id),
  CONSTRAINT fk_request_attachments_request
    FOREIGN KEY (request_id) REFERENCES service_requests (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS medication_inventory (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_id BIGINT UNSIGNED NOT NULL,
  medication_name VARCHAR(255) NOT NULL,
  stock_status ENUM('available', 'limited', 'unavailable', 'reserved') NOT NULL DEFAULT 'unavailable',
  alternative_medication VARCHAR(255) NULL,
  notes TEXT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_medication_inventory_lookup (medication_name, stock_status),
  CONSTRAINT fk_medication_inventory_provider
    FOREIGN KEY (provider_id) REFERENCES service_providers (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS routing_audit_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  action_type ENUM(
    'triaged',
    'routed',
    'accepted',
    'escalated',
    'resolved',
    'cancelled',
    'message_sent'
  ) NOT NULL,
  action_summary VARCHAR(255) NOT NULL,
  actor_type ENUM('system', 'user', 'provider', 'administrator') NOT NULL DEFAULT 'system',
  actor_reference VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_routing_audit_request (request_id, created_at),
  CONSTRAINT fk_routing_audit_request
    FOREIGN KEY (request_id) REFERENCES service_requests (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS crisis_intelligence_daily (
  summary_date DATE NOT NULL,
  assistance_category ENUM(
    'medical_emergency',
    'healthcare_service',
    'medication_need',
    'humanitarian_aid',
    'general_inquiry'
  ) NOT NULL,
  routing_module ENUM(
    'healthcare_network',
    'medication_supply',
    'ngo_coordination',
    'secure_messaging'
  ) NOT NULL,
  total_requests INT UNSIGNED NOT NULL DEFAULT 0,
  critical_requests INT UNSIGNED NOT NULL DEFAULT 0,
  escalated_requests INT UNSIGNED NOT NULL DEFAULT 0,
  resolved_requests INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (summary_date, assistance_category, routing_module)
) ENGINE=InnoDB;

CREATE OR REPLACE VIEW institutional_request_dashboard AS
SELECT
  routing_module,
  assistance_category,
  COUNT(*) AS total_requests,
  SUM(priority_level = 'critical') AS critical_requests,
  SUM(routing_status IN ('queued', 'triaged', 'routed', 'accepted', 'escalated')) AS active_requests,
  SUM(routing_status = 'escalated') AS escalated_requests
FROM service_requests
GROUP BY routing_module, assistance_category;

CREATE OR REPLACE VIEW medication_shortage_overview AS
SELECT
  medication_name,
  SUM(stock_status = 'available') AS providers_with_stock,
  SUM(stock_status = 'limited') AS providers_limited_stock,
  SUM(stock_status = 'unavailable') AS providers_without_stock
FROM medication_inventory
GROUP BY medication_name;
