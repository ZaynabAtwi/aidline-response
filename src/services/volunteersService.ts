import { apiRequest } from "./api";
import { createId, nowIso, readStore, writeStore } from "./mockDb";

const MOCK_VOLUNTEERS_KEY = "aidline_mock_volunteers";

export interface Volunteer {
  id: string;
  user_id: string;
  skills: string[];
  status: "available" | "assigned" | "unavailable";
  rating: number | null;
  bio: string | null;
  full_name?: string | null;
  created_at?: string;
}

function normalizeVolunteer(raw: any): Volunteer {
  return {
    id: String(raw?.id ?? createId("vol")),
    user_id: String(raw?.user_id ?? ""),
    skills: Array.isArray(raw?.skills)
      ? raw.skills
      : typeof raw?.skills === "string"
      ? JSON.parse(raw.skills || "[]")
      : [],
    status: (raw?.status || "available") as Volunteer["status"],
    rating: raw?.rating === null || raw?.rating === undefined ? null : Number(raw.rating),
    bio: raw?.bio ?? null,
    full_name: raw?.full_name ?? null,
    created_at: raw?.created_at ?? nowIso(),
  };
}

function getMockVolunteers() {
  return readStore<Volunteer[]>(MOCK_VOLUNTEERS_KEY, []);
}

function saveMockVolunteers(rows: Volunteer[]) {
  writeStore(MOCK_VOLUNTEERS_KEY, rows);
}

function extractList(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

export async function listVolunteers(): Promise<Volunteer[]> {
  try {
    const payload = await apiRequest<any>("/volunteers");
    const rows = extractList(payload);
    if (rows.length > 0) return rows.map(normalizeVolunteer);
  } catch {
    // fallback
  }
  return getMockVolunteers();
}

export async function registerVolunteer(input: {
  user_id: string;
  skills: string[];
  bio?: string;
}): Promise<Volunteer> {
  try {
    const payload = await apiRequest<any>("/volunteers", {
      method: "POST",
      body: input,
    });
    return normalizeVolunteer(payload?.data ?? payload);
  } catch {
    const rows = getMockVolunteers();
    const volunteer: Volunteer = {
      id: createId("vol"),
      user_id: input.user_id,
      skills: input.skills,
      status: "available",
      rating: null,
      bio: input.bio || null,
      full_name: null,
      created_at: nowIso(),
    };
    saveMockVolunteers([volunteer, ...rows.filter((row) => row.user_id !== input.user_id)]);
    return volunteer;
  }
}

export async function updateVolunteerStatus(id: string, status: Volunteer["status"]): Promise<void> {
  try {
    await apiRequest(`/volunteers/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
    return;
  } catch {
    const rows = getMockVolunteers();
    saveMockVolunteers(rows.map((row) => (row.id === id ? { ...row, status } : row)));
  }
}
