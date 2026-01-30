-- Security hardening: scope category_mappings per household,
-- fix search_path on all functions, tighten RLS policies.
-- Addresses all Supabase Security Advisor warnings (except Leaked Password
-- Protection which requires Pro Plan).

-- ============================================================
-- 1. Scope category_mappings to household
-- ============================================================

-- Add household_id column (nullable initially for backfill)
ALTER TABLE category_mappings ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;

-- Backfill existing rows with the first household (your household)
UPDATE category_mappings
SET household_id = (SELECT id FROM households LIMIT 1);

-- Make it NOT NULL after backfill
ALTER TABLE category_mappings ALTER COLUMN household_id SET NOT NULL;

-- Drop the old unique constraint on item_name_normalized alone
ALTER TABLE category_mappings DROP CONSTRAINT IF EXISTS category_mappings_item_name_normalized_key;

-- Add composite unique constraint: same item can exist in different households
ALTER TABLE category_mappings ADD CONSTRAINT category_mappings_household_item_unique
  UNIQUE (household_id, item_name_normalized);

-- Add index for household lookups
CREATE INDEX idx_category_mappings_household ON category_mappings(household_id);

-- Replace RLS policies
DROP POLICY IF EXISTS "Anyone can read category mappings" ON category_mappings;
DROP POLICY IF EXISTS "System can write category mappings" ON category_mappings;

-- Read/write scoped to own household
CREATE POLICY "Users can read own household category mappings"
  ON category_mappings FOR SELECT
  TO authenticated
  USING (household_id = public.user_household_id());

-- No direct write policy — writes go through SECURITY DEFINER functions

-- ============================================================
-- 2. Update RPC functions to scope by household
-- ============================================================

-- get_suggested_category: now filters by caller's household
CREATE OR REPLACE FUNCTION get_suggested_category(item_name TEXT)
RETURNS TEXT AS $$
DECLARE
  normalized_name TEXT;
  suggested_category TEXT;
  caller_household UUID;
BEGIN
  caller_household := public.user_household_id();
  normalized_name := normalize_item_name(item_name);

  -- Step 0: Special case - if item contains "frozen", prioritize frozen category
  IF normalized_name LIKE '%frozen%' THEN
    SELECT category INTO suggested_category
    FROM category_mappings
    WHERE household_id = caller_household
      AND item_name_normalized LIKE '%frozen%'
    ORDER BY
      LENGTH(item_name_normalized) DESC,
      times_used DESC
    LIMIT 1;

    IF FOUND THEN
      UPDATE category_mappings
      SET times_used = times_used + 1,
          last_used_at = NOW()
      WHERE household_id = caller_household
        AND item_name_normalized = (
          SELECT item_name_normalized
          FROM category_mappings
          WHERE household_id = caller_household
            AND item_name_normalized LIKE '%frozen%'
          ORDER BY LENGTH(item_name_normalized) DESC, times_used DESC
          LIMIT 1
        );
      RETURN suggested_category;
    END IF;
  END IF;

  -- Step 1: Try exact match
  SELECT category INTO suggested_category
  FROM category_mappings
  WHERE household_id = caller_household
    AND item_name_normalized = normalized_name;

  IF FOUND THEN
    UPDATE category_mappings
    SET times_used = times_used + 1,
        last_used_at = NOW()
    WHERE household_id = caller_household
      AND item_name_normalized = normalized_name;
    RETURN suggested_category;
  END IF;

  -- Step 2: Try partial matching
  SELECT category INTO suggested_category
  FROM category_mappings
  WHERE household_id = caller_household
    AND (
      normalized_name LIKE '%' || item_name_normalized || '%'
      OR item_name_normalized LIKE '%' || normalized_name || '%'
    )
  ORDER BY
    LENGTH(item_name_normalized) DESC,
    times_used DESC
  LIMIT 1;

  IF FOUND THEN
    UPDATE category_mappings
    SET times_used = times_used + 1,
        last_used_at = NOW()
    WHERE household_id = caller_household
      AND item_name_normalized = (
        SELECT item_name_normalized
        FROM category_mappings
        WHERE household_id = caller_household
          AND (
            normalized_name LIKE '%' || item_name_normalized || '%'
            OR item_name_normalized LIKE '%' || normalized_name || '%'
          )
        ORDER BY LENGTH(item_name_normalized) DESC, times_used DESC
        LIMIT 1
      );
    RETURN suggested_category;
  END IF;

  -- Step 3: Not found - needs Claude categorization
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- save_category_mapping: now scoped to caller's household
CREATE OR REPLACE FUNCTION save_category_mapping(item_name TEXT, category_name TEXT)
RETURNS VOID AS $$
DECLARE
  normalized_name TEXT;
  caller_household UUID;
BEGIN
  caller_household := public.user_household_id();
  normalized_name := normalize_item_name(item_name);

  INSERT INTO category_mappings (household_id, item_name_normalized, category)
  VALUES (caller_household, normalized_name, category_name)
  ON CONFLICT (household_id, item_name_normalized)
  DO UPDATE SET
    category = EXCLUDED.category,
    times_used = category_mappings.times_used + 1,
    last_used_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 3. Fix search_path on all remaining functions
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_household_id()
RETURNS UUID AS $$
  SELECT household_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION normalize_item_name(item_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(TRIM(REGEXP_REPLACE(item_name, '\([^)]*\)', '', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION use_invite_code(code TEXT, user_id UUID)
RETURNS UUID AS $$
DECLARE
  invite_record household_invites%ROWTYPE;
BEGIN
  SELECT * INTO invite_record
  FROM household_invites
  WHERE invite_code = code
    AND expires_at > NOW()
    AND (max_uses IS NULL OR use_count < max_uses);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;

  UPDATE household_invites
  SET use_count = use_count + 1
  WHERE id = invite_record.id;

  INSERT INTO household_invite_uses (invite_id, used_by)
  VALUES (invite_record.id, user_id);

  RETURN invite_record.household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 4. Households INSERT policy — WITH CHECK (true) is intentional
--    New users must create a household during signup before
--    they belong to one. SELECT is already restricted to own
--    household. No change needed.
-- ============================================================
