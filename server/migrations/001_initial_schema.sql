-- AidLine MySQL Schema
-- Operational Interaction Model (Without Location Data)

CREATE DATABASE IF NOT EXISTS aidline;
USE aidline;

-- Users table (anonymous profiles)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  full_name VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  avatar_url VARCHAR(500) DEFAULT NULL,
  preferred_language VARCHAR(10) DEFAULT 'ar',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User roles
CREATE TABLE IF NOT EXISTS user_roles (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  role ENUM('displaced_user', 'volunteer', 'ngo_admin', 'healthcare_provider', 'pharmacy_admin', 'institutional_admin') NOT NULL,
  UNIQUE KEY unique_user_role (user_id, role),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Onboarding responses
CREATE TABLE IF NOT EXISTS onboarding_responses (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL UNIQUE,
  needs_shelter BOOLEAN DEFAULT FALSE,
  needs_medication BOOLEAN DEFAULT FALSE,
  is_volunteering BOOLEAN DEFAULT FALSE,
  district VARCHAR(100) DEFAULT NULL,
  urgency VARCHAR(20) DEFAULT 'low',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Service providers (healthcare, pharmacies, NGOs)
CREATE TABLE IF NOT EXISTS service_providers (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  provider_type ENUM('healthcare', 'pharmacy', 'ngo') NOT NULL,
  description TEXT DEFAULT NULL,
  address VARCHAR(500) DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  services JSON DEFAULT NULL,
  operating_hours VARCHAR(255) DEFAULT NULL,
  is_operational BOOLEAN DEFAULT TRUE,
  capacity INT DEFAULT NULL,
  available_spots INT DEFAULT NULL,
  available_medications JSON DEFAULT NULL,
  ngo_name VARCHAR(255) DEFAULT NULL,
  created_by VARCHAR(36) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 1. User Request Entry Layer
CREATE TABLE IF NOT EXISTS service_requests (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  request_type ENUM('sos', 'medical', 'medication', 'humanitarian', 'general_inquiry') NOT NULL,
  description TEXT DEFAULT NULL,
  urgency_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  status ENUM('submitted', 'classifying', 'routed', 'accepted', 'in_progress', 'resolved', 'cancelled') DEFAULT 'submitted',
  category VARCHAR(100) DEFAULT NULL,
  attachments JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Crisis Classification and AI Triage
CREATE TABLE IF NOT EXISTS request_triage (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  request_id VARCHAR(36) NOT NULL,
  category ENUM('medical_emergency', 'medication_need', 'humanitarian_aid', 'general_inquiry') NOT NULL,
  priority_level ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  required_responder_type ENUM('healthcare', 'pharmacy', 'ngo', 'general') NOT NULL,
  classification_confidence DECIMAL(5,2) DEFAULT NULL,
  classification_notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE
);

-- 3. Service Routing Engine
CREATE TABLE IF NOT EXISTS request_routing (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  request_id VARCHAR(36) NOT NULL,
  provider_id VARCHAR(36) NOT NULL,
  route_type ENUM('healthcare', 'medication', 'ngo', 'general') NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'completed', 'escalated') DEFAULT 'pending',
  accepted_at TIMESTAMP NULL DEFAULT NULL,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE CASCADE
);

-- 4. Secure Communication System
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  request_id VARCHAR(36) DEFAULT NULL,
  user_id VARCHAR(36) NOT NULL,
  provider_id VARCHAR(36) DEFAULT NULL,
  status ENUM('open', 'in_progress', 'closed') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  conversation_id VARCHAR(36) NOT NULL,
  sender_type ENUM('user', 'provider', 'system') NOT NULL,
  sender_id VARCHAR(36) DEFAULT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  attachments JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- 5. Healthcare Service Interaction
CREATE TABLE IF NOT EXISTS healthcare_interactions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  request_id VARCHAR(36) NOT NULL,
  provider_id VARCHAR(36) NOT NULL,
  interaction_type ENUM('consultation', 'teleconsultation', 'appointment', 'follow_up', 'immediate_care') NOT NULL,
  patient_info_requested BOOLEAN DEFAULT FALSE,
  instructions TEXT DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE CASCADE
);

-- 6. Medication Coordination Workflow
CREATE TABLE IF NOT EXISTS medication_requests (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  request_id VARCHAR(36) DEFAULT NULL,
  user_id VARCHAR(36) NOT NULL,
  pharmacy_id VARCHAR(36) DEFAULT NULL,
  medication_name VARCHAR(255) NOT NULL,
  urgency ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  status ENUM('pending', 'confirmed', 'alternative_suggested', 'reserved', 'fulfilled', 'escalated', 'cancelled') DEFAULT 'pending',
  alternative_medication VARCHAR(255) DEFAULT NULL,
  pickup_instructions TEXT DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  fulfilled_by VARCHAR(36) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (pharmacy_id) REFERENCES service_providers(id) ON DELETE SET NULL
);

-- 7. NGO Assistance Workflow
CREATE TABLE IF NOT EXISTS ngo_cases (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  request_id VARCHAR(36) NOT NULL,
  ngo_id VARCHAR(36) NOT NULL,
  status ENUM('received', 'evaluating', 'accepted', 'coordinating', 'aid_delivered', 'closed', 'rejected') DEFAULT 'received',
  evaluation_notes TEXT DEFAULT NULL,
  coordination_details TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (ngo_id) REFERENCES service_providers(id) ON DELETE CASCADE
);

-- NGO access tokens
CREATE TABLE IF NOT EXISTS ngo_access_tokens (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  token VARCHAR(255) NOT NULL UNIQUE,
  label VARCHAR(255) DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(36) DEFAULT NULL,
  expires_at TIMESTAMP NULL DEFAULT NULL,
  last_used_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Coordination notes
CREATE TABLE IF NOT EXISTS coordination_notes (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  author_token_id VARCHAR(36) DEFAULT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_token_id) REFERENCES ngo_access_tokens(id) ON DELETE SET NULL
);

-- Shelters (without location data)
CREATE TABLE IF NOT EXISTS shelters (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500) DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  capacity INT DEFAULT 0,
  available_spots INT DEFAULT 0,
  amenities JSON DEFAULT NULL,
  is_operational BOOLEAN DEFAULT TRUE,
  ngo VARCHAR(255) DEFAULT NULL,
  created_by VARCHAR(36) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Volunteers (without location data)
CREATE TABLE IF NOT EXISTS volunteers (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  skills JSON NOT NULL,
  bio TEXT DEFAULT NULL,
  status ENUM('available', 'assigned', 'unavailable') DEFAULT 'available',
  rating DECIMAL(3,2) DEFAULT NULL,
  total_missions INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- SOS alerts (without location data)
CREATE TABLE IF NOT EXISTS sos_alerts (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  request_id VARCHAR(36) DEFAULT NULL,
  message TEXT DEFAULT NULL,
  status ENUM('active', 'responding', 'resolved', 'cancelled') DEFAULT 'active',
  responded_by VARCHAR(36) DEFAULT NULL,
  resolved_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE SET NULL
);

-- 8. Crisis Intelligence and Data Aggregation
CREATE TABLE IF NOT EXISTS crisis_analytics (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  metric_type ENUM(
    'sos_count', 'medical_needs', 'medication_shortages',
    'humanitarian_requests', 'request_volume', 'crisis_trend',
    'healthcare_stress', 'response_time'
  ) NOT NULL,
  metric_value DECIMAL(10,2) NOT NULL,
  metric_details JSON DEFAULT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Institutional Integration - audit log
CREATE TABLE IF NOT EXISTS institutional_dashboard_access (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  access_type ENUM('analytics_view', 'report_download', 'trend_monitor') NOT NULL,
  accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_service_requests_user ON service_requests(user_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_type ON service_requests(request_type);
CREATE INDEX idx_service_requests_created ON service_requests(created_at);
CREATE INDEX idx_request_triage_request ON request_triage(request_id);
CREATE INDEX idx_request_routing_request ON request_routing(request_id);
CREATE INDEX idx_request_routing_provider ON request_routing(provider_id);
CREATE INDEX idx_request_routing_status ON request_routing(status);
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_provider ON conversations(provider_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_medication_requests_user ON medication_requests(user_id);
CREATE INDEX idx_medication_requests_pharmacy ON medication_requests(pharmacy_id);
CREATE INDEX idx_ngo_cases_request ON ngo_cases(request_id);
CREATE INDEX idx_ngo_cases_ngo ON ngo_cases(ngo_id);
CREATE INDEX idx_sos_alerts_user ON sos_alerts(user_id);
CREATE INDEX idx_sos_alerts_status ON sos_alerts(status);
CREATE INDEX idx_crisis_analytics_type ON crisis_analytics(metric_type);
CREATE INDEX idx_crisis_analytics_period ON crisis_analytics(period_start, period_end);
CREATE INDEX idx_volunteers_status ON volunteers(status);
CREATE INDEX idx_shelters_operational ON shelters(is_operational);
CREATE INDEX idx_healthcare_interactions_request ON healthcare_interactions(request_id);
