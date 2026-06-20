-- Sort/search indexes for the hot Provider listing path.
--
-- These match the @@index entries with explicit names added to the Provider
-- model in prisma/schema.prisma, so the live DB and the schema stay in sync.
-- Apply with: prisma db execute --file prisma/add-search-indexes.sql --schema prisma/schema.prisma
--
-- A full `prisma db push` would create these from the schema, but it also DROPS
-- the fts.sql searchVector column. This file lets us add the indexes to the live
-- DB on their own, without a push. All statements are idempotent.

CREATE INDEX IF NOT EXISTS "provider_rating_idx" ON "Provider" ("ratingAvg");
CREATE INDEX IF NOT EXISTS "provider_created_idx" ON "Provider" ("createdAt");
CREATE INDEX IF NOT EXISTS "provider_availability_idx" ON "Provider" ("availability");
CREATE INDEX IF NOT EXISTS "provider_status_featured_rating_idx" ON "Provider" ("status", "featured", "ratingAvg");
