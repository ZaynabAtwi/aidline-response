/* eslint-disable @typescript-eslint/no-explicit-any */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'API request failed');
  }

  return res.json();
}

export const api = {
  // Auth
  auth: {
    anonymousSignIn: (existingId?: string) =>
      request<{ user: any }>('/auth/anonymous', {
        method: 'POST',
        body: JSON.stringify({ existingId }),
      }),
    getProfile: (userId: string) =>
      request<{ user: any; roles: string[] }>(`/auth/profile/${userId}`),
    checkRole: (userId: string, role: string) =>
      request<{ hasRole: boolean }>(`/auth/role/${userId}/${role}`),
    saveOnboarding: (data: {
      user_id: string;
      needs_shelter: boolean;
      needs_medication: boolean;
      is_volunteering: boolean;
      district: string;
      urgency: string;
    }) =>
      request<{ success: boolean }>('/auth/onboarding', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Service Requests (Entry + Triage + Routing)
  requests: {
    create: (data: {
      user_id: string;
      request_type: string;
      description?: string;
      urgency_level?: string;
      attachments?: any;
    }) =>
      request<{ request: any; triage: any; routing: any }>('/requests', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getForUser: (userId: string) =>
      request<any[]>(`/requests/user/${userId}`),
    getById: (requestId: string) =>
      request<{ request: any; triage: any; routing: any }>(`/requests/${requestId}`),
    updateStatus: (requestId: string, status: string) =>
      request<{ success: boolean }>(`/requests/${requestId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    getAll: (params?: { status?: string; request_type?: string; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      if (params?.request_type) qs.set('request_type', params.request_type);
      if (params?.limit) qs.set('limit', String(params.limit));
      return request<any[]>(`/requests?${qs.toString()}`);
    },
  },

  // SOS
  sos: {
    send: (data: { user_id: string; message?: string }) =>
      request<{ alert: any; triage: any; routing: any }>('/sos', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getAll: () => request<any[]>('/sos'),
    updateStatus: (id: string, status: string) =>
      request<{ success: boolean }>(`/sos/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  // Communication
  communication: {
    getOrCreateConversation: (data: { user_id: string; provider_id?: string; request_id?: string }) =>
      request<any>('/communication/conversations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getConversationsForUser: (userId: string) =>
      request<any[]>(`/communication/conversations/user/${userId}`),
    getAllConversations: () =>
      request<any[]>('/communication/conversations'),
    getMessages: (conversationId: string) =>
      request<any[]>(`/communication/conversations/${conversationId}/messages`),
    sendMessage: (data: {
      conversation_id: string;
      sender_type: string;
      sender_id?: string;
      message: string;
      attachments?: any;
    }) =>
      request<any>('/communication/messages', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    markRead: (conversationId: string, senderType: string) =>
      request<{ success: boolean }>(`/communication/conversations/${conversationId}/read`, {
        method: 'PATCH',
        body: JSON.stringify({ sender_type: senderType }),
      }),
    updateConversationStatus: (conversationId: string, status: string) =>
      request<{ success: boolean }>(`/communication/conversations/${conversationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  // Healthcare
  healthcare: {
    getClinics: () => request<any[]>('/healthcare/clinics'),
    createInteraction: (data: any) =>
      request<any>('/healthcare/interactions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getInteractions: (requestId: string) =>
      request<any[]>(`/healthcare/interactions/request/${requestId}`),
  },

  // Medication
  medication: {
    getPharmacies: () => request<any[]>('/medication/pharmacies'),
    updatePharmacyMedications: (id: string, medications: string[]) =>
      request<{ success: boolean }>(`/medication/pharmacies/${id}/medications`, {
        method: 'PATCH',
        body: JSON.stringify({ available_medications: medications }),
      }),
    createRequest: (data: {
      user_id: string;
      medication_name: string;
      urgency?: string;
      notes?: string;
    }) =>
      request<any>('/medication/requests', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getRequestsForUser: (userId: string) =>
      request<any[]>(`/medication/requests/user/${userId}`),
    getAllRequests: () => request<any[]>('/medication/requests'),
    updateRequestStatus: (id: string, data: { status: string; [key: string]: any }) =>
      request<{ success: boolean }>(`/medication/requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // NGO
  ngo: {
    getProviders: () => request<any[]>('/ngo/providers'),
    validateToken: (token: string) =>
      request<{ valid: boolean; tokenId: string; label: string }>('/ngo/validate-token', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),
    secureAction: (token: string, action: string, payload?: any) =>
      request<{ data: any }>('/ngo/secure/data', {
        method: 'POST',
        body: JSON.stringify({ token, action, payload }),
      }),
    getCases: () => request<any[]>('/ngo/cases'),
    createCase: (data: { request_id: string; ngo_id: string }) =>
      request<any>('/ngo/cases', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateCaseStatus: (id: string, data: any) =>
      request<{ success: boolean }>(`/ngo/cases/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    getNotes: () => request<any[]>('/ngo/notes'),
    createNote: (data: { content: string; author_token_id?: string }) =>
      request<any>('/ngo/notes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Shelters
  shelters: {
    getAll: () => request<any[]>('/shelters'),
    getById: (id: string) => request<any>(`/shelters/${id}`),
    update: (id: string, data: any) =>
      request<{ success: boolean }>(`/shelters/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    create: (data: any) =>
      request<any>('/shelters', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Volunteers
  volunteers: {
    getAll: () => request<any[]>('/volunteers'),
    register: (data: { user_id: string; skills: string[]; bio?: string }) =>
      request<any>('/volunteers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, status: string) =>
      request<{ success: boolean }>(`/volunteers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  // Analytics
  analytics: {
    getOverview: () => request<any>('/analytics/overview'),
    getTrends: (days?: number) =>
      request<any>(`/analytics/trends${days ? `?days=${days}` : ''}`),
    getMedicationShortages: () => request<any[]>('/analytics/medication-shortages'),
    getHealthcareStress: () => request<any>('/analytics/healthcare-stress'),
    getInstitutionalVolume: (period?: number) =>
      request<any[]>(`/analytics/institutional/volume${period ? `?period=${period}` : ''}`),
    getHumanitarianDemand: () =>
      request<any>('/analytics/institutional/humanitarian-demand'),
  },

  // Service Providers
  providers: {
    getAll: (type?: string) =>
      request<any[]>(`/providers${type ? `?type=${type}` : ''}`),
    getById: (id: string) => request<any>(`/providers/${id}`),
    create: (data: any) =>
      request<any>('/providers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean }>(`/providers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // Routing
  routing: {
    getAll: () => request<any[]>('/routing'),
    getForProvider: (providerId: string) =>
      request<any[]>(`/routing/provider/${providerId}`),
    accept: (routeId: string) =>
      request<{ success: boolean }>(`/routing/${routeId}/accept`, { method: 'PATCH' }),
    complete: (routeId: string) =>
      request<{ success: boolean }>(`/routing/${routeId}/complete`, { method: 'PATCH' }),
    escalate: (routeId: string) =>
      request<{ success: boolean }>(`/routing/${routeId}/escalate`, { method: 'PATCH' }),
  },
};
