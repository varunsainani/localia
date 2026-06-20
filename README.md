# Localia

A professional directory platform that connects clients with trusted local
professionals across Latin America. Clients search by category and city, browse
verified profiles on an interactive map, read reviews, and reach a professional
directly over WhatsApp. Professionals register, build a rich profile, and go
live once an admin approves them.

**Live demo:** https://localia-tau.vercel.app — open the login page and use one
of the one-click demo buttons (client, professional, or admin); no signup
needed.

## Features

- 🔎 **Faceted search** — full-text search over professionals with filters for
  category, city/region, minimum rating and availability, plus relevance /
  rating / distance / newest sorting. Accent-insensitive (searching
  `psicologia` matches `Psicología`).
- 🗺️ **Interactive map** — results plotted on an OpenStreetMap/Leaflet map with
  distance-aware ranking when the visitor shares their location.
- 👤 **SEO profile pages** — each professional has a server-rendered profile with
  gallery, services, ratings, reviews, JSON-LD structured data and per-locale
  metadata; a direct **"Contact on WhatsApp"** action.
- 📝 **Professional dashboard** — register, edit a full profile (bio, services,
  categories, location, gallery, availability), and track profile views, average
  rating and reviews.
- 🛠️ **Admin approval workflow** — a moderation queue to approve / reject /
  suspend professionals, manage the category catalog, and a platform overview
  (totals, top-rated, recently added, providers per category).
- ⭐ **Reviews & favorites** — clients rate professionals and save favorites to a
  personal list (only public/approved professionals are ever exposed).
- 🌍 **Fully trilingual (EN / ES / PT)** — both the UI and the API
  error/validation messages are localized (resolved via an `X-Locale` header
  with `Accept-Language` fallback), auto-detected on first visit with a visible
  toggle everywhere.
- 🌗 **Light / dark themes** and a mobile-first responsive layout.
- 🔐 **JWT auth** with rotating refresh tokens and role-based access (client /
  professional / admin).

## Tech stack

| Layer    | Technology                                                            |
| -------- | -------------------------------------------------------------------- |
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS, next-intl      |
| Backend  | Node.js, Express, TypeScript, Prisma                                  |
| Database | PostgreSQL (Neon) with `tsvector` full-text search + `unaccent`       |
| Maps     | Leaflet + OpenStreetMap (no API key)                                  |
| Media    | Vercel Blob                                                          |
| Hosting  | Vercel (frontend + backend serverless) + Neon                        |

## Project structure

```
backend/    Express API, Prisma schema, Postgres full-text search, i18n catalogs
frontend/   Next.js + Tailwind app (public site, dashboard, admin), i18n messages
```

The frontend proxies `/api/*` to the backend, so the whole product lives behind
a single URL and clients never see the backend origin.

## Running locally

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # set DATABASE_URL (Neon), DIRECT_URL, JWT secrets
npx prisma generate
npx prisma db push          # then apply prisma/fts.sql for the search index
npm run seed                # seeds categories, demo accounts and professionals
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local  # set API_PROXY_TARGET to the backend URL
npm run dev
```

Open http://localhost:3000.

## Internationalization

Every user-facing string lives in three catalogs (`en` / `es` / `pt`) with full
key parity. The backend ships its own catalogs so that validation and error
responses are localized too. Numbers, currencies and dates are formatted per
locale.
