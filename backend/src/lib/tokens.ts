import crypto from "crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { JWT_ACCESS_SECRET, ACCESS_TOKEN_TTL } from "./env";

export interface AccessPayload {
  sub: string;
}

// --- Dashboard session (JWT access + opaque refresh) -----------------------

export function signAccessToken(user: { id: string }): string {
  return jwt.sign({ sub: user.id }, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, JWT_ACCESS_SECRET) as AccessPayload;
}

// Opaque refresh token: a long random value handed to the client; we persist
// only its SHA-256 hash so a database leak cannot reveal usable tokens.
export function generateRefreshToken() {
  const raw = crypto.randomBytes(40).toString("hex");
  return {
    raw,
    hash: sha256(raw),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  };
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
