/**
 * AidLine API client for MySQL-backed request routing.
 * Use when VITE_API_URL is set; otherwise the app uses Supabase directly.
 */

const API_BASE = import.meta.env.VITE_API_URL || "";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "API error");
  }
  return res.json();
}

export const api = {
  requests: {
    create: (data: { user_id: string; request_type: string; description?: string; urgency?: string }) =>
      fetchApi<{ id: string }>("/api/requests", { method: "POST", body: JSON.stringify(data) }),
    list: (params?: { user_id?: string; status?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return fetchApi<unknown[]>(`/api/requests${q ? `?${q}` : ""}`);
    },
  },
  sos: {
    create: (data: { user_id: string; message?: string }) =>
      fetchApi<{ id: string }>("/api/sos", { method: "POST", body: JSON.stringify(data) }),
    list: () => fetchApi<unknown[]>("/api/sos"),
    updateStatus: (id: string, status: string) =>
      fetchApi(`/api/sos/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  },
  medicationRequests: {
    create: (data: { user_id: string; medication_name: string; urgency?: string; notes?: string }) =>
      fetchApi<{ id: string }>("/api/medication-requests", { method: "POST", body: JSON.stringify(data) }),
    list: (userId?: string) =>
      fetchApi<unknown[]>(`/api/medication-requests${userId ? `?user_id=${encodeURIComponent(userId)}` : ""}`),
    updateStatus: (id: string, status: string) =>
      fetchApi(`/api/medication-requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  },
  volunteers: {
    create: (data: { user_id: string; skills: string[]; bio?: string }) =>
      fetchApi<{ id: string }>("/api/volunteers", { method: "POST", body: JSON.stringify(data) }),
    list: () => fetchApi<unknown[]>("/api/volunteers"),
  },
  shelters: () => fetchApi<unknown[]>("/api/shelters"),
  clinics: () => fetchApi<unknown[]>("/api/clinics"),
  pharmacies: () => fetchApi<unknown[]>("/api/pharmacies"),
};

export function useMysqlApi(): boolean {
  return !!API_BASE;
}
