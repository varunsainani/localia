-- Postgres full-text search for Provider. Run ONCE after `prisma db push`.
-- Uses the 'simple' config (no language stemming) so EN/ES/PT all behave consistently.
-- A generated STORED column + GIN index gives scalable ranked search.
-- NOTE: this column is intentionally NOT in schema.prisma. Do not re-run `prisma db push`
-- against an environment after this without re-applying this file (push may drop it).

-- Accent-insensitive search: "psicologia" should match "Psicología". The built-in
-- unaccent() is STABLE (not IMMUTABLE) and depends on a dictionary regclass, so it
-- cannot be used directly in a generated column or a functional index. The wrapper
-- below pins the dictionary and is declared IMMUTABLE so both the generated column
-- and query-side tsquery can use it consistently.
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION immutable_unaccent(text)
  RETURNS text
  LANGUAGE sql
  IMMUTABLE
  PARALLEL SAFE
AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;

-- Postgres marks array_to_string() as STABLE (not IMMUTABLE), which a generated
-- column rejects. This thin IMMUTABLE wrapper joins the services text[] with a space.
CREATE OR REPLACE FUNCTION immutable_array_to_string(text[])
  RETURNS text
  LANGUAGE sql
  IMMUTABLE
  PARALLEL SAFE
AS $$ SELECT array_to_string($1, ' ') $$;

-- Drop first so re-applying picks up the unaccented definition cleanly.
ALTER TABLE "Provider" DROP COLUMN IF EXISTS "searchVector";
ALTER TABLE "Provider"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', immutable_unaccent(coalesce("businessName", ''))), 'A') ||
    setweight(to_tsvector('simple', immutable_unaccent(coalesce("headline", ''))), 'B') ||
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(immutable_array_to_string("services"), ''))), 'B') ||
    setweight(to_tsvector('simple', immutable_unaccent(coalesce("about", ''))), 'C') ||
    setweight(to_tsvector('simple', immutable_unaccent(coalesce("city", ''))), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS "provider_search_idx" ON "Provider" USING GIN ("searchVector");
CREATE INDEX IF NOT EXISTS "provider_geo_idx" ON "Provider" ("lat", "lng");
