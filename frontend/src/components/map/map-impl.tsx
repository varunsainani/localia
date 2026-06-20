"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import Link from "next/link";
import {
  fixLeafletDefaultIcon,
  brandPinIcon,
  boundsFor,
  OSM_TILE_URL,
  OSM_ATTRIBUTION,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
} from "@/lib/maps";

export interface MapPoint {
  id: string;
  slug: string;
  lat: number;
  lng: number;
  businessName: string;
  headline?: string;
  city?: string;
  featured?: boolean;
}

// Keeps the view fitted to the current set of points as filters change.
function FitToPoints({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    const { center, zoom } = boundsFor(points);
    map.setView(center, zoom, { animate: true });
  }, [map, points]);
  return null;
}

export default function MapImpl({
  points,
  className,
  scrollWheelZoom = true,
  viewLabel,
}: {
  points: MapPoint[];
  className?: string;
  scrollWheelZoom?: boolean;
  viewLabel: string;
}) {
  fixLeafletDefaultIcon();
  const valid = points.filter(
    (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && (p.lat !== 0 || p.lng !== 0),
  );
  const initial = boundsFor(valid);

  return (
    <MapContainer
      center={initial.center.length ? initial.center : DEFAULT_CENTER}
      zoom={initial.zoom || DEFAULT_ZOOM}
      scrollWheelZoom={scrollWheelZoom}
      className={className ?? "h-full w-full"}
      style={{ minHeight: 0 }}
    >
      <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
      <FitToPoints points={valid} />
      {valid.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={brandPinIcon(p.featured)}>
          <Popup>
            <div className="min-w-44 p-3">
              <p className="text-sm font-semibold text-card-foreground">{p.businessName}</p>
              {p.headline && (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{p.headline}</p>
              )}
              {p.city && <p className="mt-1 text-xs text-muted-foreground">{p.city}</p>}
              <Link
                href={`/p/${p.slug}`}
                className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
              >
                {viewLabel} →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
