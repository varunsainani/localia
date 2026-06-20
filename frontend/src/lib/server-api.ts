// Server-only API helper for SSR metadata + JSON-LD. Runs at request time on
// dynamic routes (never at build), so it talks straight to the backend origin
// instead of the same-origin proxy. Failures return null so pages degrade
// gracefully (client components then render the live data + error states).
import "server-only";
import { getUserLocale } from "@/i18n/locale";
import type { ProviderDetail } from "./api";

const API = process.env.API_PROXY_TARGET || "http://localhost:4000";

async function serverGet<T>(path: string): Promise<T | null> {
  try {
    const locale = await getUserLocale();
    const res = await fetch(`${API}${path}`, {
      headers: { "X-Locale": locale },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchProviderServer(slug: string): Promise<ProviderDetail | null> {
  const data = await serverGet<{ provider: ProviderDetail }>(
    `/api/providers/${encodeURIComponent(slug)}`,
  );
  return data?.provider ?? null;
}
