import { apiRequest } from "./api";
import { createId, nowIso, readStore, writeStore } from "./mockDb";

const MOCK_SOS_KEY = "aidline_mock_sos";

export interface SosAlert {
  id: string;
  user_id: string;
  message: string | null;
  status: "active" | "responding" | "resolved" | "cancelled";
  created_at: string;
  responded_by?: string | null;
}

function getMockAlerts() {
  return readStore<SosAlert[]>(MOCK_SOS_KEY, []);
}

function saveMockAlerts(rows: SosAlert[]) {
  writeStore(MOCK_SOS_KEY, rows);
}

function normalizeAlert(raw: any): SosAlert {
  return {
    id: String(raw?.id ?? createId("sos")),
    user_id: String(raw?.user_id ?? ""),
    message: raw?.message ?? null,
    status: (raw?.status || "active") as SosAlert["status"],
    created_at: raw?.created_at ?? nowIso(),
    responded_by: raw?.responded_by ?? null,
  };
}

function extractList(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

export async function listSosAlerts(): Promise<SosAlert[]> {
  try {
    const payload = await apiRequest<any>("/sos");
    const rows = extractList(payload);
    if (rows.length > 0) return rows.map(normalizeAlert);
  } catch {
    // fallback
  }
  return getMockAlerts().sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function sendSos(input: { user_id: string; message?: string }): Promise<SosAlert> {
  try {
    const payload = await apiRequest<any>("/sos", {
      method: "POST",
      body: input,
    });
    return normalizeAlert(payload?.alert ?? payload?.data?.alert ?? payload?.data ?? payload);
  } catch {
    const rows = getMockAlerts();
    const created: SosAlert = {
      id: createId("sos"),
      user_id: input.user_id,
      message: input.message || null,
      status: "active",
      created_at: nowIso(),
      responded_by: null,
    };
    saveMockAlerts([created, ...rows]);
    return created;
  }
}

export async function updateSosStatus(id: string, status: SosAlert["status"]) {
  try {
    await apiRequest(`/sos/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
    return;
  } catch {
    const rows = getMockAlerts();
    saveMockAlerts(rows.map((row) => (row.id === id ? { ...row, status } : row)));
  }
}
