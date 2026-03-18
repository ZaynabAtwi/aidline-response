import { apiRequest } from "./api";
import { createId, nowIso, readStore, writeStore } from "./mockDb";
import { searchMedicationAvailability, type MedicationAvailability } from "./providersService";

const MOCK_MEDICATION_REQUESTS_KEY = "aidline_mock_medication_requests";

export interface MedicationRequest {
  id: string;
  user_id: string;
  medication_name: string;
  urgency: "low" | "medium" | "high" | "critical";
  status: "pending" | "approved" | "fulfilled" | "cancelled";
  created_at: string;
  notes: string | null;
}

function getMockRequests() {
  return readStore<MedicationRequest[]>(MOCK_MEDICATION_REQUESTS_KEY, []);
}

function saveMockRequests(rows: MedicationRequest[]) {
  writeStore(MOCK_MEDICATION_REQUESTS_KEY, rows);
}

function normalizeRequest(raw: any): MedicationRequest {
  return {
    id: String(raw?.id ?? createId("medreq")),
    user_id: String(raw?.user_id ?? ""),
    medication_name: String(raw?.medication_name ?? "Unknown"),
    urgency: (raw?.urgency || "medium") as MedicationRequest["urgency"],
    status: (raw?.status || "pending") as MedicationRequest["status"],
    created_at: raw?.created_at ?? nowIso(),
    notes: raw?.notes ?? null,
  };
}

function extractList(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

export async function listMedicationRequests(userId?: string): Promise<MedicationRequest[]> {
  try {
    const payload = await apiRequest<any>("/medication", {
      params: userId ? { user_id: userId } : undefined,
    });
    const rows = extractList(payload);
    if (rows.length > 0) {
      return rows.map(normalizeRequest);
    }
  } catch {
    // fallback
  }

  const rows = getMockRequests();
  return userId ? rows.filter((row) => row.user_id === userId) : rows;
}

export async function submitMedicationRequest(input: {
  user_id: string;
  medication_name: string;
  urgency: MedicationRequest["urgency"];
  notes?: string;
}): Promise<MedicationRequest> {
  try {
    const payload = await apiRequest<any>("/medication", {
      method: "POST",
      body: {
        user_id: input.user_id,
        medication_name: input.medication_name,
        urgency: input.urgency,
        notes: input.notes,
      },
    });
    return normalizeRequest(payload?.data ?? payload);
  } catch {
    const rows = getMockRequests();
    const created: MedicationRequest = {
      id: createId("medreq"),
      user_id: input.user_id,
      medication_name: input.medication_name,
      urgency: input.urgency,
      status: "pending",
      created_at: nowIso(),
      notes: input.notes || null,
    };
    saveMockRequests([created, ...rows]);
    return created;
  }
}

export async function updateMedicationRequestStatus(
  id: string,
  status: MedicationRequest["status"]
): Promise<void> {
  try {
    await apiRequest(`/medication/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
    return;
  } catch {
    const rows = getMockRequests();
    saveMockRequests(rows.map((row) => (row.id === id ? { ...row, status } : row)));
  }
}

export async function getMedicationAvailability(medicationName: string): Promise<MedicationAvailability[]> {
  return searchMedicationAvailability(medicationName);
}
