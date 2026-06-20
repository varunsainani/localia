import type { Request, Response, NextFunction } from "express";
import { localeFromRequest, t } from "../i18n";

// Resolves the request locale (X-Locale, then Accept-Language) and binds a
// translator at req.t for handlers and the error middleware.
export function locale(req: Request, _res: Response, next: NextFunction) {
  req.locale = localeFromRequest(req);
  req.t = (key, vars) => t(req.locale, key, vars);
  next();
}
