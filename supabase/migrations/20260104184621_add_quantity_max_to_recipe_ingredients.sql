-- Add quantity_max column to support ingredient ranges like "1-2 salmon fillets"
-- quantity_min: minimum quantity (required)
-- quantity_max: maximum quantity (nullable, NULL means no range)

-- Add the new column
ALTER TABLE recipe_ingredients
  ADD COLUMN quantity_max DECIMAL(10,3) NULL;

-- Rename existing quantity to quantity_min for clarity
ALTER TABLE recipe_ingredients
  RENAME COLUMN quantity TO quantity_min;

-- Add comment for documentation
COMMENT ON COLUMN recipe_ingredients.quantity_min IS 'Minimum quantity (or single quantity if no range)';
COMMENT ON COLUMN recipe_ingredients.quantity_max IS 'Maximum quantity for ranges (NULL if no range)';

-- Example data after migration:
-- "2 cups flour" → quantity_min: 2, quantity_max: NULL
-- "1-2 salmon fillets" → quantity_min: 1, quantity_max: 2
-- "½-1 cup water" → quantity_min: 0.5, quantity_max: 1
