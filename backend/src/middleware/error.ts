import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import multer from "multer";
import { HttpError } from "../lib/http-error";
import { t, zodIssueMessage, DEFAULT_LOCALE } from "../i18n";

// Central error handler. Emits the SPEC error shape:
//   { error: { message, code?, details? } }
// where `details` is a flat field->message map for form validation.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const locale = req.locale || DEFAULT_LOCALE;

  if (err instanceof ZodError) {
    const details: Record<string, string> = {};
    for (const issue of err.issues) {
      const path = issue.path.join(".") || "_";
      if (!details[path]) details[path] = zodIssueMessage(issue, locale);
    }
    return res.status(400).json({
      error: { message: t(locale, "errors.common.invalidInput"), code: "VALIDATION", details },
    });
  }

  if (err instanceof multer.MulterError) {
    const key =
      err.code === "LIMIT_FILE_SIZE" ? "errors.upload.tooLarge" : "errors.upload.failed";
    return res.status(400).json({ error: { message: t(locale, key), code: err.code } });
  }

  if (err instanceof HttpError) {
    const body: { message: string; code?: string; details?: Record<string, string> } = {
      message: t(locale, err.publicMessage, err.vars),
    };
    if (err.code) body.code = err.code;
    if (err.details) body.details = err.details;
    return res.status(err.status).json({ error: body });
  }

  console.error(err);
  return res
    .status(500)
    .json({ error: { message: t(locale, "errors.common.internalServerError") } });
}
