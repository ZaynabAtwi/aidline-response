import type { Request, Response } from "express";
import * as usersService from "../services/users.service";
import { ApiError } from "../utils/ApiError";

export async function getMe(req: Request, res: Response) {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  const user = await usersService.getMyUserProfile(req.user.id);
  return res.status(200).json({
    success: true,
    data: user,
  });
}
