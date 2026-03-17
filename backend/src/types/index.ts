import { Request } from "express";

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  role:   UserRole;
  iat?:   number;
  exp?:   number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole =
  | "displaced_user"
  | "volunteer"
  | "ngo_admin"
  | "healthcare_provider"
  | "pharmacy_staff"
  | "system_admin";

export type ProviderType = "healthcare" | "pharmacy" | "ngo" | "government";

export type RequestType = "sos" | "medical" | "medication" | "humanitarian" | "general";

export type UrgencyLevel = "low" | "medium" | "high" | "critical";

export type RequestStatus =
  | "pending"
  | "classified"
  | "routed"
  | "accepted"
  | "in_progress"
  | "resolved"
  | "cancelled";

export type AssignmentStatus = "pending" | "accepted" | "rejected" | "completed";

export type SosStatus = "active" | "responding" | "resolved" | "cancelled";

export type MedRequestStatus = "pending" | "approved" | "fulfilled" | "cancelled";

export type VolunteerStatus = "available" | "assigned" | "unavailable";

export type ClassificationCategory =
  | "medical_emergency"
  | "medication_need"
  | "humanitarian_aid"
  | "general_inquiry";

export type ChatStatus = "open" | "in_progress" | "closed";

export type MessageSender = "user" | "ngo";

// ─── Database Row Types ───────────────────────────────────────────────────────

export interface UserRow {
  id:                 string;
  email:              string | null;
  phone:              string | null;
  full_name:          string | null;
  password_hash:      string | null;
  preferred_language: "ar" | "en";
  role:               UserRole;
  is_anonymous:       boolean;
  is_active:          boolean;
  supabase_uid:       string | null;
  created_at:         Date;
  updated_at:         Date;
}

export interface ServiceProviderRow {
  id:              string;
  name:            string;
  type:            ProviderType;
  contact_email:   string | null;
  contact_phone:   string | null;
  is_active:       boolean;
  description:     string | null;
  services:        string | null;
  operating_hours: string | null;
  created_at:      Date;
  updated_at:      Date;
}

export interface ServiceRequestRow {
  id:          string;
  user_id:     string;
  type:        RequestType;
  title:       string;
  description: string | null;
  urgency:     UrgencyLevel;
  status:      RequestStatus;
  attachments: string | null;
  resolved_at: Date | null;
  created_at:  Date;
  updated_at:  Date;
}

export interface RequestClassificationRow {
  id:                        string;
  request_id:                string;
  category:                  ClassificationCategory;
  priority_score:            number;
  recommended_provider_type: ProviderType;
  classification_notes:      string | null;
  classified_at:             Date;
}

export interface RequestAssignmentRow {
  id:           string;
  request_id:   string;
  provider_id:  string;
  status:       AssignmentStatus;
  notes:        string | null;
  assigned_at:  Date;
  accepted_at:  Date | null;
  completed_at: Date | null;
}

export interface SecureMessageRow {
  id:          string;
  request_id:  string;
  sender_id:   string;
  sender_type: "user" | "provider" | "system";
  content:     string;
  attachments: string | null;
  is_read:     boolean;
  sent_at:     Date;
}

export interface SosAlertRow {
  id:           string;
  user_id:      string;
  request_id:   string | null;
  message:      string | null;
  status:       SosStatus;
  responded_by: string | null;
  resolved_at:  Date | null;
  created_at:   Date;
  updated_at:   Date;
}

export interface MedicationRequestRow {
  id:              string;
  user_id:         string;
  request_id:      string | null;
  medication_name: string;
  urgency:         UrgencyLevel;
  status:          MedRequestStatus;
  notes:           string | null;
  pharmacy_id:     string | null;
  created_at:      Date;
  updated_at:      Date;
}

export interface VolunteerRow {
  id:         string;
  user_id:    string;
  skills:     string;
  bio:        string | null;
  status:     VolunteerStatus;
  rating:     number | null;
  created_at: Date;
  updated_at: Date;
}

export interface CrisisAnalyticsRow {
  id:                          string;
  analytics_date:              Date;
  request_type:                RequestType;
  total_count:                 number;
  resolved_count:              number;
  pending_count:               number;
  avg_response_time_minutes:   number | null;
  avg_resolution_time_minutes: number | null;
  created_at:                  Date;
  updated_at:                  Date;
}

export interface MedicationInventoryRow {
  id:              string;
  provider_id:     string;
  medication_name: string;
  is_available:    boolean;
  quantity:        number;
  notes:           string | null;
  updated_at:      Date;
}

export interface NgoAccessTokenRow {
  id:           string;
  provider_id:  string;
  token:        string;
  is_active:    boolean;
  expires_at:   Date;
  last_used_at: Date | null;
  created_at:   Date;
}

export interface ChatConversationRow {
  id:         string;
  user_id:    string;
  status:     ChatStatus;
  created_at: Date;
  updated_at: Date;
}

export interface ChatMessageRow {
  id:              string;
  conversation_id: string;
  sender:          MessageSender;
  message:         string;
  is_read:         boolean;
  created_at:      Date;
}

// ─── API Response Shapes ─────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?:   T;
  error?:  string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items:    T[];
  total:    number;
  page:     number;
  pageSize: number;
}
