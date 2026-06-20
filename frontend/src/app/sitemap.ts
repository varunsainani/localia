import type { MetadataRoute } from "next";

// Dynamic: generated at request time so the build never calls the API. We pull
// approved providers + categories from the backend; on failure we still return
// the static routes so the sitemap is always valid.
export const dynamic = "force-dynamic";

const APP_URL = process.env.APP_URL || "https://localia.app";
const API = process.env.API_PROXY_TARGET || "http://localhost:4000";

async function safeGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [
    { url: APP_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${APP_URL}/search`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${APP_URL}/categories`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  const cats = await safeGet<{ categories: { slug: string }[] }>("/api/categories");
  for (const c of cats?.categories ?? []) {
    routes.push({
      url: `${APP_URL}/category/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  const providers = await safeGet<{ items: { slug: string }[] }>("/api/providers?pageSize=500");
  for (const p of providers?.items ?? []) {
    routes.push({
      url: `${APP_URL}/p/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return routes;
}
