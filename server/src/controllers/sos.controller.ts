import type { Request, Response } from "express";
import { z } from "zod";
import { createSosSchema, updateSosStatusSchema } from "../validators/sos.validator";
import * as sosService from "../services/sos.service";

export async function listSos(_req: Request, res: Response) {
  const requests = await sosService.listSosRequests();
  return res.status(200).json({
    success: true,
    data: requests,
  });
}

export async function createSos(req: Request, res: Response) {
  const payload = createSosSchema.parse(req.body);
  const request = await sosService.createSosRequest(payload);
  return res.status(201).json({
    success: true,
    data: request,
  });
}

export async function updateSosStatus(req: Request, res: Response) {
  const sosId = z.string().parse(req.params.id);
  const payload = updateSosStatusSchema.parse(req.body);
  const request = await sosService.updateSosStatus(sosId, payload.status);
  return res.status(200).json({
    success: true,
    data: request,
  });
}
