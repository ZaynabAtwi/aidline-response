import { apiRequest } from "./api";
import { createId, nowIso, readStore, writeStore } from "./mockDb";
import { listMedicationRequests, updateMedicationRequestStatus } from "./medicationService";
import { listSosAlerts, updateSosStatus } from "./sosService";

const NGO_NOTES_KEY = "aidline_mock_ngo_notes";

interface NgoNote {
  id: string;
  content: string;
  created_at: string;
}

function getMockNotes() {
  return readStore<NgoNote[]>(NGO_NOTES_KEY, []);
}

function saveMockNotes(rows: NgoNote[]) {
  writeStore(NGO_NOTES_KEY, rows);
}

export async function secureAction(token: string, action: string, payload?: any): Promise<any> {
  if (!token?.trim()) {
    throw new Error("Access token is required");
  }

  try {
    const res = await apiRequest<any>("/ngo/action", {
      method: "POST",
      body: { token, action, payload },
    });
    return res?.data ?? res;
  } catch {
    switch (action) {
      case "get_medication_requests":
        return listMedicationRequests();

      case "get_sos_alerts":
        return listSosAlerts();

      case "get_requests": {
        const [meds, sos] = await Promise.all([listMedicationRequests(), listSosAlerts()]);
        return [
          ...meds.map((row) => ({
            id: row.id,
            type: "medication",
            title: row.medication_name,
            urgency: row.urgency,
            status: row.status,
            created_at: row.created_at,
            category: "medication_need",
            priority_score: row.urgency === "critical" ? 90 : row.urgency === "high" ? 70 : 40,
          })),
          ...sos.map((row) => ({
            id: row.id,
            type: "sos",
            title: row.message || "SOS Alert",
            urgency: "critical",
            status: row.status,
            created_at: row.created_at,
            category: "medical_emergency",
            priority_score: row.status === "active" ? 95 : 65,
          })),
        ].sort((a, b) => b.created_at.localeCompare(a.created_at));
      }

      case "update_sos_status":
        await updateSosStatus(payload?.id, payload?.status);
        return { success: true };

      case "update_med_status":
        await updateMedicationRequestStatus(payload?.id, payload?.status);
        return { success: true };

      case "get_notes":
        return getMockNotes().sort((a, b) => b.created_at.localeCompare(a.created_at));

      case "add_note": {
        const notes = getMockNotes();
        const created = {
          id: createId("note"),
          content: String(payload?.content || ""),
          created_at: nowIso(),
        };
        saveMockNotes([created, ...notes]);
        return created;
      }

      default:
        throw new Error(`Unsupported NGO action: ${action}`);
    }
  }
}
