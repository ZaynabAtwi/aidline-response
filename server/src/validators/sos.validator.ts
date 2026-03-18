import { RequestStatus } from "@prisma/client";
import { z } from "zod";

export const createSosSchema = z.object({
  userId: z.string().optional(),
  fullName: z.string().min(2).max(120),
  phone: z.string().min(6).max(30).optional(),
  district: z.string().min(2).max(120),
  emergencyType: z.string().min(2).max(150),
  notes: z.string().max(2000).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const updateSosStatusSchema = z.object({
  status: z.nativeEnum(RequestStatus),
});
