# Localia — Build Contract (SPEC)

Location-based professional-services **directory** connecting two roles. Read this fully; it
is the shared contract between the backend and frontend. See `PLAN.md` for product context
and `backend/prisma/schema.prisma` for the data model.

## Reference projects (copy patterns, do NOT copy content)

- **Backend patterns:** `~/my-projects/keyring/backend` — Express + TS + Prisma + Vercel
  serverless layout, `lib/` (env, prisma, tokens, http-error, async-handler, audit, serialize),
  `i18n/` (en/es/pt flat catalogs + `t(locale,key,vars)` + `localeFromRequest`),
  `middleware/` (locale, error, session/token-auth, require-scope→adapt to require-role),
  `api/index.ts` serverless export, `vercel.json`. Mirror its conventions and quality.
- **Frontend patterns:** `~/my-projects/keyring/frontend` — Next.js App Router + Tailwind v4
  (`@theme` in globals.css, NO tailwind.config), next-intl cookie-based setup
  (`src/i18n/*`, `getRequestConfig`, `useTranslations`, `generateMetadata`), next-themes,
  `components/ui` (Card, Button, Input, Badge, PageHeader), `lib/api.ts` client with
  localStorage token + refresh-on-401, language toggle, `useAppFormat`. Mirror its design
  system but reskin for Localia (see Brand below).

## Stack adaptations (locked)

- Maps: **react-leaflet + OpenStreetMap** tiles (no API key). Map components are client-only
  (`"use client"` + dynamic import with `ssr:false`; import `leaflet/dist/leaflet.css`).
- Photo uploads: **Vercel Blob** (`@vercel/blob` `put()`), server-side, returns a public URL.
- Search: **Postgres full-text** (see `backend/prisma/fts.sql`) + faceted filters.
- Hosting: **all-Vercel + Neon**. Single public URL via Next `/api` proxy.

## Monorepo layout

- `backend/` Express + TS + Prisma + Postgres (Neon). Dev port **4000**.
- `frontend/` Next.js 16 + React 19 + TS + Tailwind v4. Dev port **3000**.

## Brand

Name **Localia**. Accent color **emerald/teal** (local services + map feel); pick a tasteful
primary (e.g. emerald-600) with a complementary secondary. Light + dark themes. lucide-react
icons. Logo = a simple map-pin glyph + wordmark "Localia". Favicon = pin glyph.

## Env vars

Backend (`backend/.env` locally; persisted on Vercel in prod): `DATABASE_URL` (pooled),
`DIRECT_URL` (direct, for push/seed), `JWT_ACCESS_SECRET`, `ACCESS_TOKEN_TTL` (default `30m`),
`PORT`, `NODE_ENV`, `CORS_ORIGIN`, `APP_URL`, `BLOB_READ_WRITE_TOKEN`.

Frontend (`frontend/.env.local`): `API_PROXY_TARGET` (backend origin), and build-time
`NEXT_PUBLIC_DEMO_{CLIENT,PROVIDER,ADMIN}_{EMAIL,PASSWORD}`.

## Single URL (proxy)

`frontend/next.config.ts` rewrites `/api/:path*` and `/health` → `${API_PROXY_TARGET}/...`.
The API client uses an **empty base** (same-origin). Send `X-Locale: <locale>` on every
request. Do NOT use `NEXT_PUBLIC_API_URL`.

## Auth

- JWT **access** token (TTL `ACCESS_TOKEN_TTL`) in `Authorization: Bearer`. **Refresh** token
  returned in the JSON body, stored client-side (localStorage `localia_token` /
  `localia_refresh`), with rotation + reuse-detection (revoke all on reuse) like keyring.
- Client 401 → try refresh once → retry; on failure clear session.
- Roles: `CLIENT | PROVIDER | ADMIN`. `requireAuth`, `requireRole(...roles)` guards.
- Register accepts role `CLIENT` or `PROVIDER` only (never ADMIN). Passwords bcrypt-hashed,
  min 8 chars (validate with Zod, localized messages).

