import type { Request, Response } from "express";
import { UrgencyLevel } from "@prisma/client";
import { z } from "zod";
import * as medicationService from "../services/medication.service";

const createMedicationSchema = z.object({
  userId: z.string().optional(),
  medicationName: z.string().min(2).max(150),
  quantity: z.number().int().min(1).max(1000).default(1),
  urgency: z.nativeEnum(UrgencyLevel).default(UrgencyLevel.MEDIUM),
  district: z.string().min(2).max(120),
  notes: z.string().max(2000).optional(),
});

export async function listMedication(_req: Request, res: Response) {
  const requests = await medicationService.listMedicationRequests();
  return res.status(200).json({
    success: true,
    data: requests,
  });
}

export async function createMedication(req: Request, res: Response) {
  const payload = createMedicationSchema.parse(req.body);
  const request = await medicationService.createMedicationRequest(payload);
  return res.status(201).json({
    success: true,
    data: request,
  });
}
