-- AidLine MySQL Schema
-- Operational Interaction Model (Without Location Data)
-- Structured request routing, AI triage, and service coordination

CREATE DATABASE IF NOT EXISTS aidline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aidline;

-- ============================================================
-- 1. USER & AUTHENTICATION TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  preferred_language ENUM('en', 'ar') DEFAULT 'en',
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_roles (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  role ENUM('displaced_user', 'volunteer', 'ngo_admin', 'healthcare_provider', 'pharmacy_operator') NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_role (user_id, role)
);

-- ============================================================
-- 2. SERVICE REQUEST ENTRY LAYER (Step 1 of Pipeline)
-- Unified request model for all assistance types
-- ============================================================

CREATE TABLE IF NOT EXISTS service_requests (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  request_type ENUM(
    'sos_emergency',
    'medical_consultation',
    'emergency_medical',
    'medication_need',
    'humanitarian_aid',
    'general_inquiry'
  ) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  urgency_level ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  status ENUM(
    'submitted',
    'classifying',
    'classified',
    'routing',
    'routed',
    'accepted',
    'in_progress',
    'resolved',
    'cancelled'
  ) NOT NULL DEFAULT 'submitted',
  attachments JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_request_type (request_type),
  INDEX idx_urgency (urgency_level),
  INDEX idx_user_requests (user_id, created_at)
);

-- ============================================================
-- 3. AI CLASSIFICATION & TRIAGE (Step 2 of Pipeline)
-- Automated classification of incoming requests
-- ============================================================

CREATE TABLE IF NOT EXISTS request_classifications (
  id CHAR(36) PRIMARY KEY,
  request_id CHAR(36) NOT NULL UNIQUE,
  classified_category ENUM(
    'medical_emergency',
    'medication_need',
    'humanitarian_aid',
    'general_inquiry'
  ) NOT NULL,
  priority_score INT NOT NULL DEFAULT 50,
  required_responder_type ENUM(
    'healthcare_provider',
    'pharmacy',
    'ngo',
    'general_support'
  ) NOT NULL,
  confidence_score DECIMAL(5,4) DEFAULT 0.0000,
  classification_notes TEXT,
  classified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
  INDEX idx_category (classified_category),
  INDEX idx_priority (priority_score DESC)
);

-- ============================================================
-- 4. SERVICE PROVIDER TABLES
-- Healthcare, Pharmacy, and NGO networks
-- ============================================================

CREATE TABLE IF NOT EXISTS healthcare_providers (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  provider_type ENUM('hospital', 'clinic', 'telehealth', 'emergency_center') NOT NULL,
  address VARCHAR(500),
  phone VARCHAR(50),
  email VARCHAR(255),
  services JSON,
  operating_hours VARCHAR(255),
  is_operational BOOLEAN DEFAULT TRUE,
  capacity_status ENUM('available', 'limited', 'full') DEFAULT 'available',
  created_by CHAR(36),
  ngo_affiliation VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_operational (is_operational),
  INDEX idx_type (provider_type)
);

CREATE TABLE IF NOT EXISTS pharmacies (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500),
  phone VARCHAR(50),
  email VARCHAR(255),
  operating_hours VARCHAR(255),
  is_operational BOOLEAN DEFAULT TRUE,
  ngo_affiliation VARCHAR(255),
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_operational (is_operational)
);

CREATE TABLE IF NOT EXISTS medication_inventory (
  id CHAR(36) PRIMARY KEY,
  pharmacy_id CHAR(36) NOT NULL,
  medication_name VARCHAR(255) NOT NULL,
  quantity INT DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  notes TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE CASCADE,
  INDEX idx_pharmacy (pharmacy_id),
  INDEX idx_medication (medication_name),
  INDEX idx_available (is_available)
);

CREATE TABLE IF NOT EXISTS ngos (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  services_offered JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_active (is_active)
);

