"use client";

import { useFormatter } from "next-intl";

// Locale-aware formatting bound to the active locale. The locale controls date
// styling, grouping, and the wording of relative times.
export function useAppFormat() {
  const f = useFormatter();
  return {
    number: (n: number) => f.number(n),
    decimal: (n: number, digits = 1) =>
      f.number(n, { minimumFractionDigits: digits, maximumFractionDigits: digits }),
    relativeTime: (iso: string, now: number) => f.relativeTime(new Date(iso), now),
    date: (iso: string) =>
      f.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }),
    dateTime: (iso: string) =>
      f.dateTime(new Date(iso), {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      }),
  };
}
