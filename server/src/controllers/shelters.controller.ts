import type { Request, Response } from "express";
import { z } from "zod";
import * as sheltersService from "../services/shelters.service";

export async function listShelters(_req: Request, res: Response) {
  const shelters = await sheltersService.listShelters();
  return res.status(200).json({
    success: true,
    data: shelters,
  });
}

export async function getShelterById(req: Request, res: Response) {
  const shelterId = z.string().parse(req.params.id);
  const shelter = await sheltersService.getShelterById(shelterId);
  return res.status(200).json({
    success: true,
    data: shelter,
  });
}
