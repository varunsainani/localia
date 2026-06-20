import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../lib/http-error";

// Dependency-free in-memory fixed-window rate limiter.
//
// Each client is keyed by `req.ip` + the limiter `label`, so different routes
// (e.g. "auth" vs "search") maintain independent counters. Within a window the
// count increments; once it exceeds `max` we throw a localized 429 through the
// existing error pipeline and set a `Retry-After` header (seconds).
//
// NOTE: state lives in this process's memory. On serverless (multiple/ephemeral
// instances) this is per-instance and therefore best-effort only — a determined
// client spread across instances can exceed the global limit. For hard limits
// use a shared store (Redis). This is intended as a cheap first line of defense.

interface Bucket {
  count: number;
  // Epoch ms when the current fixed window expires and the count resets.
  resetAt: number;
}

export function rateLimit(opts: { windowMs: number; max: number; label: string }) {
  const { windowMs, max, label } = opts;
  const buckets = new Map<string, Bucket>();

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    const now = Date.now();
    const key = `${label}:${req.ip ?? "unknown"}`;

    // Lazy expiry: purge any expired entries on access so the Map doesn't grow
    // unbounded. Cheap because the catalog of active keys is small in practice.
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      throw new HttpError(429, "errors.common.tooManyRequests", { code: "RATE_LIMITED" });
    }

    next();
  };
}
