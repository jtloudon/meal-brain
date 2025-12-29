-- Add meal_type field to recipes table
-- Meal types: breakfast, lunch, dinner, snack

ALTER TABLE recipes
  ADD COLUMN meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'));

COMMENT ON COLUMN recipes.meal_type IS 'Meal type classification: breakfast, lunch, dinner, or snack';
