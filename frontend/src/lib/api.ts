// Client for the Localia API. Same-origin by default: requests go to "/api/..."
// and are proxied to the backend by a Next.js rewrite, so the whole product
// lives behind a single URL. The session (JWT access token + rotating refresh
// token) is kept in localStorage; the access token is attached as a Bearer
// token. On 401 we transparently refresh once and retry.
import { getToken, getRefresh, setSession, clearAuth, getLocaleCookie } from "./session";

const BASE = "";

export const DEMO = {
  client: {
    email: process.env.NEXT_PUBLIC_DEMO_CLIENT_EMAIL,
    password: process.env.NEXT_PUBLIC_DEMO_CLIENT_PASSWORD,
  },
  provider: {
    email: process.env.NEXT_PUBLIC_DEMO_PROVIDER_EMAIL,
    password: process.env.NEXT_PUBLIC_DEMO_PROVIDER_PASSWORD,
  },
  admin: {
    email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL,
    password: process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD,
  },
} as const;

// ---------------------------------------------------------------------------
// Core JSON request
// ---------------------------------------------------------------------------

// Auth endpoints that must never trigger a refresh-and-retry (they ARE the
// session flow). Everything else retries once on 401.
const NO_REFRESH = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/logout",
];

async function refreshSession(): Promise<boolean> {
  const refreshToken = getRefresh();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data?.accessToken) {
      setSession(data.accessToken, data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

type QueryValue = string | number | boolean | null | undefined;

function withQuery(path: string, query?: Record<string, QueryValue>) {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export class ApiError extends Error {
  code?: string;
  details?: Record<string, string>;
  status: number;
  constructor(message: string, status: number, code?: string, details?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function api<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown } = {},
  retried = false,
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const locale = getLocaleCookie();
  if (locale) headers["X-Locale"] = locale;

  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 && !retried && getRefresh() && !NO_REFRESH.some((p) => path.startsWith(p))) {
    if (await refreshSession()) return api<T>(path, opts, true);
    clearAuth();
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error;
    const message =
      (typeof err === "object" ? err?.message : err) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, err?.code, err?.details);
  }
  return data as T;
}

// Multipart upload (photo). Does not set Content-Type so the browser sets the
// boundary; still attaches the Bearer + locale headers.
async function apiUpload<T = unknown>(path: string, file: File): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const locale = getLocaleCookie();
  if (locale) headers["X-Locale"] = locale;

  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${BASE}${path}`, { method: "POST", headers, body: form });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error;
    const message =
      (typeof err === "object" ? err?.message : err) || `Upload failed (${res.status})`;
    throw new ApiError(message, res.status, err?.code, err?.details);
  }
  return data as T;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Role = "CLIENT" | "PROVIDER" | "ADMIN";
export type ProviderStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type Availability = "available" | "busy" | "unavailable";
export type SortOption = "relevance" | "rating" | "distance" | "newest";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  locale: string;
}

export interface CategoryRef {
  slug: string;
  name: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  providerCount: number;
}

export interface AdminCategory {
  id: string;
  slug: string;
  icon: string;
  sortOrder: number;
  nameEn: string;
  nameEs: string;
  namePt: string;
  providerCount: number;
}

export interface ProviderCard {
  id: string;
  slug: string;
  businessName: string;
  headline: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  city: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  availability: Availability;
  ratingAvg: number;
  reviewCount: number;
  featured: boolean;
  categories: CategoryRef[];
  distanceKm?: number;
  status?: ProviderStatus;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  clientName: string;
  createdAt: string;
}

export interface ProviderDetail extends ProviderCard {
  about: string;
  services: string[];
  photos: string[];
  phone: string;
  whatsapp: string;
  addressLine: string;
  createdAt: string;
  reviews: Review[];
}

export interface Facets {
  categories: { slug: string; name: string; count: number }[];
  cities: { city: string; count: number }[];
}

export interface ProviderSearchResult {
  items: ProviderCard[];
  total: number;
  page: number;
  pageSize: number;
  facets: Facets;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProviderStats {
  views: number;
  ratingAvg: number;
  reviewCount: number;
  status: ProviderStatus;
}

export interface AdminStats {
  totalProviders: number;
  pending: number;
  approved: number;
  rejected: number;
  clients: number;
  byCategory: { slug: string; name: string; count: number }[];
  recent: ProviderCard[];
  topRated: ProviderCard[];
}

export interface AuditEvent {
  id: string;
  action: string;
  actorName: string | null;
  targetName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface SessionResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ProviderInput {
  businessName: string;
  headline: string;
  about: string;
  services: string[];
  categorySlugs: string[];
  phone: string;
  whatsapp: string;
  addressLine: string;
  city: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  availability: Availability;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  photos?: string[];
}

export interface ProviderSearchParams {
  q?: string;
  category?: string;
  city?: string;
  region?: string;
  minRating?: number;
  availability?: Availability;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function login(email: string, password: string) {
  const data = await api<SessionResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
  setSession(data.accessToken, data.refreshToken);
  return data;
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  role: "CLIENT" | "PROVIDER";
}) {
  const data = await api<SessionResponse>("/api/auth/register", {
    method: "POST",
    body: payload,
  });
  setSession(data.accessToken, data.refreshToken);
  return data;
}

export async function logout() {
  const refreshToken = getRefresh();
  try {
    await api("/api/auth/logout", { method: "POST", body: { refreshToken } });
  } catch {
    // Best effort: clear the local session regardless of the network result.
  }
  clearAuth();
}

export async function getMe() {
  const data = await api<{ user: User }>("/api/auth/me");
  return data.user;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function listCategories() {
  const data = await api<{ categories: Category[] }>("/api/categories");
  return data.categories;
}

// ---------------------------------------------------------------------------
// Providers (public)
// ---------------------------------------------------------------------------

export async function searchProviders(params: ProviderSearchParams = {}) {
  return api<ProviderSearchResult>(withQuery("/api/providers", { ...params }));
}

export async function getProvider(slug: string) {
  const data = await api<{ provider: ProviderDetail }>(`/api/providers/${slug}`);
  return data.provider;
}

export async function getProviderReviews(slug: string, page = 1) {
  return api<Paginated<Review>>(withQuery(`/api/providers/${slug}/reviews`, { page }));
}

// ---------------------------------------------------------------------------
// Provider self (role PROVIDER)
// ---------------------------------------------------------------------------

export async function getMyProvider() {
  const data = await api<{ provider: ProviderDetail | null }>("/api/me/provider");
  return data.provider;
}

export async function saveMyProvider(input: ProviderInput) {
  const data = await api<{ provider: ProviderDetail }>("/api/me/provider", {
    method: "PUT",
    body: input,
  });
  return data.provider;
}

export async function submitMyProvider() {
  const data = await api<{ provider: ProviderDetail }>("/api/me/provider/submit", {
    method: "POST",
  });
  return data.provider;
}

export async function uploadProviderPhoto(file: File) {
  return apiUpload<{ url: string }>("/api/me/provider/photo", file);
}

export async function getMyProviderStats() {
  return api<ProviderStats>("/api/me/provider/stats");
}

// ---------------------------------------------------------------------------
// Client (role CLIENT)
// ---------------------------------------------------------------------------

export async function createReview(slug: string, payload: { rating: number; comment: string }) {
  const data = await api<{ review: Review }>(`/api/providers/${slug}/reviews`, {
    method: "POST",
    body: payload,
  });
  return data.review;
}

export async function listFavorites() {
  const data = await api<{ items: ProviderCard[] }>("/api/me/favorites");
  return data.items;
}

export async function addFavorite(providerId: string) {
  return api<{ ok: boolean }>(`/api/me/favorites/${providerId}`, { method: "POST" });
}

export async function removeFavorite(providerId: string) {
  return api<{ ok: boolean }>(`/api/me/favorites/${providerId}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Admin (role ADMIN)
// ---------------------------------------------------------------------------

export async function getAdminStats() {
  return api<AdminStats>("/api/admin/stats");
}

export async function listAdminProviders(params: {
  status?: ProviderStatus | "";
  q?: string;
  page?: number;
} = {}) {
  return api<Paginated<ProviderCard>>(withQuery("/api/admin/providers", { ...params }));
}

export async function getAdminQueue() {
  const data = await api<{ items: ProviderCard[] } | ProviderCard[]>("/api/admin/queue");
  return Array.isArray(data) ? data : data.items;
}

export async function approveProvider(id: string) {
  const data = await api<{ provider: ProviderCard }>(`/api/admin/providers/${id}/approve`, {
    method: "POST",
  });
  return data.provider;
}

export async function rejectProvider(id: string, reason: string) {
  const data = await api<{ provider: ProviderCard }>(`/api/admin/providers/${id}/reject`, {
    method: "POST",
    body: { reason },
  });
  return data.provider;
}

export async function patchProvider(
  id: string,
  patch: { featured?: boolean; status?: ProviderStatus },
) {
  const data = await api<{ provider: ProviderCard }>(`/api/admin/providers/${id}`, {
    method: "PATCH",
    body: patch,
  });
  return data.provider;
}

export async function listAdminCategories() {
  const data = await api<{ categories: AdminCategory[] }>("/api/admin/categories");
  return data.categories;
}

type CategoryPayload = {
  slug: string;
  icon: string;
  nameEn: string;
  nameEs: string;
  namePt: string;
};

export async function createCategory(payload: CategoryPayload) {
  const data = await api<{ category: Category }>("/api/admin/categories", {
    method: "POST",
    body: payload,
  });
  return data.category;
}

export async function updateCategory(id: string, payload: CategoryPayload) {
  const data = await api<{ category: Category }>(`/api/admin/categories/${id}`, {
    method: "PUT",
    body: payload,
  });
  return data.category;
}

export async function deleteCategory(id: string) {
  return api<{ ok: boolean }>(`/api/admin/categories/${id}`, { method: "DELETE" });
}

export async function getAdminAudit(page = 1) {
  return api<{ items: AuditEvent[]; total: number }>(withQuery("/api/admin/audit", { page }));
}
