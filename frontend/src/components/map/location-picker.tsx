"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

const LocationPickerImpl = dynamic(() => import("./location-picker-impl"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
      <MapPin className="h-6 w-6 animate-pulse" />
    </div>
  ),
});

export function LocationPicker(props: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  className?: string;
}) {
  return <LocationPickerImpl {...props} />;
}
