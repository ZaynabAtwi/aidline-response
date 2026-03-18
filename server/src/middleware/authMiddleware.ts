import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt";
import { ApiError } from "../utils/ApiError";

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new ApiError("Authorization token required", 401));
  }

  const token = header.slice("Bearer ".length).trim();
  const payload = verifyAccessToken(token);
  req.user = {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  };
  return next();
}

export function requireRoles(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ApiError("Unauthorized", 401));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError("Forbidden", 403));
    }
    return next();
  };
}
