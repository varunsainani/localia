// Leaflet helpers. Webpack/Next bundling breaks Leaflet's default marker icon
// (it resolves icon URLs relative to the CSS, which doesn't survive bundling),
// so we point the default icon at the CDN-hosted PNGs once, on the client.
import L from "leaflet";

let patched = false;

export function fixLeafletDefaultIcon() {
  if (patched || typeof window === "undefined") return;
  patched = true;
  // Remove the broken _getIconUrl so Leaflet uses the explicit URLs below.
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

// A branded emerald pin as a DivIcon — used for provider markers so they match
// the Localia accent rather than the default blue PNG.
export function brandPinIcon(highlighted = false) {
  const color = highlighted ? "#0d9488" : "#059669";
  const html = `
    <span style="position:relative;display:block;width:28px;height:38px;filter:drop-shadow(0 3px 4px rgba(0,0,0,.35))">
      <svg width="28" height="38" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.27 0 0 6.27 0 14c0 9.5 12.1 22.3 12.62 22.84a1.9 1.9 0 0 0 2.76 0C15.9 36.3 28 23.5 28 14 28 6.27 21.73 0 14 0Z" fill="${color}"/>
        <circle cx="14" cy="14" r="5.2" fill="#ffffff"/>
      </svg>
    </span>`;
  return L.divIcon({
    html,
    className: "localia-pin",
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -34],
  });
}

// Sensible default map center (Latin America) when no points are available.
export const DEFAULT_CENTER: [number, number] = [-15, -60];
export const DEFAULT_ZOOM = 3;

// OSM raster tiles — no API key required.
export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Compute a center + zoom from a list of points so all markers fit in view.
export function boundsFor(
  points: Array<{ lat: number; lng: number }>,
): { center: [number, number]; zoom: number } {
  const valid = points.filter(
    (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && (p.lat !== 0 || p.lng !== 0),
  );
  if (valid.length === 0) return { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM };
  if (valid.length === 1) return { center: [valid[0].lat, valid[0].lng], zoom: 12 };

  const lats = valid.map((p) => p.lat);
  const lngs = valid.map((p) => p.lng);
  const center: [number, number] = [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
  ];
  const span = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs));
  let zoom = 11;
  if (span > 60) zoom = 2;
  else if (span > 30) zoom = 3;
  else if (span > 12) zoom = 4;
  else if (span > 5) zoom = 5;
  else if (span > 2) zoom = 7;
  else if (span > 0.6) zoom = 9;
  else if (span > 0.2) zoom = 11;
  else zoom = 13;
  return { center, zoom };
}
