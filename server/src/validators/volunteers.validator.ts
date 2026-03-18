import { ResourceStatus } from "@prisma/client";
import { z } from "zod";

export const createVolunteerSchema = z.object({
  userId: z.string().optional(),
  fullName: z.string().min(2).max(120),
  phone: z.string().min(6).max(30).optional(),
  district: z.string().min(2).max(120),
  skills: z.array(z.string().min(1)).min(1),
  availability: z.boolean().default(true),
  status: z.nativeEnum(ResourceStatus).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const updateVolunteerStatusSchema = z.object({
  status: z.nativeEnum(ResourceStatus),
});
