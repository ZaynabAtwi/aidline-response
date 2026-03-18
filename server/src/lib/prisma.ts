import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __aidlinePrisma: PrismaClient | undefined;
}

export const prisma =
  global.__aidlinePrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__aidlinePrisma = prisma;
}
