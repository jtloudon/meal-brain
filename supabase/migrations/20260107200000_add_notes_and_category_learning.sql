-- Add notes field to grocery items for user annotations
-- Examples: "check expiration date", "get the organic kind", etc.
ALTER TABLE grocery_items
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create table to cache learned category mappings
-- This reduces Claude API calls over time by remembering how items were categorized
CREATE TABLE IF NOT EXISTS category_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name_normalized TEXT NOT NULL UNIQUE, -- lowercase, trimmed version
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  times_used INTEGER NOT NULL DEFAULT 1,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_category_mappings_item_name
  ON category_mappings(item_name_normalized);

-- Function to normalize item names for matching
-- Removes parenthetical notes, trims, lowercases
CREATE OR REPLACE FUNCTION normalize_item_name(item_name TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove content in parentheses (e.g., "Plums (honey?)" -> "Plums")
  -- Trim whitespace and lowercase
  RETURN LOWER(TRIM(REGEXP_REPLACE(item_name, '\([^)]*\)', '', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get or suggest category for an item
-- Returns cached mapping if exists, NULL if needs Claude categorization
CREATE OR REPLACE FUNCTION get_suggested_category(item_name TEXT)
RETURNS TEXT AS $$
DECLARE
  normalized_name TEXT;
  suggested_category TEXT;
BEGIN
  normalized_name := normalize_item_name(item_name);

  -- Look up in cache
  SELECT category INTO suggested_category
  FROM category_mappings
  WHERE item_name_normalized = normalized_name;

  IF FOUND THEN
    -- Update usage stats
    UPDATE category_mappings
    SET times_used = times_used + 1,
        last_used_at = NOW()
    WHERE item_name_normalized = normalized_name;

    RETURN suggested_category;
  END IF;

  -- Not found - needs Claude categorization
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to save a learned category mapping
CREATE OR REPLACE FUNCTION save_category_mapping(item_name TEXT, category_name TEXT)
RETURNS VOID AS $$
DECLARE
  normalized_name TEXT;
BEGIN
  normalized_name := normalize_item_name(item_name);

  -- Upsert the mapping
  INSERT INTO category_mappings (item_name_normalized, category)
  VALUES (normalized_name, category_name)
  ON CONFLICT (item_name_normalized)
  DO UPDATE SET
    category = EXCLUDED.category,
    times_used = category_mappings.times_used + 1,
    last_used_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on category_mappings (shared across all households)
ALTER TABLE category_mappings ENABLE ROW LEVEL SECURITY;

-- Everyone can read (cached categories are universal)
CREATE POLICY "Anyone can read category mappings"
  ON category_mappings FOR SELECT
  TO authenticated
  USING (true);

-- Only system can write (via function)
-- Users don't directly insert - goes through save_category_mapping function
CREATE POLICY "System can write category mappings"
  ON category_mappings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
