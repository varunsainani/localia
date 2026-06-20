# Localia — Professional Services Directory (Project Plan)

A location-based directory that connects two user types: **providers** who register and
build a profile, and **clients** who search, filter, view providers on a map, and contact
them on WhatsApp. An **admin** approves profiles and manages the platform. This is the
"marketplace / directory connecting two roles" pattern (psychology clinics, agricultural
platforms, real-estate directories) as one reusable product.

Built as a genuinely full-stack, multilingual (EN/ES/PT), mobile-first product with live
data and no dead buttons. Single public URL.

---

## 1. Roles

- **Client** — browse, full-text search, filter (category, city, rating, availability,
  distance), map view, SEO profile pages, contact a provider via WhatsApp, leave a rating
  and review, save favourites.
- **Provider** — register, build/edit a profile (category, bio, services, photos, map
  location, availability, WhatsApp), submit for review, see status and profile views.
- **Admin** — approval queue (approve / reject with reason), feature or suspend providers,
  manage categories, dashboard stats, audit log.

## 2. Stack (adapted to the all-Vercel + Neon toolkit)

The brief lists Railway / Google Maps / Cloudinary / Algolia. To keep the demo zero-cost,
key-free, and on the established toolkit, I'll substitute equivalents that show the *same
skills* without third-party billing or accounts. (Say the word at "start" if you'd rather I
use Google Maps / Mapbox / Cloudinary with real keys for a specific client showcase.)

| Brief | Building with | Why |
|---|---|---|
| React + Next + TS + Tailwind | Next.js 16 (App Router) + React 19 + TS + Tailwind v4 | same |
| Node + Express | Express + **TypeScript** + Prisma | same, typed |
| PostgreSQL + Prisma | **Neon** Postgres + Prisma | toolkit |
| Google Maps / Mapbox | **react-leaflet + OpenStreetMap** | interactive map, **no API key / billing** |
| Cloudinary (photos) | **Vercel Blob** | real uploads, stays in the Vercel ecosystem |
| Algolia (search) | **Postgres full-text search** (tsvector + GIN) | scalable faceted search, no external service |
| WhatsApp contact | `wa.me` deep link with prefilled message | exactly as required |
| Railway | **all-Vercel** (frontend + serverless backend) | toolkit |

Plus: next-intl (EN/ES/PT), next-themes (light/dark), lucide-react. Single URL via Next
`/api` proxy to the backend (same-origin client).

## 3. Data model (Prisma)

- **User** — id, email, passwordHash, role `CLIENT|PROVIDER|ADMIN`, name, locale, timestamps.
- **Provider** — userId, slug, businessName, headline, about, services[], avatarUrl,
  coverUrl, photos[] (Blob URLs), phone, whatsapp, addressLine, city, region, country,
  lat, lng, availability `AVAILABLE|BUSY|BY_APPOINTMENT`, status `PENDING|APPROVED|REJECTED`,
  rejectionReason, featured, ratingAvg (cached), reviewCount (cached), searchVector, timestamps.
- **Category** — slug, nameEn/nameEs/namePt, icon, sortOrder. Provider ↔ Category many-to-many.
- **Review** — providerId, clientId, rating 1–5, comment, timestamps (one per client/provider).
- **Favorite** — clientId, providerId.
- **AuditLog** — actorId, action, targetId, meta, createdAt (admin approvals/rejections/etc.).
- **RefreshToken** — auth session rotation.

Seed categories tie to the brief's examples: Psychology / Health, Agriculture / Agro,
Real estate, Legal, Home services, Education / Tutoring, Beauty, Technology.

## 4. Pages

**Public**
- `/` — hero search (category + city), featured providers, category grid, how-it-works, map preview.
- `/search` — split list + interactive Leaflet map; filters sidebar (category, city/region,
  min rating, availability, distance radius); sort by relevance / rating / distance; paginated.
- `/p/[slug]` — SEO profile: gallery, about, services, map, reviews + rating, WhatsApp CTA;
  `generateMetadata` (title/description/OG/Twitter) + JSON-LD `ProfessionalService`.
- `/categories`, `/category/[slug]`.
- `/login`, `/register` (choose Client or Provider). Language toggle on public + auth pages.

