import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";

export async function listClinics() {
  return prisma.clinic.findMany({
    orderBy: { updatedAt: "desc" },
  });
}

export async function getClinicById(id: string) {
  const clinic = await prisma.clinic.findUnique({ where: { id } });
  if (!clinic) throw new ApiError("Clinic not found", 404);
  return clinic;
}
