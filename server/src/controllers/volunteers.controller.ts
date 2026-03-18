import type { Request, Response } from "express";
import { z } from "zod";
import { updateVolunteerStatusSchema, createVolunteerSchema } from "../validators/volunteers.validator";
import * as volunteersService from "../services/volunteers.service";

export async function listVolunteers(_req: Request, res: Response) {
  const volunteers = await volunteersService.listVolunteers();
  return res.status(200).json({
    success: true,
    data: volunteers,
  });
}

export async function createVolunteer(req: Request, res: Response) {
  const payload = createVolunteerSchema.parse(req.body);
  const volunteer = await volunteersService.createVolunteer(payload);
  return res.status(201).json({
    success: true,
    data: volunteer,
  });
}

export async function updateVolunteerStatus(req: Request, res: Response) {
  const volunteerId = z.string().parse(req.params.id);
  const payload = updateVolunteerStatusSchema.parse(req.body);
  const volunteer = await volunteersService.updateVolunteerStatus(volunteerId, payload.status);
  return res.status(200).json({
    success: true,
    data: volunteer,
  });
}
