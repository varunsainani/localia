// Centralized env access with sensible local defaults.
// Fail fast in production rather than booting with a well-known signing secret.
if (!process.env.JWT_ACCESS_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_ACCESS_SECRET is required in production");
}

export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev-insecure-change-me";
export const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "30m";
export const APP_URL = process.env.APP_URL || "http://localhost:3000";
export const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
export const PORT = Number(process.env.PORT || 4000);
export const NODE_ENV = process.env.NODE_ENV || "development";
export const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || "";
