// Client-side session storage for the Localia dashboard. The JWT access token
// and the rotating refresh token live in localStorage; the access token is
// attached as a Bearer token on authenticated requests (see lib/api.ts).
const TOKEN_KEY = "localia_token";
const REFRESH_KEY = "localia_refresh";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getRefresh() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setSession(accessToken: string, refreshToken?: string) {
  window.localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) window.localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

export function isAuthed() {
  return !!getToken();
}

// Read the locale chosen via the language toggle. When unset (first visit), we
// omit the header so the backend falls back to the browser's Accept-Language,
// matching the UI's own auto-detection.
export function getLocaleCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
