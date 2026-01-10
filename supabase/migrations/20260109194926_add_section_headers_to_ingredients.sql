-- Add is_header flag to recipe_ingredients
ALTER TABLE recipe_ingredients
ADD COLUMN is_header BOOLEAN NOT NULL DEFAULT false;

-- Modify quantity_min constraint to allow 0 for headers
-- (Drop both possible constraint names from column rename)
ALTER TABLE recipe_ingredients
DROP CONSTRAINT IF EXISTS recipe_ingredients_quantity_check;

ALTER TABLE recipe_ingredients
DROP CONSTRAINT IF EXISTS recipe_ingredients_quantity_min_check;

ALTER TABLE recipe_ingredients
ADD CONSTRAINT recipe_ingredients_quantity_min_check
CHECK ((is_header = true AND quantity_min = 0) OR (is_header = false AND quantity_min > 0));

-- Add comment explaining the column
COMMENT ON COLUMN recipe_ingredients.is_header IS 'When true, this row is a section header (e.g. "**Bang Bang Sauce"). Headers have quantity_min=0, quantity_max=NULL, unit="", and are skipped when scaling recipes or pushing to grocery lists.';
