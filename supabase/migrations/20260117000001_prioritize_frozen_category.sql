-- Special handling for "frozen" keyword
-- Frozen items should go to Frozen section regardless of what they are
-- Example: "frozen strawberries" → Frozen (not Produce)
-- Rationale: Grocery store layout - frozen aisle is separate from produce

CREATE OR REPLACE FUNCTION get_suggested_category(item_name TEXT)
RETURNS TEXT AS $$
DECLARE
  normalized_name TEXT;
  suggested_category TEXT;
BEGIN
  normalized_name := normalize_item_name(item_name);

  -- Step 0: Special case - if item contains "frozen", prioritize frozen category
  -- This handles grocery store layout: frozen items are in freezer aisle, not their normal section
  IF normalized_name LIKE '%frozen%' THEN
    -- Try to find a frozen-specific mapping first
    SELECT category INTO suggested_category
    FROM category_mappings
    WHERE item_name_normalized LIKE '%frozen%'
    ORDER BY
      LENGTH(item_name_normalized) DESC,
      times_used DESC
    LIMIT 1;

    IF FOUND THEN
      -- Update usage stats
      UPDATE category_mappings
      SET times_used = times_used + 1,
          last_used_at = NOW()
      WHERE item_name_normalized = (
        SELECT item_name_normalized
        FROM category_mappings
        WHERE item_name_normalized LIKE '%frozen%'
        ORDER BY LENGTH(item_name_normalized) DESC, times_used DESC
        LIMIT 1
      );
      RETURN suggested_category;
    END IF;
  END IF;

  -- Step 1: Try exact match (fastest)
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

  -- Step 2: Try partial matching
  -- Check if normalized input contains any table entry
  -- OR if any table entry contains the input
  -- Order by length of match (longer matches = more specific)
  SELECT category INTO suggested_category
  FROM category_mappings
  WHERE
    -- Input contains the table entry (e.g., "frozen strawberries" contains "frozen")
    normalized_name LIKE '%' || item_name_normalized || '%'
    -- OR table entry contains the input (e.g., "strawberries" in "frozen strawberries" table entry)
    OR item_name_normalized LIKE '%' || normalized_name || '%'
  ORDER BY
    -- Prefer longer matches (more specific)
    LENGTH(item_name_normalized) DESC,
    -- Prefer more frequently used mappings
    times_used DESC
  LIMIT 1;

  IF FOUND THEN
    -- Update usage stats for the matched entry
    UPDATE category_mappings
    SET times_used = times_used + 1,
        last_used_at = NOW()
    WHERE item_name_normalized = (
      SELECT item_name_normalized
      FROM category_mappings
      WHERE
        normalized_name LIKE '%' || item_name_normalized || '%'
        OR item_name_normalized LIKE '%' || normalized_name || '%'
      ORDER BY
        LENGTH(item_name_normalized) DESC,
        times_used DESC
      LIMIT 1
    );

    RETURN suggested_category;
  END IF;

  -- Step 3: Not found - needs Claude categorization
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update comment
COMMENT ON FUNCTION get_suggested_category(TEXT) IS
'Gets cached category for an item with smart matching rules.
Special handling: Items containing "frozen" prioritize Frozen category (grocery layout).
Then tries exact match, then partial/fuzzy matching.
Example: "frozen strawberries" → matches "frozen fruit" → Frozen (not Produce).
Returns NULL if no match found (needs Claude categorization).';
