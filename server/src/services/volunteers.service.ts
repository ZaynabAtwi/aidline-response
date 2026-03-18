import { ResourceStatus, type Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";

interface CreateVolunteerInput {
  userId?: string;
  fullName: string;
  phone?: string;
  district: string;
  skills: string[];
  availability: boolean;
  status?: ResourceStatus;
  latitude?: number;
  longitude?: number;
}

export async function listVolunteers() {
  return prisma.volunteer.findMany({
    orderBy: { updatedAt: "desc" },
  });
}

export async function createVolunteer(input: CreateVolunteerInput) {
  const data: Prisma.VolunteerCreateInput = {
    fullName: input.fullName,
    phone: input.phone ?? null,
    district: input.district,
    skills: input.skills,
    availability: input.availability,
    status: input.status ?? ResourceStatus.ACTIVE,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
  };

  if (input.userId) {
    data.user = { connect: { id: input.userId } };
  }

  return prisma.volunteer.create({ data });
}

export async function updateVolunteerStatus(id: string, status: ResourceStatus) {
  const volunteer = await prisma.volunteer.findUnique({ where: { id } });
  if (!volunteer) throw new ApiError("Volunteer not found", 404);

  return prisma.volunteer.update({
    where: { id },
    data: { status },
  });
}
