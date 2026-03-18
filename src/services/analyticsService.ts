import { apiRequest } from "./api";
import { listProviders } from "./providersService";
import { listVolunteers } from "./volunteersService";
import { listSosAlerts } from "./sosService";
import { listMedicationRequests } from "./medicationService";

export interface AnalyticsSummary {
  requests: {
    total_requests: number;
    resolved_requests: number;
    active_requests: number;
    critical_requests: number;
    sos_count: number;
    medical_count: number;
    medication_count: number;
    humanitarian_count: number;
  };
  providers: {
    active_providers: number;
  };
  volunteers: {
    available_volunteers: number;
    assigned_volunteers: number;
  };
}

function normalizeSummary(raw: any): AnalyticsSummary {
  const requests = raw?.requests || {};
  const providers = raw?.providers || {};
  const volunteers = raw?.volunteers || {};

  return {
    requests: {
      total_requests: Number(requests.total_requests ?? 0),
      resolved_requests: Number(requests.resolved_requests ?? 0),
      active_requests: Number(requests.active_requests ?? 0),
      critical_requests: Number(requests.critical_requests ?? 0),
      sos_count: Number(requests.sos_count ?? 0),
      medical_count: Number(requests.medical_count ?? 0),
      medication_count: Number(requests.medication_count ?? 0),
      humanitarian_count: Number(requests.humanitarian_count ?? 0),
    },
    providers: {
      active_providers: Number(providers.active_providers ?? 0),
    },
    volunteers: {
      available_volunteers: Number(volunteers.available_volunteers ?? 0),
      assigned_volunteers: Number(volunteers.assigned_volunteers ?? 0),
    },
  };
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  try {
    const payload = await apiRequest<any>("/analytics/summary");
    return normalizeSummary(payload?.data ?? payload);
  } catch {
    const providers = await listProviders();
    const volunteers = await listVolunteers();
    const sos = await listSosAlerts();
    const meds = await listMedicationRequests();

    const totalRequests = sos.length + meds.length;
    const criticalRequests =
      sos.filter((alert) => alert.status === "active").length +
      meds.filter((request) => request.urgency === "critical").length;

    return {
      requests: {
        total_requests: totalRequests,
        resolved_requests: sos.filter((alert) => alert.status === "resolved").length,
        active_requests: sos.filter((alert) => alert.status === "active").length,
        critical_requests: criticalRequests,
        sos_count: sos.length,
        medical_count: 0,
        medication_count: meds.length,
        humanitarian_count: 0,
      },
      providers: {
        active_providers: providers.filter((provider) => provider.is_active).length,
      },
      volunteers: {
        available_volunteers: volunteers.filter((volunteer) => volunteer.status === "available").length,
        assigned_volunteers: volunteers.filter((volunteer) => volunteer.status === "assigned").length,
      },
    };
  }
}

export async function getMedicationShortages(): Promise<Array<{
  medication_name: string;
  pending_requests: number;
  critical_requests: number;
}>> {
  try {
    const payload = await apiRequest<any>("/analytics/medication-shortages");
    const rows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    return rows.map((row: any) => ({
      medication_name: String(row.medication_name ?? "Unknown"),
      pending_requests: Number(row.pending_requests ?? 0),
      critical_requests: Number(row.critical_requests ?? 0),
    }));
  } catch {
    const requests = await listMedicationRequests();
    const grouped = new Map<string, { pending: number; critical: number }>();
    requests.forEach((request) => {
      const current = grouped.get(request.medication_name) || { pending: 0, critical: 0 };
      if (request.status === "pending") current.pending += 1;
      if (request.urgency === "critical") current.critical += 1;
      grouped.set(request.medication_name, current);
    });

    return Array.from(grouped.entries())
      .map(([medicationName, counts]) => ({
        medication_name: medicationName,
        pending_requests: counts.pending,
        critical_requests: counts.critical,
      }))
      .sort((a, b) => b.pending_requests - a.pending_requests);
  }
}
