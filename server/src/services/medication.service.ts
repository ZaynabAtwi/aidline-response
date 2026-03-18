import { RequestStatus, UrgencyLevel, type Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

interface CreateMedicationInput {
  userId?: string;
  medicationName: string;
  quantity: number;
  urgency: UrgencyLevel;
  district: string;
  notes?: string;
}

export async function listMedicationRequests() {
  return prisma.medicationRequest.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createMedicationRequest(input: CreateMedicationInput) {
  const data: Prisma.MedicationRequestCreateInput = {
    medicationName: input.medicationName,
    quantity: input.quantity,
    urgency: input.urgency,
    district: input.district,
    notes: input.notes ?? null,
    status: RequestStatus.PENDING,
  };

  if (input.userId) {
    data.user = { connect: { id: input.userId } };
  }

  return prisma.medicationRequest.create({ data });
}
