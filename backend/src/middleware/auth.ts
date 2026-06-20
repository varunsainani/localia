import type { Request, Response, NextFunction } from "express";
import type { Role } from "@prisma/client";
import { verifyAccessToken } from "../lib/tokens";
import { HttpError } from "../lib/http-error";
import { asyncHandler } from "../lib/async-handler";
import prisma from "../lib/prisma";

// Session guard: requires a valid JWT access token (Bearer) and loads the
// user's role onto the request so downstream role guards can authorize.
export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new HttpError(401, "errors.auth.authRequired");

  let sub: string;
  try {
    sub = verifyAccessToken(token).sub;
  } catch {
    throw new HttpError(401, "errors.auth.invalidSession");
  }

  const user = await prisma.user.findUnique({ where: { id: sub }, select: { id: true, role: true } });
  if (!user) throw new HttpError(401, "errors.auth.invalidSession");

  req.userId = user.id;
  req.userRole = user.role;
  next();
});

// Role guard: rejects unless the authenticated user's role is in `roles`.
// Must run after requireAuth.
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      throw new HttpError(403, "errors.auth.forbiddenRole", { code: "FORBIDDEN" });
    }
    next();
  };
}
