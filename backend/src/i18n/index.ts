import type { Request } from "express";
import type { ZodIssue } from "zod";
import en from "./en";
import es from "./es";
import pt from "./pt";

const catalogs: Record<string, Record<string, string>> = { en, es, pt };
export const DEFAULT_LOCALE = "en";
export const SUPPORTED = Object.keys(catalogs);

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    vars[key] != null ? String(vars[key]) : match,
  );
}

// Translate a key for a locale, falling back to English then the key itself.
export function t(locale: string, key: string, vars?: Record<string, string | number>): string {
  const catalog = catalogs[locale] || catalogs[DEFAULT_LOCALE];
  const template = catalog[key] || catalogs[DEFAULT_LOCALE][key] || key;
  return interpolate(template, vars);
}

// Resolve the request locale from X-Locale, then Accept-Language, then default.
export function localeFromRequest(req: Request): string {
  const explicit = String(req.headers["x-locale"] || "").trim().toLowerCase().slice(0, 2);
  if (SUPPORTED.includes(explicit)) return explicit;
  const accept = String(req.headers["accept-language"] || "");
  for (const part of accept.split(",")) {
    const lang = part.split(";")[0].trim().toLowerCase().slice(0, 2);
    if (SUPPORTED.includes(lang)) return lang;
  }
  return DEFAULT_LOCALE;
}

// Map a Zod issue to a localized message. Custom messages are authored as
// translation keys ("validation.*"); built-in issues map by their code.
export function zodIssueMessage(issue: ZodIssue, locale: string): string {
  if (typeof issue.message === "string" && issue.message.startsWith("validation.")) {
    return t(locale, issue.message);
  }
  switch (issue.code) {
    case "invalid_type":
      return t(locale, "validation.common.required");
    case "invalid_string":
      return t(
        locale,
        (issue as { validation?: string }).validation === "email"
          ? "validation.common.invalidEmail"
          : "validation.common.invalid",
      );
    case "too_small":
      return t(
        locale,
        (issue as { type?: string }).type === "number"
          ? "validation.common.invalidNumber"
          : "validation.common.minLength",
      );
    case "too_big":
      return t(locale, "validation.common.maxLength");
    case "invalid_enum_value":
      return t(locale, "validation.common.invalid");
    default:
      return t(locale, "validation.common.invalid");
  }
}