CREATE TABLE IF NOT EXISTS ngo_access_tokens (
  id CHAR(36) PRIMARY KEY,
  ngo_id CHAR(36),
  token VARCHAR(255) NOT NULL UNIQUE,
  label VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  last_used_at TIMESTAMP NULL,
  FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- 5. SERVICE ROUTING ENGINE (Step 3 of Pipeline)
-- Routes classified requests to appropriate providers
-- ============================================================

CREATE TABLE IF NOT EXISTS service_routes (
  id CHAR(36) PRIMARY KEY,
  request_id CHAR(36) NOT NULL,
  classification_id CHAR(36) NOT NULL,
  routed_to_type ENUM('healthcare_provider', 'pharmacy', 'ngo') NOT NULL,
  routed_to_id CHAR(36) NOT NULL,
  route_status ENUM('pending', 'notified', 'accepted', 'declined', 'escalated') NOT NULL DEFAULT 'pending',
  accepted_at TIMESTAMP NULL,
  declined_at TIMESTAMP NULL,
  escalation_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (classification_id) REFERENCES request_classifications(id) ON DELETE CASCADE,
  INDEX idx_request (request_id),
  INDEX idx_route_status (route_status),
  INDEX idx_routed_to (routed_to_type, routed_to_id)
);

-- ============================================================
-- 6. SECURE COMMUNICATION SYSTEM (Step 4 of Pipeline)
-- Encrypted messaging between users and responders
-- ============================================================

CREATE TABLE IF NOT EXISTS conversations (
  id CHAR(36) PRIMARY KEY,
  request_id CHAR(36),
  user_id CHAR(36) NOT NULL,
  responder_id CHAR(36),
  responder_type ENUM('healthcare_provider', 'pharmacy', 'ngo', 'system') DEFAULT 'system',
  status ENUM('open', 'active', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS messages (
  id CHAR(36) PRIMARY KEY,
  conversation_id CHAR(36) NOT NULL,
  sender_id CHAR(36) NOT NULL,
  sender_type ENUM('user', 'responder', 'system') NOT NULL,
  content TEXT NOT NULL,
  message_type ENUM('text', 'document', 'instruction', 'follow_up') DEFAULT 'text',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_conversation (conversation_id, created_at),
  INDEX idx_unread (conversation_id, is_read)
);

-- ============================================================
-- 7. VOLUNTEER MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS volunteers (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  skills JSON NOT NULL,
  bio TEXT,
  status ENUM('available', 'assigned', 'unavailable') DEFAULT 'available',
  rating DECIMAL(3,2),
  total_missions INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status)
);

-- ============================================================
-- 8. SHELTER MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS shelters (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500),
  phone VARCHAR(50),
  capacity INT DEFAULT 0,
  available_spots INT DEFAULT 0,
  amenities JSON,
  is_operational BOOLEAN DEFAULT TRUE,
  ngo_affiliation VARCHAR(255),
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_operational (is_operational)
);

-- ============================================================
-- 9. ONBOARDING
-- ============================================================

CREATE TABLE IF NOT EXISTS onboarding_responses (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  needs_shelter BOOLEAN DEFAULT FALSE,
  needs_medication BOOLEAN DEFAULT FALSE,
  is_volunteering BOOLEAN DEFAULT FALSE,
  district VARCHAR(100),
  urgency VARCHAR(50) DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 10. COORDINATION NOTES
-- ============================================================

CREATE TABLE IF NOT EXISTS coordination_notes (
  id CHAR(36) PRIMARY KEY,
  author_token_id CHAR(36),
  author_user_id CHAR(36),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_token_id) REFERENCES ngo_access_tokens(id) ON DELETE SET NULL,
  FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- 11. CRISIS INTELLIGENCE & DATA AGGREGATION (Step 8 of Pipeline)
-- Anonymous aggregated data for operational intelligence
-- ============================================================

CREATE TABLE IF NOT EXISTS crisis_analytics (
  id CHAR(36) PRIMARY KEY,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  metric_type ENUM(
    'sos_count',
    'medical_requests',
    'medication_shortages',
    'humanitarian_requests',
    'response_time_avg',
    'resolution_rate',
    'active_providers',
    'request_volume'
  ) NOT NULL,
  metric_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  breakdown JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_period (period_start, period_end),
  INDEX idx_metric (metric_type)
);

-- ============================================================
-- 12. AUDIT LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id CHAR(36),
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_created (created_at)
);

-- ============================================================
-- VIEWS FOR CRISIS INTELLIGENCE DASHBOARD
-- ============================================================

CREATE OR REPLACE VIEW request_summary AS
SELECT
  request_type,
  urgency_level,
  status,
  COUNT(*) as total_count,
  DATE(created_at) as request_date
FROM service_requests
GROUP BY request_type, urgency_level, status, DATE(created_at);

CREATE OR REPLACE VIEW provider_activity AS
SELECT
  sr.routed_to_type,
  sr.route_status,
  COUNT(*) as route_count,
  AVG(TIMESTAMPDIFF(MINUTE, sr.created_at, sr.accepted_at)) as avg_acceptance_minutes
FROM service_routes sr
GROUP BY sr.routed_to_type, sr.route_status;

CREATE OR REPLACE VIEW medication_demand AS
SELECT
  mi.medication_name,
  SUM(mi.quantity) as total_stock,
  COUNT(DISTINCT sr.id) as request_count
FROM medication_inventory mi
LEFT JOIN service_requests sr ON sr.request_type = 'medication_need'
  AND sr.title LIKE CONCAT('%', mi.medication_name, '%')
GROUP BY mi.medication_name;
