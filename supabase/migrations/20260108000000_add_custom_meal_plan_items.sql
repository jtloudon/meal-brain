-- Add support for custom items in meal planner (sides, leftovers, etc.)
-- Option A: Extend planner_meals table to support custom items

-- 1. Make recipe_id nullable to allow custom items without recipes
ALTER TABLE planner_meals
  ALTER COLUMN recipe_id DROP NOT NULL;

-- 2. Add custom_title for custom items (e.g., "BBQ Chicken", "Coleslaw")
ALTER TABLE planner_meals
  ADD COLUMN custom_title TEXT;

-- 3. Add custom_item_type to categorize custom items
ALTER TABLE planner_meals
  ADD COLUMN custom_item_type TEXT CHECK (custom_item_type IN ('side', 'leftovers', 'other'));

-- 4. Add constraint: Either recipe_id OR custom_title must be present (not both, not neither)
ALTER TABLE planner_meals
  ADD CONSTRAINT planner_meals_item_type_check
  CHECK (
    (recipe_id IS NOT NULL AND custom_title IS NULL)
    OR
    (recipe_id IS NULL AND custom_title IS NOT NULL)
  );

-- 5. Add index for querying custom items
CREATE INDEX idx_planner_meals_custom_items ON planner_meals(household_id, date)
  WHERE recipe_id IS NULL;

-- Note: Existing 'notes' field can be used for additional context on both recipe and custom items