**Provider** (`/dashboard`)
- Overview (status badge, profile views, rating).
- Profile editor — fields + photo upload to Blob + set location by dragging a map pin +
  services + availability + WhatsApp; submit for review.
- Reviews received.

**Admin** (`/admin`)
- Stats (total / pending / approved, by category, recent signups, top rated).
- Review queue — approve / reject (with reason) with optimistic updates.
- Providers — feature / unfeature, suspend.
- Categories — CRUD.

## 5. Backend API (Express, `/api`, typed, Zod-validated, i18n errors via `X-Locale`)

- **Auth** — register, login, refresh (rotation + reuse detection), logout, me. JWT access +
  refresh, role guards (`requireRole`).
- **Public** — `GET /providers` (search + filter + sort + paginate), `GET /providers/:slug`,
  `GET /categories`, `GET /providers/:id/reviews`.
- **Provider** — upsert profile, upload photo (Blob), submit for review, list own reviews.
- **Client** — create review (guarded one-per-provider), favourites add/remove/list.
- **Admin** — queue, approve/reject, feature/suspend, categories CRUD, stats, audit log.

## 6. Search & geolocation

- **Full-text:** weighted `tsvector` over businessName + headline + services + category,
  GIN index, queried with `websearch_to_tsquery` for natural queries.
- **Geo:** store lat/lng; city/region filter; Haversine distance in SQL for "near me" +
  distance sort + radius filter; map markers (clustered when dense), click marker → card.
- Filters compose: category + city/region + minRating (cached) + availability + distance.

## 7. SEO

`generateMetadata` per profile + category, canonical URLs, OpenGraph/Twitter cards, JSON-LD
(`ProfessionalService` / `BreadcrumbList`), `sitemap.xml` (providers + categories),
`robots.txt`, semantic headings, SSR for crawlable content.

## 8. i18n EN/ES/PT

next-intl cookie-based (NEXT_LOCALE + Accept-Language), full UI + backend errors, category
names per locale, locale-aware number/date/relative formatting, language toggle. Perfect key
parity across the three catalogs.

## 9. Demo data & one-click demo

Admin + a few clients + ~24 approved providers across categories and real LatAm cities
(Buenos Aires, São Paulo, CDMX, Bogotá, Santiago, Lima) with lat/lng, photos, services,
reviews/ratings, plus a handful **PENDING** so the admin approval workflow is demoable.
One-click demo logins for Client / Provider / Admin on the login page.

## 10. Deploy (all-Vercel + Neon)

- Two projects: `localia` (frontend, `rootDirectory=frontend`, **git-connected from the
  start** → green GitHub deployments + auto-deploy) and `localia-api` (backend serverless via
  `api/index.ts`). Single URL via `/api` proxy.
- **Persist** env on each project (no inline-only vars). Backend: `DATABASE_URL` (pooled),
  `JWT_ACCESS_SECRET`, `BLOB_READ_WRITE_TOKEN`, app URL. Frontend: `API_PROXY_TARGET`,
  `NEXT_PUBLIC_DEMO_*` (client/provider/admin).
- Vercel Blob store for uploads. Neon: direct URL for `prisma db push` + seed, pooled for runtime.

## 11. Final phase — audit (as required)

Multi-perspective audit via parallel agents / a dynamic Workflow across lenses: security
(authz/role bypass, upload abuse), i18n parity, functional (no dead buttons, CRUD persists),
search/geo correctness, SEO, adversarial. Verify each finding, fix the real ones, redeploy,
re-verify live. Then PT screenshots (light + dark, 16:9) and Workana listing copy.

## 12. Build order (after you say "start")

1. Scaffold monorepo + configs + Prisma schema + Neon push + seed.
2. Backend: auth/roles → providers + search/geo → categories → reviews/favourites → admin →
   i18n → Blob upload.
3. Frontend: design system + i18n + theme → auth → landing → search + map → SEO profile
   pages → provider dashboard → admin panel.
4. Wire everything to live data; remove all placeholders.
5. Deploy both projects (Blob + Neon), connect git integration, smoke-test demo logins.
6. Audit → fix → screenshots → Workana copy.
</content>
