-- Enhanced category matching with fuzzy/partial matching
-- This makes the category_mappings table much more effective
-- Example: "frozen strawberries" will match "frozen fruit" in the table

CREATE OR REPLACE FUNCTION get_suggested_category(item_name TEXT)
RETURNS TEXT AS $$
DECLARE
  normalized_name TEXT;
  suggested_category TEXT;
BEGIN
  normalized_name := normalize_item_name(item_name);

  -- Step 1: Try exact match first (fastest)
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

-- Add comment explaining the fuzzy matching
COMMENT ON FUNCTION get_suggested_category(TEXT) IS
'Gets cached category for an item with fuzzy matching.
Tries exact match first, then partial matching.
Example: "frozen strawberries" will match "frozen fruit" in cache.
Returns NULL if no match found (needs Claude categorization).';
