import { prisma } from "../lib/prisma";

export async function listGasStations() {
  return prisma.gasStation.findMany({
    orderBy: { updatedAt: "desc" },
  });
}
