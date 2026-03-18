import type { Request, Response } from "express";
import { loginSchema, registerSchema } from "../validators/auth.validator";
import * as authService from "../services/auth.service";
import { ApiError } from "../utils/ApiError";

export async function register(req: Request, res: Response) {
  const payload = registerSchema.parse(req.body);
  const result = await authService.register(payload);
  return res.status(201).json({
    success: true,
    data: result,
  });
}

export async function login(req: Request, res: Response) {
  const payload = loginSchema.parse(req.body);
  const result = await authService.login(payload);
  return res.status(200).json({
    success: true,
    data: result,
  });
}

export async function me(req: Request, res: Response) {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const user = await authService.getCurrentUser(req.user.id);
  return res.status(200).json({
    success: true,
    data: { user },
  });
}
