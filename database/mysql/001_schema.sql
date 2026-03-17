-- AidLine MySQL Schema - Request Routing Architecture (No Location)
-- Platform operates through structured request routing rather than geographic proximity.
-- Service coordination and triage model.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- 1. USERS & PROFILES (external auth via Supabase - user_id references auth)
-- =============================================================================

CREATE TABLE IF NOT EXISTS `profiles` (
  `id` CHAR(36) PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL UNIQUE,
  `full_name` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `avatar_url` TEXT NULL,
  `preferred_language` VARCHAR(10) DEFAULT 'en',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_profiles_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` CHAR(36) PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `role` ENUM('displaced_user', 'volunteer', 'ngo_admin') NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY `uk_user_role` (`user_id`, `role`),
  INDEX `idx_user_roles_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. ONBOARDING (structured data, no geographic info)
-- =============================================================================

CREATE TABLE IF NOT EXISTS `onboarding_responses` (
  `id` CHAR(36) PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL UNIQUE,
  `needs_shelter` TINYINT(1) NOT NULL DEFAULT 0,
  `needs_medication` TINYINT(1) NOT NULL DEFAULT 0,
  `is_volunteering` TINYINT(1) NOT NULL DEFAULT 0,
  `district` VARCHAR(100) NULL,
  `urgency` VARCHAR(20) NOT NULL DEFAULT 'low',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_onboarding_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. UNIFIED REQUEST ENTRY LAYER
-- User Request → AI Classification → Service Routing
-- =============================================================================

CREATE TABLE IF NOT EXISTS `requests` (
  `id` CHAR(36) PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `request_type` ENUM('sos_emergency', 'healthcare', 'medication', 'humanitarian', 'general_inquiry') NOT NULL,
  `description` TEXT NULL,
  `urgency` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  `status` ENUM('pending', 'classified', 'routed', 'accepted', 'resolved', 'cancelled') NOT NULL DEFAULT 'pending',
  `attachments` JSON NULL COMMENT 'Optional image/document references',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_requests_user_id` (`user_id`),
  INDEX `idx_requests_type` (`request_type`),
  INDEX `idx_requests_status` (`status`),
  INDEX `idx_requests_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Triage / Classification output
CREATE TABLE IF NOT EXISTS `request_classifications` (
  `id` CHAR(36) PRIMARY KEY,
  `request_id` CHAR(36) NOT NULL UNIQUE,
  `category` ENUM('medical_emergency', 'medication_need', 'humanitarian_aid', 'general_inquiry') NOT NULL,
  `priority` ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  `responder_type` ENUM('healthcare', 'pharmacy', 'ngo', 'volunteer') NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_classifications_request` (`request_id`),
  INDEX `idx_classifications_responder` (`responder_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Service routing: which module received the request
CREATE TABLE IF NOT EXISTS `request_routing` (
  `id` CHAR(36) PRIMARY KEY,
  `request_id` CHAR(36) NOT NULL,
  `target_module` ENUM('healthcare', 'medication', 'ngo') NOT NULL,
  `target_id` CHAR(36) NULL COMMENT 'pharmacy_id, clinic_id, or ngo_id',
  `routed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_routing_request` (`request_id`),
  INDEX `idx_routing_module` (`target_module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. SERVICE PROVIDERS (no location columns)
-- =============================================================================

CREATE TABLE IF NOT EXISTS `shelters` (
  `id` CHAR(36) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `address` TEXT NULL,
  `capacity` INT NOT NULL DEFAULT 0,
  `available_spots` INT NOT NULL DEFAULT 0,
  `is_operational` TINYINT(1) NOT NULL DEFAULT 1,
  `ngo` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `amenities` JSON NULL,
  `created_by` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_shelters_operational` (`is_operational`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `clinics` (
  `id` CHAR(36) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `address` TEXT NULL,
  `phone` VARCHAR(50) NULL,
  `is_operational` TINYINT(1) NOT NULL DEFAULT 1,
  `services` JSON NULL,
  `operating_hours` TEXT NULL,
  `ngo` VARCHAR(255) NULL,
  `created_by` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_clinics_operational` (`is_operational`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pharmacies` (
  `id` CHAR(36) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `address` TEXT NULL,
  `phone` VARCHAR(50) NULL,
  `is_operational` TINYINT(1) NOT NULL DEFAULT 1,
  `available_medications` JSON NULL,
  `operating_hours` TEXT NULL,
  `ngo` VARCHAR(255) NULL,
  `created_by` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_pharmacies_operational` (`is_operational`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. MEDICATION REQUESTS (routed to pharmacies)
-- =============================================================================

CREATE TABLE IF NOT EXISTS `medication_requests` (
  `id` CHAR(36) PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `request_id` CHAR(36) NULL COMMENT 'Links to unified requests if created via request flow',
  `medication_name` VARCHAR(255) NOT NULL,
  `urgency` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  `status` ENUM('pending', 'approved', 'fulfilled', 'cancelled') NOT NULL DEFAULT 'pending',
  `notes` TEXT NULL,
  `fulfilled_by` CHAR(36) NULL,
  `pharmacy_id` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_med_requests_user` (`user_id`),
  INDEX `idx_med_requests_status` (`status`),
  INDEX `idx_med_requests_pharmacy` (`pharmacy_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. SOS ALERTS (no location - request routing model)
-- =============================================================================

CREATE TABLE IF NOT EXISTS `sos_alerts` (
  `id` CHAR(36) PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `request_id` CHAR(36) NULL COMMENT 'Links to unified requests',
  `message` TEXT NULL,
  `status` ENUM('active', 'responding', 'resolved', 'cancelled') NOT NULL DEFAULT 'active',
  `responded_by` CHAR(36) NULL,
  `resolved_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_sos_user` (`user_id`),
  INDEX `idx_sos_status` (`status`),
  INDEX `idx_sos_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. VOLUNTEERS (no location - matched by skills, not proximity)
-- =============================================================================

CREATE TABLE IF NOT EXISTS `volunteers` (
  `id` CHAR(36) PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL UNIQUE,
  `skills` JSON NOT NULL COMMENT 'Array of skill strings',
  `status` ENUM('available', 'assigned', 'unavailable') NOT NULL DEFAULT 'available',
  `rating` DECIMAL(2,1) DEFAULT 0,
  `total_missions` INT DEFAULT 0,
  `bio` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_volunteers_status` (`status`),
  INDEX `idx_volunteers_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 8. GAS STATIONS (district-based, no coordinates)
-- =============================================================================

CREATE TABLE IF NOT EXISTS `gas_stations` (
  `id` CHAR(36) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `district` VARCHAR(100) NOT NULL,
  `status` ENUM('open', 'closed', 'unknown') NOT NULL DEFAULT 'unknown',
  `phone` VARCHAR(50) NULL,
  `notes` TEXT NULL,
  `created_by` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_gas_district` (`district`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 9. SECURE COMMUNICATION (Responder ↔ User)
-- =============================================================================

CREATE TABLE IF NOT EXISTS `chat_conversations` (
  `id` CHAR(36) PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `request_id` CHAR(36) NULL COMMENT 'Linked request for context',
  `status` ENUM('open', 'resolved', 'archived') NOT NULL DEFAULT 'open',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_chat_conv_user` (`user_id`),
  INDEX `idx_chat_conv_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` CHAR(36) PRIMARY KEY,
  `conversation_id` CHAR(36) NOT NULL,
  `sender` ENUM('user', 'responder') NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_chat_msg_conv` (`conversation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 10. NGO COORDINATION
-- =============================================================================

CREATE TABLE IF NOT EXISTS `ngo_access_tokens` (
  `id` CHAR(36) PRIMARY KEY,
  `token` VARCHAR(64) NOT NULL UNIQUE,
  `label` VARCHAR(255) NULL,
  `created_by` CHAR(36) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `expires_at` DATETIME(3) NULL,
  `last_used_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_ngo_tokens_active` (`is_active`, `token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `coordination_notes` (
  `id` CHAR(36) PRIMARY KEY,
  `content` TEXT NOT NULL,
  `author_token_id` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_notes_author` (`author_token_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 11. CRISIS INTELLIGENCE (aggregated analytics - no individual location)
-- =============================================================================

CREATE TABLE IF NOT EXISTS `crisis_analytics` (
  `id` CHAR(36) PRIMARY KEY,
  `period_date` DATE NOT NULL,
  `sos_count` INT NOT NULL DEFAULT 0,
  `medication_requests_count` INT NOT NULL DEFAULT 0,
  `humanitarian_requests_count` INT NOT NULL DEFAULT 0,
  `healthcare_requests_count` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY `uk_analytics_date` (`period_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
