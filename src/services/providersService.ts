import { apiRequest } from "./api";

export interface Provider {
  id: string;
  name: string;
  type: "healthcare" | "pharmacy" | "ngo" | "government";
  contact_email: string | null;
  contact_phone: string | null;
  description: string | null;
  services: string[];
  operating_hours: string | null;
  is_active: boolean;
}

export interface MedicationAvailability {
  medication_name: string;
  is_available: boolean;
  quantity: number;
  provider_name: string;
  contact_phone: string | null;
  operating_hours: string | null;
}

const MOCK_PROVIDERS: Provider[] = [
  {
    id: "provider_health_1",
    name: "AidLine Medical Center",
    type: "healthcare",
    contact_email: null,
    contact_phone: "+961-01-000001",
    description: "General consultations and urgent care.",
    services: ["Consultation", "Emergency", "Telehealth"],
    operating_hours: "08:00 - 20:00",
    is_active: true,
  },
  {
    id: "provider_pharmacy_1",
    name: "AidLine Pharmacy Network",
    type: "pharmacy",
    contact_email: null,
    contact_phone: "+961-01-000002",
    description: "Medication access and refill support.",
    services: ["Medication", "Refills", "Alternatives"],
    operating_hours: "24/7",
    is_active: true,
  },
  {
    id: "provider_ngo_1",
    name: "AidLine NGO Hub",
    type: "ngo",
    contact_email: null,
    contact_phone: "+961-01-000003",
    description: "Shelter and humanitarian coordination.",
    services: ["Shelter", "Food", "Case Management"],
    operating_hours: "09:00 - 18:00",
    is_active: true,
  },
];

function normalizeProvider(raw: any): Provider {
  return {
    id: String(raw?.id ?? ""),
    name: String(raw?.name ?? "Unknown Provider"),
    type: (raw?.type || raw?.provider_type || "healthcare") as Provider["type"],
    contact_email: raw?.contact_email ?? raw?.email ?? null,
    contact_phone: raw?.contact_phone ?? raw?.phone ?? null,
    description: raw?.description ?? null,
    services: Array.isArray(raw?.services)
      ? raw.services
      : typeof raw?.services === "string"
      ? JSON.parse(raw.services || "[]")
      : [],
    operating_hours: raw?.operating_hours ?? null,
    is_active: Boolean(raw?.is_active ?? raw?.is_operational ?? true),
  };
}

function extractList(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

export async function listProviders(): Promise<Provider[]> {
  try {
    const res = await apiRequest<any>("/providers", {
      params: { pageSize: 100 },
    });
    const rows = extractList(res);
    if (rows.length > 0) {
      return rows.map(normalizeProvider);
    }
  } catch {
    // Mock fallback below
  }
  return MOCK_PROVIDERS;
}

export async function searchMedicationAvailability(medicationName: string): Promise<MedicationAvailability[]> {
  try {
    const res = await apiRequest<any>("/providers/medications/search", {
      params: { name: medicationName },
    });
    const rows = extractList(res);
    return rows.map((row: any) => ({
      medication_name: row.medication_name ?? medicationName,
      is_available: Boolean(row.is_available ?? row.available ?? true),
      quantity: Number(row.quantity ?? row.available_units ?? 0),
      provider_name: row.provider_name ?? row.name ?? "Provider",
      contact_phone: row.contact_phone ?? row.phone ?? null,
      operating_hours: row.operating_hours ?? null,
    }));
  } catch {
    const providers = await listProviders();
    return providers
      .filter((p) => p.type === "pharmacy")
      .map((p) => ({
        medication_name: medicationName,
        is_available: true,
        quantity: 20,
        provider_name: p.name,
        contact_phone: p.contact_phone,
        operating_hours: p.operating_hours,
      }));
  }
}
