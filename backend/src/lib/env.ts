// Centralized env access with sensible local defaults.
// Fail fast in production rather than booting with a well-known signing secret.
const IS_PRODUCTION = process.env.NODE_ENV === "production";

if (!process.env.JWT_ACCESS_SECRET && IS_PRODUCTION) {
  throw new Error("JWT_ACCESS_SECRET is required in production");
}

export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev-insecure-change-me";

export const APP_URL = process.env.APP_URL || "http://localhost:3000";

// Validate ACCESS_TOKEN_TTL at boot. Accept either a jsonwebtoken duration
// string ("30m", "15s", "7d", "2h") or a positive integer string (seconds).
// On anything invalid, warn and fall back to "30m" rather than crashing — a
// bad TTL shouldn't take the whole service down.
function resolveAccessTokenTtl(): string {
  const raw = process.env.ACCESS_TOKEN_TTL;
  if (!raw) return "30m";
  const isDuration = /^\d+[smhd]$/.test(raw);
  const isPositiveInt = /^\d+$/.test(raw) && Number(raw) > 0;
  if (isDuration || isPositiveInt) return raw;
  console.warn(`Invalid ACCESS_TOKEN_TTL "${raw}"; falling back to "30m".`);
  return "30m";
}

export const ACCESS_TOKEN_TTL = resolveAccessTokenTtl();

// CORS: never default to "*" in production. Prefer an explicit CORS_ORIGIN;
// otherwise fall back to APP_URL (restrictive-by-default), never wildcard.
// We deliberately do NOT throw here: a missing CORS env var should not take the
// whole service down, and the frontend reaches the API through a same-origin
// /api proxy (no browser cross-origin call), so a restrictive origin is safe.
// "*" is only honored when not running in production.
function resolveCorsOrigin(): string {
  const explicit = process.env.CORS_ORIGIN;
  if (IS_PRODUCTION) {
    if (explicit === "*") {
      console.warn('CORS_ORIGIN="*" ignored in production; using a restrictive origin instead.');
      return APP_URL;
    }
    // Explicit origin if provided, otherwise APP_URL (never "*").
    return explicit || APP_URL;
  }
  return explicit || "*";
}

export const CORS_ORIGIN = resolveCorsOrigin();

export const PORT = Number(process.env.PORT || 4000);
export const NODE_ENV = process.env.NODE_ENV || "development";
export const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || "";
