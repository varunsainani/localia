import type { Metadata } from "next";
import { HomeClient } from "./home-client";

// Thin server wrapper so the homepage (a client component) can still export
// metadata. Title/description/OG come from the root layout; here we add the
// canonical URL + og:url that the highest-value page was missing.
const APP_URL = process.env.APP_URL || "https://localia.app";

export function generateMetadata(): Metadata {
  return {
    alternates: { canonical: "/" },
    openGraph: { url: APP_URL },
  };
}

export default function HomePage() {
  return <HomeClient />;
}
