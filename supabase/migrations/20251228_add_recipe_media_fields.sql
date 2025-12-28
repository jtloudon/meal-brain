-- Add image_url and source_url fields to recipes table
-- These fields support recipe images and attribution/source tracking

ALTER TABLE recipes
  ADD COLUMN image_url TEXT,
  ADD COLUMN source_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN recipes.image_url IS 'URL to recipe image stored in Supabase Storage or external URL. Supports JPEG, PNG, WebP, HEIC (iPhone default)';
COMMENT ON COLUMN recipes.source_url IS 'Original source URL if recipe was imported (e.g., from website, blog, etc.)';
