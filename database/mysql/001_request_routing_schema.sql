-- AidLine MySQL 8 schema
-- Request routing and crisis coordination model without location data

CREATE DATABASE IF NOT EXISTS aidline
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE aidline;

-- Anonymous users and lightweight profiles
CREATE TABLE anonymous_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) NOT NULL,
  preferred_language VARCHAR(16) NOT NULL DEFAULT 'en',
  communication_opt_in TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_anonymous_users_public_id (public_id)
) ENGINE=InnoDB;

CREATE TABLE user_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  anonymous_user_id BIGINT UNSIGNED NOT NULL,
  display_name VARCHAR(120) NULL,
  phone_number VARCHAR(40) NULL,
  avatar_url VARCHAR(255) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_profiles_user (anonymous_user_id),
  CONSTRAINT fk_user_profiles_user
    FOREIGN KEY (anonymous_user_id) REFERENCES anonymous_users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- Organizations, service networks, and responders
CREATE TABLE organizations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_type ENUM('healthcare', 'pharmacy', 'ngo', 'government', 'support') NOT NULL,
  name VARCHAR(160) NOT NULL,
  contact_email VARCHAR(160) NULL,
  contact_phone VARCHAR(40) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE service_networks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  network_type ENUM('healthcare', 'medication', 'ngo', 'government', 'support') NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  escalation_network_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_service_networks_escalation
    FOREIGN KEY (escalation_network_id) REFERENCES service_networks(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE organization_network_memberships (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NOT NULL,
  service_network_id BIGINT UNSIGNED NOT NULL,
  role_in_network VARCHAR(80) NULL,
  is_accepting_requests TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_org_network_membership (organization_id, service_network_id),
  KEY idx_org_network_membership_network (service_network_id),
  CONSTRAINT fk_org_network_membership_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_org_network_membership_network
    FOREIGN KEY (service_network_id) REFERENCES service_networks(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE responders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NOT NULL,
  responder_role ENUM('healthcare_provider', 'pharmacist', 'ngo_caseworker', 'support_agent', 'coordinator', 'government_operator') NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  secure_handle VARCHAR(120) NOT NULL,
  availability_status ENUM('available', 'busy', 'offline', 'on_call') NOT NULL DEFAULT 'available',
  skills JSON NULL,
  last_active_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_responders_handle (secure_handle),
  KEY idx_responders_org_role (organization_id, responder_role),
  CONSTRAINT fk_responders_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- Central request records
CREATE TABLE service_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) NOT NULL,
  anonymous_user_id BIGINT UNSIGNED NOT NULL,
  entry_channel ENUM('sos', 'healthcare_search', 'medication', 'ngo_contact', 'secure_message') NOT NULL,
  request_category ENUM('medical_emergency', 'medication_need', 'humanitarian_aid', 'general_inquiry') NOT NULL,
  urgency_level ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  priority_score SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  required_responder_type ENUM('healthcare_provider', 'pharmacist', 'ngo_caseworker', 'support_agent', 'mixed') NOT NULL DEFAULT 'support_agent',
  current_status ENUM('submitted', 'classified', 'routed', 'accepted', 'in_progress', 'resolved', 'escalated', 'closed', 'cancelled') NOT NULL DEFAULT 'submitted',
  subject VARCHAR(160) NULL,
  issue_description TEXT NOT NULL,
  attachments_expected TINYINT(1) NOT NULL DEFAULT 0,
  assigned_network_id BIGINT UNSIGNED NULL,
  assigned_organization_id BIGINT UNSIGNED NULL,
  accepted_by_responder_id BIGINT UNSIGNED NULL,
  accepted_at DATETIME NULL,
  resolved_at DATETIME NULL,
  closed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_service_requests_public_id (public_id),
  KEY idx_service_requests_user (anonymous_user_id),
  KEY idx_service_requests_queue (request_category, urgency_level, current_status),
  KEY idx_service_requests_network (assigned_network_id, assigned_organization_id),
  CONSTRAINT fk_service_requests_user
    FOREIGN KEY (anonymous_user_id) REFERENCES anonymous_users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_service_requests_network
    FOREIGN KEY (assigned_network_id) REFERENCES service_networks(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_service_requests_org
    FOREIGN KEY (assigned_organization_id) REFERENCES organizations(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_service_requests_responder
    FOREIGN KEY (accepted_by_responder_id) REFERENCES responders(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE request_attachments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  uploaded_by_user TINYINT(1) NOT NULL DEFAULT 1,
  storage_provider VARCHAR(60) NOT NULL,
  storage_key VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  file_size_bytes BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_request_attachments_request (request_id),
  CONSTRAINT fk_request_attachments_request
    FOREIGN KEY (request_id) REFERENCES service_requests(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE triage_assessments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  triage_source ENUM('ai', 'manual') NOT NULL DEFAULT 'ai',
  predicted_category ENUM('medical_emergency', 'medication_need', 'humanitarian_aid', 'general_inquiry') NOT NULL,
  predicted_urgency ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  required_responder_type ENUM('healthcare_provider', 'pharmacist', 'ngo_caseworker', 'support_agent', 'mixed') NOT NULL,
  confidence DECIMAL(5,4) NULL,
  triage_summary TEXT NULL,
  created_by_responder_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_triage_assessments_request (request_id),
  CONSTRAINT fk_triage_assessments_request
    FOREIGN KEY (request_id) REFERENCES service_requests(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_triage_assessments_responder
    FOREIGN KEY (created_by_responder_id) REFERENCES responders(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE request_routes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  service_network_id BIGINT UNSIGNED NOT NULL,
  target_organization_id BIGINT UNSIGNED NULL,
  accepted_by_responder_id BIGINT UNSIGNED NULL,
  route_status ENUM('pending', 'delivered', 'accepted', 'rejected', 'expired', 'escalated') NOT NULL DEFAULT 'pending',
  route_reason VARCHAR(255) NULL,
  routed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_request_routes_request (request_id),
  KEY idx_request_routes_status (route_status, routed_at),
  CONSTRAINT fk_request_routes_request
    FOREIGN KEY (request_id) REFERENCES service_requests(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_request_routes_network
    FOREIGN KEY (service_network_id) REFERENCES service_networks(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_request_routes_org
    FOREIGN KEY (target_organization_id) REFERENCES organizations(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_request_routes_responder
    FOREIGN KEY (accepted_by_responder_id) REFERENCES responders(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

-- Medication workflow
CREATE TABLE medication_request_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  medication_name VARCHAR(160) NOT NULL,
  formulation VARCHAR(120) NULL,
  dosage_instructions VARCHAR(120) NULL,
  quantity_requested INT UNSIGNED NOT NULL DEFAULT 1,
  alternative_allowed TINYINT(1) NOT NULL DEFAULT 0,
  supply_status ENUM('requested', 'available', 'reserved', 'partially_available', 'unavailable', 'fulfilled', 'escalated') NOT NULL DEFAULT 'requested',
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_medication_request_items_request (request_id),
  CONSTRAINT fk_medication_request_items_request
    FOREIGN KEY (request_id) REFERENCES service_requests(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE pharmacy_inventory (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NOT NULL,
  medication_name VARCHAR(160) NOT NULL,
  formulation VARCHAR(120) NULL,
  stock_status ENUM('in_stock', 'limited', 'out_of_stock', 'unknown') NOT NULL DEFAULT 'unknown',
  quantity_available INT UNSIGNED NOT NULL DEFAULT 0,
  unit_label VARCHAR(40) NULL,
  last_confirmed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pharmacy_inventory_item (organization_id, medication_name, formulation),
  KEY idx_pharmacy_inventory_status (stock_status),
  CONSTRAINT fk_pharmacy_inventory_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE medication_reservations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  medication_request_item_id BIGINT UNSIGNED NOT NULL,
  inventory_id BIGINT UNSIGNED NOT NULL,
  reserved_quantity INT UNSIGNED NOT NULL DEFAULT 1,
  reservation_status ENUM('reserved', 'released', 'dispensed', 'expired') NOT NULL DEFAULT 'reserved',
  instructions TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_medication_reservations_item (medication_request_item_id),
  CONSTRAINT fk_medication_reservations_item
    FOREIGN KEY (medication_request_item_id) REFERENCES medication_request_items(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_medication_reservations_inventory
    FOREIGN KEY (inventory_id) REFERENCES pharmacy_inventory(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- Secure communication
CREATE TABLE secure_conversations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  conversation_status ENUM('open', 'in_progress', 'closed') NOT NULL DEFAULT 'open',
  initiated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_secure_conversations_request (request_id),
  CONSTRAINT fk_secure_conversations_request
    FOREIGN KEY (request_id) REFERENCES service_requests(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE secure_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  conversation_id BIGINT UNSIGNED NOT NULL,
  sender_type ENUM('user', 'responder', 'system') NOT NULL,
  responder_id BIGINT UNSIGNED NULL,
  attachment_id BIGINT UNSIGNED NULL,
  message_body LONGTEXT NOT NULL,
  is_encrypted TINYINT(1) NOT NULL DEFAULT 1,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_secure_messages_conversation (conversation_id, created_at),
  CONSTRAINT fk_secure_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES secure_conversations(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_secure_messages_responder
    FOREIGN KEY (responder_id) REFERENCES responders(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_secure_messages_attachment
    FOREIGN KEY (attachment_id) REFERENCES request_attachments(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

-- Auditable case history
CREATE TABLE case_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  actor_type ENUM('user', 'responder', 'system') NOT NULL,
  responder_id BIGINT UNSIGNED NULL,
  event_type ENUM('created', 'triaged', 'routed', 'accepted', 'message_sent', 'inventory_confirmed', 'reservation_created', 'escalated', 'resolved', 'closed', 'cancelled') NOT NULL,
  event_summary VARCHAR(255) NOT NULL,
  event_payload JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_case_events_request (request_id, created_at),
  CONSTRAINT fk_case_events_request
    FOREIGN KEY (request_id) REFERENCES service_requests(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_case_events_responder
    FOREIGN KEY (responder_id) REFERENCES responders(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

-- Aggregated intelligence for dashboards and institutional reporting
CREATE OR REPLACE VIEW vw_request_volume_by_category AS
SELECT
  request_category,
  urgency_level,
  COUNT(*) AS total_requests,
  SUM(CASE WHEN current_status IN ('resolved', 'closed') THEN 1 ELSE 0 END) AS resolved_requests,
  SUM(CASE WHEN current_status IN ('submitted', 'classified', 'routed', 'accepted', 'in_progress', 'escalated') THEN 1 ELSE 0 END) AS active_requests
FROM service_requests
GROUP BY request_category, urgency_level;

CREATE OR REPLACE VIEW vw_medication_shortages AS
SELECT
  m.medication_name,
  COUNT(*) AS affected_requests,
  SUM(CASE WHEN m.supply_status IN ('unavailable', 'escalated') THEN 1 ELSE 0 END) AS critical_shortages,
  MAX(sr.updated_at) AS last_activity_at
FROM medication_request_items m
JOIN service_requests sr ON sr.id = m.request_id
GROUP BY m.medication_name;

CREATE OR REPLACE VIEW vw_crisis_dashboard AS
SELECT
  DATE(created_at) AS report_date,
  COUNT(*) AS total_requests,
  SUM(CASE WHEN request_category = 'medical_emergency' THEN 1 ELSE 0 END) AS medical_emergencies,
  SUM(CASE WHEN request_category = 'medication_need' THEN 1 ELSE 0 END) AS medication_needs,
  SUM(CASE WHEN request_category = 'humanitarian_aid' THEN 1 ELSE 0 END) AS humanitarian_requests,
  SUM(CASE WHEN current_status IN ('submitted', 'classified', 'routed', 'accepted', 'in_progress', 'escalated') THEN 1 ELSE 0 END) AS active_cases,
  SUM(CASE WHEN current_status IN ('resolved', 'closed') THEN 1 ELSE 0 END) AS resolved_cases
FROM service_requests
GROUP BY DATE(created_at);

-- Important note:
-- This schema intentionally excludes user location, coordinates, GPS traces, and proximity indexes.
-- Routing depends on triage decisions, service capability, responder availability, and case status.
