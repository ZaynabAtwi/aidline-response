import type { Request, Response } from "express";
import * as gasStationsService from "../services/gasStations.service";

export async function listGasStations(_req: Request, res: Response) {
  const stations = await gasStationsService.listGasStations();
  return res.status(200).json({
    success: true,
    data: stations,
  });
}
