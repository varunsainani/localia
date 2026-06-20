import "express";
import type { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      // Set by the locale middleware.
      locale: string;
      t: (key: string, vars?: Record<string, string | number>) => string;
      // Set by the auth middleware (JWT session).
      userId?: string;
      // Set by requireAuth: the authenticated user's role.
      userRole?: Role;
    }
  }
}

export {};
