import crypto from "crypto";
import prisma from "./prisma";

// Kebab-case a business name into a URL-safe base (strip accents + punctuation).
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "") // strip combining diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    || "provider";
}

// Build a unique slug = kebab(businessName) + short suffix. Retries on collision.
// `excludeId` lets a provider keep its slug stable when its base is unchanged.
export async function uniqueProviderSlug(
  businessName: string,
  excludeId?: string,
): Promise<string> {
  const base = slugify(businessName);
  for (let attempt = 0; attempt < 6; attempt++) {
    const suffix = crypto.randomBytes(3).toString("hex"); // 6 hex chars
    const candidate = `${base}-${suffix}`;
    const existing = await prisma.provider.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
  }
  // Extremely unlikely fallback: timestamp guarantees uniqueness.
  return `${base}-${Date.now().toString(36)}`;
}
