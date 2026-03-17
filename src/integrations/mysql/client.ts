const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

function getUserId(): string | null {
  return localStorage.getItem('aidline_user_id');
}

export function setUserId(id: string) {
  localStorage.setItem('aidline_user_id', id);
}

async function request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const userId = getUserId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (userId) {
    headers['x-user-id'] = userId;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    anonymous: () => request('/auth/anonymous', { method: 'POST' }),
    me: () => request('/auth/me'),
    validateNgoToken: (token: string) =>
      request('/auth/validate-ngo-token', { method: 'POST', body: { token } }),
  },

  // Service Requests (Pipeline Steps 1-3)
  requests: {
    create: (data: {
      request_type: string;
      title: string;
      description?: string;
      urgency_level?: string;
      attachments?: any;
    }) => request('/requests', { method: 'POST', body: data }),

    list: (params?: { status?: string; type?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request(`/requests${query ? `?${query}` : ''}`);
    },

    listAll: (params?: { status?: string; type?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request(`/requests/all${query ? `?${query}` : ''}`);
    },

    get: (id: string) => request(`/requests/${id}`),

    updateStatus: (id: string, status: string) =>
      request(`/requests/${id}/status`, { method: 'PATCH', body: { status } }),
  },

  // AI Triage (Pipeline Step 2)
  triage: {
    classify: (requestId: string) =>
      request(`/triage/classify/${requestId}`, { method: 'POST' }),

    preview: (data: { request_type: string; title: string; description?: string; urgency_level?: string }) =>
      request('/triage/preview', { method: 'POST', body: data }),

    getClassification: (requestId: string) =>
      request(`/triage/classification/${requestId}`),
  },

  // Service Routing (Pipeline Step 3)
  routing: {
    route: (requestId: string, classificationId: string) =>
      request(`/routing/route/${requestId}`, { method: 'POST', body: { classificationId } }),

    accept: (routeId: string) =>
      request(`/routing/accept/${routeId}`, { method: 'POST' }),

    decline: (routeId: string, reason?: string) =>
      request(`/routing/decline/${routeId}`, { method: 'POST', body: { reason } }),

    escalate: (routeId: string, reason: string) =>
      request(`/routing/escalate/${routeId}`, { method: 'POST', body: { reason } }),

    getRoutes: (requestId: string) =>
      request(`/routing/routes/${requestId}`),
  },

  // Secure Messaging (Pipeline Step 4)
  messaging: {
    createConversation: (data?: { request_id?: string; responder_type?: string }) =>
      request('/messaging/conversations', { method: 'POST', body: data || {} }),

    listConversations: () => request('/messaging/conversations'),

    listAllConversations: () => request('/messaging/conversations/all'),

    getMessages: (conversationId: string) =>
      request(`/messaging/conversations/${conversationId}/messages`),

    sendMessage: (conversationId: string, data: {
      content: string;
      sender_type?: string;
      message_type?: string;
    }) => request(`/messaging/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: data,
    }),

    markRead: (conversationId: string, senderType: string) =>
      request(`/messaging/conversations/${conversationId}/messages/read`, {
        method: 'PATCH',
        body: { sender_type: senderType },
      }),

    updateConversationStatus: (conversationId: string, status: string) =>
      request(`/messaging/conversations/${conversationId}/status`, {
        method: 'PATCH',
        body: { status },
      }),
  },

  // Analytics (Pipeline Step 8)
  analytics: {
    dashboard: () => request('/analytics/dashboard'),
    crisisTrends: () => request('/analytics/crisis-trends'),
    requestVolume: () => request('/analytics/request-volume'),
  },

  // Service Providers
  providers: {
    healthcare: {
      list: () => request('/providers/healthcare'),
      create: (data: any) => request('/providers/healthcare', { method: 'POST', body: data }),
      update: (id: string, data: any) => request(`/providers/healthcare/${id}`, { method: 'PATCH', body: data }),
    },
    pharmacies: {
      list: () => request('/providers/pharmacies'),
      create: (data: any) => request('/providers/pharmacies', { method: 'POST', body: data }),
      getInventory: (id: string) => request(`/providers/pharmacies/${id}/inventory`),
      addInventory: (id: string, data: any) =>
        request(`/providers/pharmacies/${id}/inventory`, { method: 'POST', body: data }),
      updateInventory: (pharmacyId: string, itemId: string, data: any) =>
        request(`/providers/pharmacies/${pharmacyId}/inventory/${itemId}`, { method: 'PATCH', body: data }),
    },
    ngos: {
      list: () => request('/providers/ngos'),
      create: (data: any) => request('/providers/ngos', { method: 'POST', body: data }),
    },
    shelters: {
      list: () => request('/providers/shelters'),
      update: (id: string, data: any) => request(`/providers/shelters/${id}`, { method: 'PATCH', body: data }),
    },
    volunteers: {
      list: () => request('/providers/volunteers'),
      create: (data: any) => request('/providers/volunteers', { method: 'POST', body: data }),
      updateStatus: (id: string, status: string) =>
        request(`/providers/volunteers/${id}/status`, { method: 'PATCH', body: { status } }),
    },
    notes: {
      list: () => request('/providers/notes'),
      create: (data: { content: string; author_user_id?: string; author_token_id?: string }) =>
        request('/providers/notes', { method: 'POST', body: data }),
    },
  },

  health: () => request('/health'),
};