## API (all under `/api`, JSON, Zod-validated, errors localized via `X-Locale`)

Error shape: `{ "error": { "message": string, "code"?: string, "details"?: Record<string,string> } }`.
`User` = `{ id, email, name, role, locale }`.

**Auth**
- `POST /auth/register` `{email,password,name,role}` → `{user,accessToken,refreshToken}`
- `POST /auth/login` `{email,password}` → `{user,accessToken,refreshToken}`
- `POST /auth/refresh` `{refreshToken}` → `{accessToken,refreshToken}`
- `POST /auth/logout` `{refreshToken}` → `{ok:true}`
- `GET /auth/me` (Bearer) → `{user}`

**Categories**
- `GET /categories` → `{categories:[{id,slug,name,icon,providerCount}]}` (`name` localized)

**Providers (public)**
- `GET /providers` query: `q, category(slug), city, region, minRating, availability,
  lat, lng, radiusKm, sort(relevance|rating|distance|newest), page, pageSize` →
  `{items:[ProviderCard], total, page, pageSize, facets:{categories:[{slug,name,count}], cities:[{city,count}]}}`.
  Only `APPROVED` providers. `relevance` uses FTS rank when `q` present (else featured+rating).
  `distance` requires `lat,lng` (Haversine). `ProviderCard` =
  `{id,slug,businessName,headline,avatarUrl,coverUrl,city,region,country,lat,lng,availability,
  ratingAvg,reviewCount,featured,categories:[{slug,name}],distanceKm?}`.
- `GET /providers/:slug` → `{provider: ProviderDetail}` (increments `views`). Detail adds
  `about,services,photos,phone,whatsapp,addressLine,createdAt,reviews:[{id,rating,comment,clientName,createdAt}]`.
- `GET /providers/:slug/reviews?page=` → `{items,total,page,pageSize}`

**Provider self** (Bearer, role PROVIDER)
- `GET /me/provider` → `{provider|null}`
- `PUT /me/provider` upsert `{businessName,headline,about,services[],categorySlugs[],phone,
  whatsapp,addressLine,city,region,country,lat,lng,availability,avatarUrl?,coverUrl?,photos[]?}`
  → `{provider}`. Editing resets `status` to `PENDING` (re-review) unless only non-material
  fields changed; on first save status is `PENDING`.
- `POST /me/provider/submit` → `{provider}` (status `PENDING`)
- `POST /me/provider/photo` multipart `file` (image, max ~5MB) → `{url}` via Vercel Blob.
  If `BLOB_READ_WRITE_TOKEN` is missing, return 503 with a localized "uploads not configured".
- `GET /me/provider/stats` → `{views,ratingAvg,reviewCount,status}`

**Client** (Bearer, role CLIENT)
- `POST /providers/:slug/reviews` `{rating(1..5),comment}` → `{review}` (one per client/provider;
  recompute provider `ratingAvg`,`reviewCount`)
- `GET /me/favorites` → `{items:[ProviderCard]}`
- `POST /me/favorites/:providerId` → `{ok}` ; `DELETE /me/favorites/:providerId` → `{ok}`

**Admin** (Bearer, role ADMIN)
- `GET /admin/stats` → `{totalProviders,pending,approved,rejected,clients,
  byCategory:[{slug,name,count}],recent:[ProviderCard],topRated:[ProviderCard]}`
- `GET /admin/providers?status&q&page` → `{items:[...],total,page,pageSize}`
- `GET /admin/queue` → pending providers
- `POST /admin/providers/:id/approve` → `{provider}` (audit log)
- `POST /admin/providers/:id/reject` `{reason}` → `{provider}` (audit log)
- `PATCH /admin/providers/:id` `{featured?,status?}` → `{provider}`
- `POST /admin/categories` / `PUT /admin/categories/:id` / `DELETE /admin/categories/:id`
- `GET /admin/audit?page=` → `{items,total}`

