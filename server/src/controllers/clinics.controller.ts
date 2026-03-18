import type { Request, Response } from "express";
import { z } from "zod";
import * as clinicsService from "../services/clinics.service";

export async function listClinics(_req: Request, res: Response) {
  const clinics = await clinicsService.listClinics();
  return res.status(200).json({
    success: true,
    data: clinics,
  });
}

export async function getClinicById(req: Request, res: Response) {
  const clinicId = z.string().parse(req.params.id);
  const clinic = await clinicsService.getClinicById(clinicId);
  return res.status(200).json({
    success: true,
    data: clinic,
  });
}
