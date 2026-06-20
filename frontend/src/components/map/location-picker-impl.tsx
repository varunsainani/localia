"use client";

import "leaflet/dist/leaflet.css";
import { useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import type { Marker as LeafletMarker, LeafletMouseEvent } from "leaflet";
import {
  fixLeafletDefaultIcon,
  brandPinIcon,
  OSM_TILE_URL,
  OSM_ATTRIBUTION,
  DEFAULT_CENTER,
} from "@/lib/maps";

// Clicking the map moves the pin, too — handy on mobile where dragging is fiddly.
function ClickToSet({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerImpl({
  lat,
  lng,
  onChange,
  className,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  className?: string;
}) {
  fixLeafletDefaultIcon();
  const markerRef = useRef<LeafletMarker | null>(null);
  const hasPin = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
  const center: [number, number] = hasPin ? [lat, lng] : DEFAULT_CENTER;

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          const pos = marker.getLatLng();
          onChange(pos.lat, pos.lng);
        }
      },
    }),
    [onChange],
  );

  return (
    <MapContainer
      center={center}
      zoom={hasPin ? 13 : 4}
      scrollWheelZoom
      className={className ?? "h-full w-full"}
    >
      <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
      <ClickToSet onChange={onChange} />
      {hasPin && (
        <Marker
          draggable
          position={[lat, lng]}
          icon={brandPinIcon(true)}
          ref={markerRef}
          eventHandlers={eventHandlers}
        />
      )}
    </MapContainer>
  );
}
