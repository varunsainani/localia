// Small, locale-agnostic formatting helpers used outside React components
// (e.g. building WhatsApp links, JSON-LD). For locale-aware number/date
// formatting inside components use useAppFormat (src/i18n/use-app-format.ts).

// Keep only digits — WhatsApp's wa.me links require a bare international number.
export function phoneDigits(value: string | null | undefined): string {
  return (value || "").replace(/[^\d]/g, "");
}

// Build a https://wa.me/<digits>?text=<urlencoded message> deep link.
export function whatsappLink(whatsapp: string | null | undefined, message?: string): string {
  const digits = phoneDigits(whatsapp);
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

// A compact "1.2k" style count for review badges etc.
export function compactCount(n: number): string {
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
}

export function ratingLabel(avg: number): string {
  return avg > 0 ? avg.toFixed(1) : "—";
}

// Compose "City, Region, Country" dropping any empty parts.
export function locationLine(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(", ");
}
