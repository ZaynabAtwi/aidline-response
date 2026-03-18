import { RequestStatus, UrgencyLevel, ResourceStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

export async function getDashboardSummary() {
  const [
    totalClinics,
    totalShelters,
    totalVolunteers,
    activeVolunteers,
    pendingMedication,
    openSos,
    criticalMedication,
    activeGasStations,
    recentChatCount,
  ] = await Promise.all([
    prisma.clinic.count(),
    prisma.shelter.count(),
    prisma.volunteer.count(),
    prisma.volunteer.count({ where: { status: ResourceStatus.ACTIVE } }),
    prisma.medicationRequest.count({ where: { status: RequestStatus.PENDING } }),
    prisma.sOSRequest.count({ where: { status: { in: [RequestStatus.PENDING, RequestStatus.IN_PROGRESS] } } }),
    prisma.medicationRequest.count({ where: { urgency: UrgencyLevel.CRITICAL, status: RequestStatus.PENDING } }),
    prisma.gasStation.count({ where: { status: ResourceStatus.ACTIVE } }),
    prisma.chatMessage.count(),
  ]);

  return {
    clinics: totalClinics,
    shelters: totalShelters,
    volunteers: {
      total: totalVolunteers,
      active: activeVolunteers,
    },
    requests: {
      pendingMedication,
      openSos,
      criticalMedication,
    },
    gasStations: {
      active: activeGasStations,
    },
    chat: {
      totalMessages: recentChatCount,
    },
  };
}
