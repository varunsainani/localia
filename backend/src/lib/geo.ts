import { Prisma } from "@prisma/client";

const EARTH_RADIUS_KM = 6371;

// Haversine distance in km between two lat/lng points (used for facets/sanity;
// the primary distance computation happens in SQL — see haversineSql).
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.asin(Math.sqrt(a));
}

// Parameterized SQL fragment computing Haversine distance (km) from the origin
// point to a provider's ("lat","lng"). Safe to inject into a $queryRaw call.
export function haversineSql(lat: number, lng: number): Prisma.Sql {
  return Prisma.sql`(
    ${EARTH_RADIUS_KM} * 2 * asin(
      sqrt(
        power(sin(radians("Provider"."lat" - ${lat}) / 2), 2) +
        cos(radians(${lat})) * cos(radians("Provider"."lat")) *
        power(sin(radians("Provider"."lng" - ${lng}) / 2), 2)
      )
    )
  )`;
}
