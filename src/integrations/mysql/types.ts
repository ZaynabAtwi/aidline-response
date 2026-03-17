export type RequestType =
  | 'sos_emergency'
  | 'medical_consultation'
  | 'emergency_medical'
  | 'medication_need'
  | 'humanitarian_aid'
  | 'general_inquiry';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export type RequestStatus =
  | 'submitted'
  | 'classifying'
  | 'classified'
  | 'routing'
  | 'routed'
  | 'accepted'
  | 'in_progress'
  | 'resolved'
  | 'cancelled';

export type ClassifiedCategory =
  | 'medical_emergency'
  | 'medication_need'
  | 'humanitarian_aid'
  | 'general_inquiry';

export type ResponderType = 'healthcare_provider' | 'pharmacy' | 'ngo' | 'general_support';

export type RouteStatus = 'pending' | 'notified' | 'accepted' | 'declined' | 'escalated';

export type ConversationStatus = 'open' | 'active' | 'resolved' | 'closed';

export type MessageSenderType = 'user' | 'responder' | 'system';

export type VolunteerStatus = 'available' | 'assigned' | 'unavailable';

export interface ServiceRequest {
  id: string;
  user_id: string;
  request_type: RequestType;
  title: string;
  description: string | null;
  urgency_level: UrgencyLevel;
  status: RequestStatus;
  attachments: any;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface RequestClassification {
  id: string;
  request_id: string;
  classified_category: ClassifiedCategory;
  priority_score: number;
  required_responder_type: ResponderType;
  confidence_score: number;
  classification_notes: string;
  classified_at: string;
}

export interface ServiceRoute {
  id: string;
  request_id: string;
  classification_id: string;
  routed_to_type: string;
  routed_to_id: string;
  route_status: RouteStatus;
  provider_name?: string;
  accepted_at: string | null;
  declined_at: string | null;
  escalation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthcareProvider {
  id: string;
  name: string;
  provider_type: 'hospital' | 'clinic' | 'telehealth' | 'emergency_center';
  address: string | null;
  phone: string | null;
  email: string | null;
  services: string[] | null;
  operating_hours: string | null;
  is_operational: boolean;
  capacity_status: 'available' | 'limited' | 'full';
  ngo_affiliation: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  operating_hours: string | null;
  is_operational: boolean;
  ngo_affiliation: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicationInventoryItem {
  id: string;
  pharmacy_id: string;
  medication_name: string;
  quantity: number;
  is_available: boolean;
  notes: string | null;
  updated_at: string;
}

export interface NGO {
  id: string;
  name: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  services_offered: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  request_id: string | null;
  user_id: string;
  responder_id: string | null;
  responder_type: 'healthcare_provider' | 'pharmacy' | 'ngo' | 'system';
  status: ConversationStatus;
  unread_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: MessageSenderType;
  content: string;
  message_type: 'text' | 'document' | 'instruction' | 'follow_up';
  is_read: boolean;
  created_at: string;
}

export interface Volunteer {
  id: string;
  user_id: string;
  skills: string[];
  bio: string | null;
  status: VolunteerStatus;
  rating: number | null;
  total_missions: number;
  created_at: string;
  updated_at: string;
}

export interface Shelter {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  capacity: number;
  available_spots: number;
  amenities: string[] | null;
  is_operational: boolean;
  ngo_affiliation: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoordinationNote {
  id: string;
  content: string;
  author_token_id: string | null;
  author_user_id: string | null;
  created_at: string;
}

export interface AnalyticsDashboard {
  overview: {
    totalRequests: number;
    activeSOS: number;
    avgResponseMinutes: number;
    resolutionRate: number;
  };
  requestsByType: { request_type: string; count: number }[];
  requestsByStatus: { status: string; count: number }[];
  requestsByUrgency: { urgency_level: string; count: number }[];
  activeProviders: {
    healthcare: number;
    pharmacies: number;
    ngos: number;
    volunteers: number;
  };
  recentActivity: { date: string; count: number }[];
  medicationDemand: { medication: string; demand_count: number }[];
}

export interface PipelineResult {
  request: ServiceRequest;
  classification: {
    category: string;
    priorityScore: number;
    requiredResponderType: string;
    confidence: number;
    notes: string;
  };
  routes: {
    routeId: string;
    providerId: string;
    providerType: string;
    providerName: string;
  }[];
  pipeline: {
    step: string;
    message: string;
  };
}
