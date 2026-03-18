import { RequestStatus, type Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";

interface CreateSosInput {
  userId?: string;
  fullName: string;
  phone?: string;
  district: string;
  emergencyType: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

export async function listSosRequests() {
  return prisma.sOSRequest.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createSosRequest(input: CreateSosInput) {
  const data: Prisma.SOSRequestCreateInput = {
    fullName: input.fullName,
    phone: input.phone ?? null,
    district: input.district,
    emergencyType: input.emergencyType,
    notes: input.notes ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    status: RequestStatus.PENDING,
  };

  if (input.userId) {
    data.user = { connect: { id: input.userId } };
  }

  return prisma.sOSRequest.create({ data });
}

export async function updateSosStatus(id: string, status: RequestStatus) {
  const request = await prisma.sOSRequest.findUnique({ where: { id } });
  if (!request) throw new ApiError("SOS request not found", 404);

  return prisma.sOSRequest.update({
    where: { id },
    data: { status },
  });
}
