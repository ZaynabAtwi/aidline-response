CREATE DATABASE IF NOT EXISTS aidline
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE aidline;

CREATE TABLE IF NOT EXISTS app_users (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  external_auth_id VARCHAR(191) NULL,
  anonymous_label VARCHAR(32) NULL,
  preferred_language VARCHAR(8) NOT NULL DEFAULT 'en',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_app_users_external_auth_id (external_auth_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS organizations (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  organization_type ENUM('healthcare_provider', 'pharmacy', 'ngo', 'government_agency') NOT NULL,
  name VARCHAR(191) NOT NULL,
  secure_contact_channel VARCHAR(191) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS service_networks (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  network_key ENUM(
    'healthcare_network',
    'medication_supply',
    'ngo_coordination',
    'secure_communication'
  ) NOT NULL,
  name VARCHAR(191) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_service_networks_key (network_key)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS service_providers (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  organization_id CHAR(36) NULL,
  provider_type ENUM('healthcare_provider', 'pharmacy', 'ngo', 'volunteer_team') NOT NULL,
  name VARCHAR(191) NOT NULL,
  phone VARCHAR(64) NULL,
  secure_channel_address VARCHAR(191) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  accepts_attachments TINYINT(1) NOT NULL DEFAULT 1,
  capabilities JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_service_providers_org (organization_id),
  KEY idx_service_providers_type_active (provider_type, is_active),
  CONSTRAINT fk_service_providers_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS provider_services (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  provider_id CHAR(36) NOT NULL,
  network_id CHAR(36) NOT NULL,
  category ENUM(
    'medical_emergency',
    'medication_need',
    'humanitarian_aid',
    'general_inquiry'
  ) NOT NULL,
  is_enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_provider_services (provider_id, network_id, category),
  KEY idx_provider_services_network (network_id, category, is_enabled),
  CONSTRAINT fk_provider_services_provider
    FOREIGN KEY (provider_id) REFERENCES service_providers(id),
  CONSTRAINT fk_provider_services_network
    FOREIGN KEY (network_id) REFERENCES service_networks(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS aid_requests (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  requester_id CHAR(36) NOT NULL,
  case_reference VARCHAR(32) NOT NULL,
  entry_point ENUM('sos', 'medication', 'support', 'shelter') NOT NULL,
  category ENUM(
    'medical_emergency',
    'medication_need',
    'humanitarian_aid',
    'general_inquiry'
  ) NOT NULL,
  priority_level ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  routing_module ENUM(
    'healthcare_network',
    'medication_supply',
    'ngo_coordination',
    'secure_communication'
  ) NOT NULL,
  title VARCHAR(191) NULL,
  description TEXT NULL,
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
  current_provider_id CHAR(36) NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  UNIQUE KEY uq_aid_requests_case_reference (case_reference),
  KEY idx_aid_requests_requester (requester_id, created_at),
  KEY idx_aid_requests_queue (status, priority_level, category, created_at),
  KEY idx_aid_requests_provider (current_provider_id),
  CONSTRAINT fk_aid_requests_requester
    FOREIGN KEY (requester_id) REFERENCES app_users(id),
  CONSTRAINT fk_aid_requests_provider
    FOREIGN KEY (current_provider_id) REFERENCES service_providers(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS request_attachments (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  request_id CHAR(36) NOT NULL,
  attachment_type ENUM('image', 'document', 'audio', 'other') NOT NULL DEFAULT 'document',
  storage_url VARCHAR(512) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  content_type VARCHAR(128) NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_request_attachments_request (request_id),
  CONSTRAINT fk_request_attachments_request
    FOREIGN KEY (request_id) REFERENCES aid_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS request_triage_events (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  request_id CHAR(36) NOT NULL,
  classifier_version VARCHAR(64) NOT NULL,
  predicted_category ENUM(
    'medical_emergency',
    'medication_need',
    'humanitarian_aid',
    'general_inquiry'
  ) NOT NULL,
  predicted_priority ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  target_network_key ENUM(
    'healthcare_network',
    'medication_supply',
    'ngo_coordination',
    'secure_communication'
  ) NOT NULL,
  confidence DECIMAL(5,4) NULL,
  triage_reason TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_request_triage_request (request_id, created_at),
  CONSTRAINT fk_request_triage_request
    FOREIGN KEY (request_id) REFERENCES aid_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS routing_events (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  request_id CHAR(36) NOT NULL,
  network_id CHAR(36) NOT NULL,
  provider_id CHAR(36) NULL,
  route_status ENUM('queued', 'offered', 'accepted', 'rejected', 'escalated', 'closed') NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_routing_events_request (request_id, created_at),
  KEY idx_routing_events_provider (provider_id, route_status),
  CONSTRAINT fk_routing_events_request
    FOREIGN KEY (request_id) REFERENCES aid_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_routing_events_network
    FOREIGN KEY (network_id) REFERENCES service_networks(id),
  CONSTRAINT fk_routing_events_provider
    FOREIGN KEY (provider_id) REFERENCES service_providers(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS responder_assignments (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  request_id CHAR(36) NOT NULL,
  provider_id CHAR(36) NOT NULL,
  accepted_by_user_id CHAR(36) NULL,
  assignment_status ENUM('pending', 'accepted', 'declined', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  instructions TEXT NULL,
  accepted_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_responder_assignments_request (request_id, assignment_status),
  KEY idx_responder_assignments_provider (provider_id, assignment_status),
  CONSTRAINT fk_responder_assignments_request
    FOREIGN KEY (request_id) REFERENCES aid_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_responder_assignments_provider
    FOREIGN KEY (provider_id) REFERENCES service_providers(id),
  CONSTRAINT fk_responder_assignments_user
    FOREIGN KEY (accepted_by_user_id) REFERENCES app_users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS medication_catalog (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(191) NOT NULL,
  form_factor VARCHAR(64) NULL,
  strength VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_medication_catalog_name_form_strength (name, form_factor, strength)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS provider_medication_inventory (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  provider_id CHAR(36) NOT NULL,
  medication_id CHAR(36) NOT NULL,
  stock_status ENUM('in_stock', 'limited', 'out_of_stock', 'reserved') NOT NULL DEFAULT 'in_stock',
  quantity_available INT NULL,
  last_verified_at TIMESTAMP NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_provider_medication_inventory (provider_id, medication_id),
  KEY idx_provider_inventory_stock (stock_status, last_verified_at),
  CONSTRAINT fk_provider_inventory_provider
    FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE CASCADE,
  CONSTRAINT fk_provider_inventory_medication
    FOREIGN KEY (medication_id) REFERENCES medication_catalog(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS secure_conversations (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  request_id CHAR(36) NOT NULL,
  requester_id CHAR(36) NOT NULL,
  provider_id CHAR(36) NULL,
  status ENUM('open', 'in_progress', 'closed') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_secure_conversations_request (request_id),
  KEY idx_secure_conversations_provider (provider_id, status),
  CONSTRAINT fk_secure_conversations_request
    FOREIGN KEY (request_id) REFERENCES aid_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_secure_conversations_requester
    FOREIGN KEY (requester_id) REFERENCES app_users(id),
  CONSTRAINT fk_secure_conversations_provider
    FOREIGN KEY (provider_id) REFERENCES service_providers(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS secure_messages (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  conversation_id CHAR(36) NOT NULL,
  sender_type ENUM('user', 'provider', 'ngo_admin', 'system') NOT NULL,
  sender_user_id CHAR(36) NULL,
  message_type ENUM('text', 'document', 'instruction') NOT NULL DEFAULT 'text',
  body TEXT NOT NULL,
  attachment_url VARCHAR(512) NULL,
  is_encrypted TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_secure_messages_conversation (conversation_id, created_at),
  CONSTRAINT fk_secure_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES secure_conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_secure_messages_sender
    FOREIGN KEY (sender_user_id) REFERENCES app_users(id)
) ENGINE=InnoDB;

INSERT INTO service_networks (network_key, name, description)
VALUES
  ('healthcare_network', 'Healthcare Network Module', 'Routes medical emergencies, consultations, and clinical care requests.'),
  ('medication_supply', 'Medication Supply Module', 'Routes medication requests to pharmacies and medical aid providers.'),
  ('ngo_coordination', 'NGO Coordination Module', 'Routes humanitarian, shelter, and assistance cases to NGOs.'),
  ('secure_communication', 'Secure Communication Layer', 'Provides follow-up, clarification, and case messaging.')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);

CREATE OR REPLACE VIEW v_request_volume_by_category AS
SELECT
  DATE(created_at) AS metric_date,
  category,
  priority_level,
  COUNT(*) AS request_count,
  SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved_count,
  SUM(CASE WHEN status = 'escalated' THEN 1 ELSE 0 END) AS escalated_count
FROM aid_requests
GROUP BY DATE(created_at), category, priority_level;

CREATE OR REPLACE VIEW v_provider_workload AS
SELECT
  sp.id AS provider_id,
  sp.name AS provider_name,
  sp.provider_type,
  COUNT(ra.id) AS total_assignments,
  SUM(CASE WHEN ra.assignment_status IN ('pending', 'accepted') THEN 1 ELSE 0 END) AS open_assignments,
  SUM(CASE WHEN ra.assignment_status = 'completed' THEN 1 ELSE 0 END) AS completed_assignments
FROM service_providers sp
LEFT JOIN responder_assignments ra ON ra.provider_id = sp.id
GROUP BY sp.id, sp.name, sp.provider_type;

CREATE OR REPLACE VIEW v_medication_shortages AS
SELECT
  sp.id AS provider_id,
  sp.name AS provider_name,
  mc.name AS medication_name,
  pmi.stock_status,
  pmi.quantity_available,
  pmi.last_verified_at
FROM provider_medication_inventory pmi
INNER JOIN service_providers sp ON sp.id = pmi.provider_id
INNER JOIN medication_catalog mc ON mc.id = pmi.medication_id
WHERE pmi.stock_status IN ('limited', 'out_of_stock');
