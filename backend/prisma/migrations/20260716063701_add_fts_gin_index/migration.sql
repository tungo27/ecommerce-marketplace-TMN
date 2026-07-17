-- Create extension for unaccent if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "unaccent" SCHEMA public;

-- Create an immutable wrapper for unaccent so it can be used in an index
CREATE OR REPLACE FUNCTION f_unaccent(text)
  RETURNS text AS
$func$
SELECT public.unaccent('public.unaccent', $1)
$func$  LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE;

-- Create GIN index for Full-Text Search on Product name and description
-- Weights: name gets A (highest), description gets B
CREATE INDEX IF NOT EXISTS "product_fts_gin_idx" ON "Product"
USING GIN (
  (
    setweight(to_tsvector('simple', f_unaccent(coalesce("name", ''))), 'A') ||
    setweight(to_tsvector('simple', f_unaccent(coalesce("description", ''))), 'B')
  )
);