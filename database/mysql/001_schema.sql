-- AidLine MySQL Schema (Location-Free Request Routing Architecture)
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS aidline
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE aidline;

CREATE TABLE IF NOT EXISTS organizations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_type ENUM('healthcare', 'pharmacy', 'ngo', 'government') NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  contact_email VARCHAR(320) NULL,
  contact_phone VARCHAR(50) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_organizations_type_active (organization_type, is_active)
);

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL,
  display_name VARCHAR(255) NULL,
  role ENUM('requester', 'responder', 'admin') NOT NULL DEFAULT 'requester',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_users_role_active (role, is_active)
);

CREATE TABLE IF NOT EXISTS provider_accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NOT NULL,
  provider_type ENUM('healthcare', 'pharmacy', 'ngo', 'coordination') NOT NULL,
  responder_user_id CHAR(36) NULL,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  max_concurrent_cases INT UNSIGNED NOT NULL DEFAULT 10,
  active_cases INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_provider_accounts_organization
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_provider_accounts_user
    FOREIGN KEY (responder_user_id) REFERENCES users(id),
  KEY idx_provider_accounts_type_availability (provider_type, is_available),
  KEY idx_provider_accounts_org_type (organization_id, provider_type)
);

CREATE TABLE IF NOT EXISTS aid_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  requester_user_id CHAR(36) NOT NULL,
  request_channel ENUM('sos', 'healthcare', 'medication', 'ngo', 'secure_message') NOT NULL,
  request_category ENUM('medical_emergency', 'medication_need', 'humanitarian_aid', 'general_inquiry') NOT NULL,
  urgency_level ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  responder_type_needed ENUM('healthcare', 'pharmacy', 'ngo', 'mixed') NOT NULL DEFAULT 'ngo',
  short_description VARCHAR(500) NOT NULL,
  request_details MEDIUMTEXT NULL,
  attachment_manifest JSON NULL,
  triage_status ENUM('pending', 'classified', 'routed', 'accepted', 'in_progress', 'resolved', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_aid_requests_user
    FOREIGN KEY (requester_user_id) REFERENCES users(id),
  KEY idx_aid_requests_triage_queue (triage_status, urgency_level, created_at),
  KEY idx_aid_requests_category_priority (request_category, urgency_level),
  KEY idx_aid_requests_requester (requester_user_id, created_at)
);

CREATE TABLE IF NOT EXISTS request_triage_results (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  classifier_version VARCHAR(50) NOT NULL,
  predicted_category ENUM('medical_emergency', 'medication_need', 'humanitarian_aid', 'general_inquiry') NOT NULL,
  predicted_priority ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  predicted_responder_type ENUM('healthcare', 'pharmacy', 'ngo', 'mixed') NOT NULL,
  confidence_score DECIMAL(5,4) NULL,
  triage_notes TEXT NULL,
  processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_request_triage_results_request
    FOREIGN KEY (request_id) REFERENCES aid_requests(id) ON DELETE CASCADE,
  UNIQUE KEY uk_request_triage_results_request (request_id),
  KEY idx_request_triage_results_category_priority (predicted_category, predicted_priority)
);

CREATE TABLE IF NOT EXISTS request_routes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  routed_provider_account_id BIGINT UNSIGNED NOT NULL,
  routed_network ENUM('healthcare', 'medication', 'ngo') NOT NULL,
  route_status ENUM('queued', 'delivered', 'accepted', 'declined', 'escalated', 'completed') NOT NULL DEFAULT 'queued',
  escalation_reason VARCHAR(500) NULL,
  routed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_request_routes_request
    FOREIGN KEY (request_id) REFERENCES aid_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_request_routes_provider
    FOREIGN KEY (routed_provider_account_id) REFERENCES provider_accounts(id),
  KEY idx_request_routes_status (route_status, routed_at),
  KEY idx_request_routes_provider_status (routed_provider_account_id, route_status),
  KEY idx_request_routes_request (request_id, route_status)
);

CREATE TABLE IF NOT EXISTS secure_conversations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  requester_user_id CHAR(36) NOT NULL,
  provider_account_id BIGINT UNSIGNED NOT NULL,
  conversation_status ENUM('open', 'in_progress', 'closed') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_secure_conversations_request
    FOREIGN KEY (request_id) REFERENCES aid_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_secure_conversations_requester
    FOREIGN KEY (requester_user_id) REFERENCES users(id),
  CONSTRAINT fk_secure_conversations_provider
    FOREIGN KEY (provider_account_id) REFERENCES provider_accounts(id),
  UNIQUE KEY uk_secure_conversations_request_provider (request_id, provider_account_id),
  KEY idx_secure_conversations_status_updated (conversation_status, updated_at)
);

CREATE TABLE IF NOT EXISTS secure_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  conversation_id BIGINT UNSIGNED NOT NULL,
  sender_actor ENUM('requester', 'provider', 'system') NOT NULL,
  sender_user_id CHAR(36) NULL,
  encrypted_body MEDIUMTEXT NOT NULL,
  attachment_manifest JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_secure_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES secure_conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_secure_messages_sender_user
    FOREIGN KEY (sender_user_id) REFERENCES users(id),
  KEY idx_secure_messages_conversation_created (conversation_id, created_at)
);

CREATE TABLE IF NOT EXISTS medication_responses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_route_id BIGINT UNSIGNED NOT NULL,
  medication_name VARCHAR(255) NOT NULL,
  availability_status ENUM('available', 'unavailable', 'alternative_offered', 'reserved') NOT NULL,
  alternative_medication VARCHAR(255) NULL,
  reservation_reference VARCHAR(120) NULL,
  pickup_instructions TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_medication_responses_route
    FOREIGN KEY (request_route_id) REFERENCES request_routes(id) ON DELETE CASCADE,
  KEY idx_medication_responses_status_created (availability_status, created_at),
  KEY idx_medication_responses_name_status (medication_name, availability_status)
);

CREATE TABLE IF NOT EXISTS healthcare_interactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_route_id BIGINT UNSIGNED NOT NULL,
  interaction_type ENUM('info_request', 'teleconsultation', 'appointment', 'care_instruction') NOT NULL,
  notes TEXT NULL,
  interaction_payload JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_healthcare_interactions_route
    FOREIGN KEY (request_route_id) REFERENCES request_routes(id) ON DELETE CASCADE,
  KEY idx_healthcare_interactions_type_created (interaction_type, created_at)
);

CREATE TABLE IF NOT EXISTS ngo_case_actions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_route_id BIGINT UNSIGNED NOT NULL,
  action_type ENUM('evaluation', 'accepted', 'coordination', 'delivery', 'follow_up') NOT NULL,
  action_details JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ngo_case_actions_route
    FOREIGN KEY (request_route_id) REFERENCES request_routes(id) ON DELETE CASCADE,
  KEY idx_ngo_case_actions_type_created (action_type, created_at)
);

CREATE TABLE IF NOT EXISTS request_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  event_payload JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_request_events_request
    FOREIGN KEY (request_id) REFERENCES aid_requests(id) ON DELETE CASCADE,
  KEY idx_request_events_request_created (request_id, created_at),
  KEY idx_request_events_type_created (event_type, created_at)
);
