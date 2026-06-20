import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

const APP_URL = process.env.APP_URL || "https://localia.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/login", "/register"],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
