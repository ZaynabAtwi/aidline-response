/**
 * AidLine MySQL Backend API Client
 * Handles all communication with the Node.js/Express + MySQL backend.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function getToken(): string | null {
  return localStorage.getItem("aidline_token");
}

export function setToken(token: string): void {
  localStorage.setItem("aidline_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("aidline_token");
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...init } = options;

  let url = `${BASE_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    );
    if (qs.toString()) url += `?${qs}`;
  }

  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...init, headers });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(body?.error || `HTTP ${res.status}`);
  }
  return body;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { email: string; password: string; full_name: string; preferred_language?: string; phone?: string }) =>
    request<{ success: boolean; data: { token: string; user: any } }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ success: boolean; data: { token: string; user: any } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  anonymous: () =>
    request<{ success: boolean; data: { token: string; user: any } }>("/auth/anonymous", {
      method: "POST",
    }),

  me: () =>
    request<{ success: boolean; data: any }>("/auth/me"),

  updateMe: (data: Partial<{ full_name: string; phone: string; preferred_language: string }>) =>
    request<{ success: boolean }>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ── Service Requests ─────────────────────────────────────────────────────────

export const requestsApi = {
  list: (params?: { status?: string; type?: string; page?: number; pageSize?: number }) =>
    request<{ success: boolean; data: any }>("/requests", { params }),

  get: (id: string) =>
    request<{ success: boolean; data: any }>(`/requests/${id}`),

  create: (data: {
    type: "sos" | "medical" | "medication" | "humanitarian" | "general";
    title: string;
    description?: string;
    urgency?: "low" | "medium" | "high" | "critical";
    attachments?: any[];
  }) =>
    request<{ success: boolean; data: any }>("/requests", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: string, notes?: string) =>
    request<{ success: boolean }>(`/requests/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, notes }),
    }),

  cancel: (id: string) =>
    request<{ success: boolean }>(`/requests/${id}`, { method: "DELETE" }),
};

// ── Service Providers ────────────────────────────────────────────────────────

export const providersApi = {
  list: (params?: { type?: string; page?: number; pageSize?: number }) =>
    request<{ success: boolean; data: any }>("/providers", { params }),

  get: (id: string) =>
    request<{ success: boolean; data: any }>(`/providers/${id}`),

  getInventory: (id: string) =>
    request<{ success: boolean; data: any[] }>(`/providers/${id}/inventory`),

  searchMedications: (name: string) =>
    request<{ success: boolean; data: any[] }>("/providers/medications/search", {
      params: { name },
    }),
};

// ── Secure Messages ───────────────────────────────────────────────────────────

export const messagesApi = {
  list: (requestId: string) =>
    request<{ success: boolean; data: any[] }>(`/messages/${requestId}`),

  send: (requestId: string, content: string, attachments?: any[]) =>
    request<{ success: boolean; data: any }>(`/messages/${requestId}`, {
      method: "POST",
      body: JSON.stringify({ content, attachments }),
    }),

  unreadCount: (requestId: string) =>
    request<{ success: boolean; data: { unread: number } }>(`/messages/${requestId}/unread-count`),
};

// ── SOS ───────────────────────────────────────────────────────────────────────

export const sosApi = {
  list: () =>
    request<{ success: boolean; data: any[] }>("/sos"),

  myAlerts: () =>
    request<{ success: boolean; data: any[] }>("/sos/my"),

  send: (message?: string) =>
    request<{ success: boolean; data: any }>("/sos", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  updateStatus: (id: string, status: string) =>
    request<{ success: boolean }>(`/sos/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

// ── Medication ────────────────────────────────────────────────────────────────

export const medicationApi = {
  list: () =>
    request<{ success: boolean; data: any[] }>("/medication"),

  request: (data: { medication_name: string; urgency?: string; notes?: string }) =>
    request<{ success: boolean; data: any }>("/medication", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: string) =>
    request<{ success: boolean }>(`/medication/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

// ── Volunteers ────────────────────────────────────────────────────────────────

export const volunteersApi = {
  list: () =>
    request<{ success: boolean; data: any[] }>("/volunteers"),

  register: (data: { skills: string[]; bio?: string }) =>
    request<{ success: boolean; data: any }>("/volunteers", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: string) =>
    request<{ success: boolean }>(`/volunteers/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

// ── Analytics ────────────────────────────────────────────────────────────────

export const analyticsApi = {
  summary: () =>
    request<{ success: boolean; data: any }>("/analytics/summary"),

  trends: (days?: number) =>
    request<{ success: boolean; data: any[] }>("/analytics/trends", {
      params: days ? { days } : undefined,
    }),

  medicationShortages: () =>
    request<{ success: boolean; data: any[] }>("/analytics/medication-shortages"),

  providerWorkload: () =>
    request<{ success: boolean; data: any[] }>("/analytics/provider-workload"),

  sosStats: () =>
    request<{ success: boolean; data: any[] }>("/analytics/sos-stats"),
};

// ── Chat ──────────────────────────────────────────────────────────────────────

export const chatApi = {
  getConversations: () =>
    request<{ success: boolean; data: any[] }>("/chat/conversations"),

  createConversation: () =>
    request<{ success: boolean; data: any }>("/chat/conversations", { method: "POST" }),

  getMessages: (conversationId: string) =>
    request<{ success: boolean; data: any[] }>(`/chat/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: string, message: string) =>
    request<{ success: boolean; data: any }>(`/chat/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  updateStatus: (conversationId: string, status: string) =>
    request<{ success: boolean }>(`/chat/conversations/${conversationId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

// ── NGO Portal ────────────────────────────────────────────────────────────────

export const ngoApi = {
  action: (token: string, action: string, payload?: any) =>
    request<{ success: boolean; data?: any; message?: string }>("/ngo/action", {
      method: "POST",
      body: JSON.stringify({ token, action, payload }),
    }),
};
