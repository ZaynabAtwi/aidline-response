-- AidLine MySQL Database Schema
-- Request-routing architecture without geolocation
-- Migration: 001_initial_schema

CREATE DATABASE IF NOT EXISTS aidline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aidline;

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUMS (simulated via CHECK constraints in MySQL 8+)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  email         VARCHAR(255) UNIQUE,
  phone         VARCHAR(50),
  full_name     VARCHAR(255),
  password_hash VARCHAR(255),
  preferred_language ENUM('ar', 'en') NOT NULL DEFAULT 'en',
  role          ENUM('displaced_user', 'volunteer', 'ngo_admin', 'healthcare_provider', 'pharmacy_staff', 'system_admin') NOT NULL DEFAULT 'displaced_user',
  is_anonymous  BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  supabase_uid  VARCHAR(36)  UNIQUE COMMENT 'Links to Supabase Auth UID',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- SERVICE PROVIDERS
-- Unified table for healthcare providers, pharmacies, and NGOs
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_providers (
  id              VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  name            VARCHAR(255) NOT NULL,
  type            ENUM('healthcare', 'pharmacy', 'ngo', 'government') NOT NULL,
  contact_email   VARCHAR(255),
  contact_phone   VARCHAR(50),
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  description     TEXT,
  services        JSON         COMMENT 'Array of service strings offered',
  operating_hours VARCHAR(255),
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- SERVICE REQUESTS
-- Central table: all user requests flow through this table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_requests (
  id          VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  user_id     VARCHAR(36)  NOT NULL,
  type        ENUM('sos', 'medical', 'medication', 'humanitarian', 'general') NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  urgency     ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  status      ENUM('pending', 'classified', 'routed', 'accepted', 'in_progress', 'resolved', 'cancelled') NOT NULL DEFAULT 'pending',
  attachments JSON         COMMENT 'Array of {name, url, type} objects',
  resolved_at TIMESTAMP    NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_service_requests_user (user_id),
  INDEX idx_service_requests_status (status),
  INDEX idx_service_requests_type (type),
  INDEX idx_service_requests_urgency (urgency)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- REQUEST CLASSIFICATIONS (AI Triage Layer)
-- Stores automated classification results for each request
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS request_classifications (
  id                        VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  request_id                VARCHAR(36)  NOT NULL UNIQUE,
  category                  ENUM('medical_emergency', 'medication_need', 'humanitarian_aid', 'general_inquiry') NOT NULL,
  priority_score            TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Score 0-100',
  recommended_provider_type ENUM('healthcare', 'pharmacy', 'ngo', 'government') NOT NULL,
  classification_notes      TEXT,
  classified_at             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- REQUEST ASSIGNMENTS (Service Routing Engine)
-- Routes classified requests to service providers
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS request_assignments (
  id           VARCHAR(36) NOT NULL DEFAULT (UUID()),
  request_id   VARCHAR(36) NOT NULL,
  provider_id  VARCHAR(36) NOT NULL,
  status       ENUM('pending', 'accepted', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
  notes        TEXT,
  assigned_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accepted_at  TIMESTAMP   NULL,
  completed_at TIMESTAMP   NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (request_id)  REFERENCES service_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE CASCADE,
  INDEX idx_assignments_request  (request_id),
  INDEX idx_assignments_provider (provider_id),
  INDEX idx_assignments_status   (status)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECURE MESSAGES (Communication Layer)
-- Encrypted messages between users and responders within a request context
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS secure_messages (
  id           VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  request_id   VARCHAR(36)  NOT NULL,
  sender_id    VARCHAR(36)  NOT NULL,
  sender_type  ENUM('user', 'provider', 'system') NOT NULL,
  content      TEXT         NOT NULL,
  attachments  JSON         COMMENT 'Array of {name, url, type} objects',
  is_read      BOOLEAN      NOT NULL DEFAULT FALSE,
  sent_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
  INDEX idx_secure_messages_request (request_id),
  INDEX idx_secure_messages_sender  (sender_id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- MEDICATION INVENTORY
-- Tracks medication stock per pharmacy
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medication_inventory (
  id              VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  provider_id     VARCHAR(36)  NOT NULL,
  medication_name VARCHAR(255) NOT NULL,
  is_available    BOOLEAN      NOT NULL DEFAULT TRUE,
  quantity        INT UNSIGNED NOT NULL DEFAULT 0,
  notes           TEXT,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_provider_medication (provider_id, medication_name),
  FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE CASCADE,
  INDEX idx_medication_available (is_available)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- VOLUNTEERS
-- Volunteer registrations linked to users
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS volunteers (
  id         VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  user_id    VARCHAR(36)  NOT NULL UNIQUE,
  skills     JSON         NOT NULL COMMENT 'Array of skill strings',
  bio        TEXT,
  status     ENUM('available', 'assigned', 'unavailable') NOT NULL DEFAULT 'available',
  rating     DECIMAL(3,2) UNSIGNED,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_volunteers_status (status)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- SOS ALERTS
-- Emergency alerts without location data; routed through the request system
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sos_alerts (
  id           VARCHAR(36) NOT NULL DEFAULT (UUID()),
  user_id      VARCHAR(36) NOT NULL,
  request_id   VARCHAR(36) NULL COMMENT 'Linked service_request once classified',
  message      TEXT,
  status       ENUM('active', 'responding', 'resolved', 'cancelled') NOT NULL DEFAULT 'active',
  responded_by VARCHAR(36) NULL COMMENT 'Provider ID that accepted the alert',
  resolved_at  TIMESTAMP   NULL,
  created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE SET NULL,
  INDEX idx_sos_status  (status),
  INDEX idx_sos_user_id (user_id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- MEDICATION REQUESTS
-- User requests for specific medications, routed to pharmacies
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medication_requests (
  id              VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  user_id         VARCHAR(36)  NOT NULL,
  request_id      VARCHAR(36)  NULL COMMENT 'Linked service_request once routed',
  medication_name VARCHAR(255) NOT NULL,
  urgency         ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  status          ENUM('pending', 'approved', 'fulfilled', 'cancelled') NOT NULL DEFAULT 'pending',
  notes           TEXT,
  pharmacy_id     VARCHAR(36)  NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (request_id)  REFERENCES service_requests(id) ON DELETE SET NULL,
  FOREIGN KEY (pharmacy_id) REFERENCES service_providers(id) ON DELETE SET NULL,
  INDEX idx_med_requests_user   (user_id),
  INDEX idx_med_requests_status (status)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- ONBOARDING RESPONSES
-- Captures user needs during first-run onboarding
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_responses (
  id                    VARCHAR(36) NOT NULL DEFAULT (UUID()),
  user_id               VARCHAR(36) NOT NULL UNIQUE,
  needs_medical         BOOLEAN     NOT NULL DEFAULT FALSE,
  needs_medication      BOOLEAN     NOT NULL DEFAULT FALSE,
  needs_humanitarian    BOOLEAN     NOT NULL DEFAULT FALSE,
  is_volunteering       BOOLEAN     NOT NULL DEFAULT FALSE,
  organization_name     VARCHAR(255),
  additional_info       TEXT,
  completed_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- NGO ACCESS TOKENS
-- Token-based API access for NGO portals
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ngo_access_tokens (
  id           VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  provider_id  VARCHAR(36)  NOT NULL,
  token        VARCHAR(255) NOT NULL UNIQUE,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  expires_at   TIMESTAMP    NOT NULL,
  last_used_at TIMESTAMP    NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE CASCADE,
  INDEX idx_ngo_tokens_token     (token),
  INDEX idx_ngo_tokens_active    (is_active),
  INDEX idx_ngo_tokens_expires   (expires_at)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- COORDINATION NOTES
-- Internal NGO/provider notes attached to requests
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coordination_notes (
  id         VARCHAR(36) NOT NULL DEFAULT (UUID()),
  request_id VARCHAR(36) NOT NULL,
  token_id   VARCHAR(36) NOT NULL,
  content    TEXT        NOT NULL,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (token_id)   REFERENCES ngo_access_tokens(id) ON DELETE CASCADE,
  INDEX idx_coord_notes_request (request_id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- CRISIS ANALYTICS
-- Aggregated anonymous metrics for institutional dashboards
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crisis_analytics (
  id                           VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  analytics_date               DATE          NOT NULL,
  request_type                 ENUM('sos', 'medical', 'medication', 'humanitarian', 'general') NOT NULL,
  total_count                  INT UNSIGNED  NOT NULL DEFAULT 0,
  resolved_count               INT UNSIGNED  NOT NULL DEFAULT 0,
  pending_count                INT UNSIGNED  NOT NULL DEFAULT 0,
  avg_response_time_minutes    FLOAT         COMMENT 'Average time from submission to acceptance',
  avg_resolution_time_minutes  FLOAT         COMMENT 'Average time from submission to resolution',
  created_at                   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_analytics_date_type (analytics_date, request_type),
  INDEX idx_analytics_date (analytics_date)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- CHAT CONVERSATIONS (Support Chat)
-- Anonymous support chat sessions between users and NGOs
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_conversations (
  id         VARCHAR(36) NOT NULL DEFAULT (UUID()),
  user_id    VARCHAR(36) NOT NULL,
  status     ENUM('open', 'in_progress', 'closed') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_chat_conv_user   (user_id),
  INDEX idx_chat_conv_status (status)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- CHAT MESSAGES
-- Individual messages within a chat conversation
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id              VARCHAR(36) NOT NULL DEFAULT (UUID()),
  conversation_id VARCHAR(36) NOT NULL,
  sender          ENUM('user', 'ngo') NOT NULL,
  message         TEXT        NOT NULL,
  is_read         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
  INDEX idx_chat_msg_conv   (conversation_id),
  INDEX idx_chat_msg_sender (sender),
  INDEX idx_chat_msg_unread (is_read)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: Default service providers (examples)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO service_providers (id, name, type, contact_email, contact_phone, description, services, operating_hours) VALUES
  (UUID(), 'Central Medical Clinic', 'healthcare', 'central@aidline.org', '+1-555-0101', 'General medical consultations and emergency care', '["General Medicine", "Emergency Care", "Teleconsultation"]', '08:00-20:00'),
  (UUID(), 'Aid Pharmacy Network', 'pharmacy', 'pharmacy@aidline.org', '+1-555-0102', 'Essential medicines and medical supplies', '["Dispensing", "Medication Advice"]', '07:00-22:00'),
  (UUID(), 'HumanFirst NGO', 'ngo', 'contact@humanfirst.org', '+1-555-0103', 'Humanitarian aid and emergency relief', '["Food Aid", "Shelter", "Emergency Relief", "Legal Support"]', '24/7'),
  (UUID(), 'Medical Relief Alliance', 'healthcare', 'info@medrelief.org', '+1-555-0104', 'Specialized medical services and trauma care', '["Trauma Care", "Mental Health", "Chronic Disease Management"]', '09:00-18:00'),
  (UUID(), 'Community Pharmacy Hub', 'pharmacy', 'hub@aidline.org', '+1-555-0105', 'Community-based pharmacy with wide medication range', '["Dispensing", "Chronic Medication", "Pediatric Medications"]', '08:00-21:00'),
  (UUID(), 'Refugee Aid Coalition', 'ngo', 'help@refugeeaid.org', '+1-555-0106', 'Support services for displaced populations', '["Displacement Support", "Document Assistance", "Psychosocial Support"]', '08:00-18:00');
