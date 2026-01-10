-- First, check what constraints exist
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'recipe_ingredients'::regclass 
  AND contype = 'c';

-- Drop ALL check constraints on recipe_ingredients
ALTER TABLE recipe_ingredients 
DROP CONSTRAINT IF EXISTS recipe_ingredients_quantity_check CASCADE;

ALTER TABLE recipe_ingredients 
DROP CONSTRAINT IF EXISTS recipe_ingredients_quantity_min_check CASCADE;

-- Add the correct constraint that allows 0 for headers
ALTER TABLE recipe_ingredients
ADD CONSTRAINT recipe_ingredients_quantity_min_check
CHECK ((is_header = true AND quantity_min = 0) OR (is_header = false AND quantity_min > 0));
