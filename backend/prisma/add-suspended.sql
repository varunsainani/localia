-- One-off: add the SUSPENDED value to the ProviderStatus enum without a full db push
-- (a db push would drop the generated searchVector column from fts.sql).
ALTER TYPE "ProviderStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';
