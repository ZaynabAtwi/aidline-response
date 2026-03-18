import type { Request, Response } from "express";
import * as dashboardService from "../services/dashboard.service";

export async function getSummary(_req: Request, res: Response) {
  const summary = await dashboardService.getDashboardSummary();
  return res.status(200).json({
    success: true,
    data: summary,
  });
}