`GET /health` → `{ok:true}` (also reachable at top-level via proxy).

## Search & geo implementation

- FTS: query `"Provider"."searchVector" @@ websearch_to_tsquery('simple', $q)` ordered by
  `ts_rank(...)` when `q` is present. Use `$queryRaw`. Combine with category/city/rating/
  availability filters and pagination. The generated column + GIN index are created by
  `prisma/fts.sql` (apply it in the seed/setup step after `prisma db push`).
- Geo: Haversine in SQL for `distanceKm`; `radiusKm` filters; `sort=distance` orders by it.
- Facets: counts per category and per city over the current filtered set (excluding the facet
  being counted is fine to keep simple — document choice).

## i18n EN/ES/PT

next-intl cookie-based (`NEXT_LOCALE` + Accept-Language), full UI coverage + backend errors.
Category names localized server-side. Locale-aware number/date/relative formatting. Language
toggle on public + auth pages. Namespaces (suggested): `common, nav, auth, landing, search,
filters, profile, review, dashboard, admin, categories, errors`. **Perfect key parity** across
the three message catalogs (same keys, all translated — no English fallback text in ES/PT).

## Pages (frontend)

Public: `/` (hero search by category+city, featured providers, category grid, how-it-works,
map preview), `/search` (results list + interactive Leaflet map side-by-side, filter sidebar,
sort, pagination, empty state), `/p/[slug]` (gallery, about, services, map, reviews+rating,
sticky WhatsApp contact CTA, JSON-LD `ProfessionalService` + `generateMetadata`),
`/categories`, `/category/[slug]`, `/login`, `/register` (Client/Provider toggle).
Provider `/dashboard`: overview (status, views, rating), profile editor (fields + draggable
map pin to set lat/lng + photo upload + services chips + availability + WhatsApp), reviews.
Admin `/admin`: stats, `/admin/review` queue (approve / reject-with-reason, optimistic),
`/admin/providers` (feature/suspend, filter), `/admin/categories` (CRUD).

WhatsApp button → `https://wa.me/<digits>?text=<urlencoded localized message>`.
Mobile-first, responsive, accessible (labels, focus states, keyboard).

## SEO

`generateMetadata` per profile + category (title, description, canonical, OpenGraph, Twitter),
JSON-LD (`ProfessionalService`/`BreadcrumbList`), `app/sitemap.ts` (providers + categories),
`app/robots.ts`, semantic headings, SSR for crawlable content.

## Seed (`backend/prisma/seed.ts`)

Idempotent (clear demo rows then insert). Apply `fts.sql` as part of setup. Create:
- **8 categories** with EN/ES/PT names + lucide icon names: Psychology/Mental health,
  Legal, Real estate, Home services, Agriculture/Agro, Education/Tutoring, Health/Nutrition,
  Technology.
- **3 demo accounts** (password `demo1234`): `admin@localia.app` (ADMIN),
  `pro@localia.app` (PROVIDER, owns an APPROVED featured profile), `demo@localia.app`
  (CLIENT, with 2–3 favorites and 1 review).
- **~24 APPROVED** providers + **~4 PENDING** (for the admin queue demo), spread across
  cities with real-ish lat/lng: Buenos Aires (AR), São Paulo (BR), Ciudad de México (MX),
  Bogotá (CO), Santiago (CL), Lima (PE). Each: 1–2 categories, headline, about, 3–6 services,
  whatsapp digits, address, availability, avatar `https://i.pravatar.cc/300?u=<unique>`,
  cover + photos `https://picsum.photos/seed/<unique>/800/600`. Add a realistic spread of
  reviews so ratings vary (3.5–5.0). Recompute `ratingAvg`/`reviewCount`.

## Quality bar

Genuinely full-stack: every button works against live data, CRUD persists, no placeholders or
dead controls. `tsc --noEmit` clean on both. Match keyring's polish.
