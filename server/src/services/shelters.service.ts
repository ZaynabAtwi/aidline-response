import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";

export async function listShelters() {
  return prisma.shelter.findMany({
    orderBy: { updatedAt: "desc" },
  });
}

export async function getShelterById(id: string) {
  const shelter = await prisma.shelter.findUnique({ where: { id } });
  if (!shelter) throw new ApiError("Shelter not found", 404);
  return shelter;
}
