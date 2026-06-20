"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import type { MapPoint } from "./map-impl";

export type { MapPoint } from "./map-impl";

// Leaflet touches `window` on import, so the map is client-only with SSR off.
const MapImpl = dynamic(() => import("./map-impl"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
      <MapPin className="h-6 w-6 animate-pulse" />
    </div>
  ),
});

export function ProviderMap({
  points,
  className,
  scrollWheelZoom = true,
}: {
  points: MapPoint[];
  className?: string;
  scrollWheelZoom?: boolean;
}) {
  const t = useTranslations("common");
  return (
    <MapImpl
      points={points}
      className={className}
      scrollWheelZoom={scrollWheelZoom}
      viewLabel={t("viewProfile")}
    />
  );
}
