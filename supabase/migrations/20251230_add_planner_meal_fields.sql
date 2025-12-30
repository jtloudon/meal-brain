-- Add serving_size and notes fields to planner_meals table
-- Migration: 20251230_add_planner_meal_fields

ALTER TABLE planner_meals
ADD COLUMN IF NOT EXISTS serving_size INTEGER,
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN planner_meals.serving_size IS 'Number of servings planned for this meal';
COMMENT ON COLUMN planner_meals.notes IS 'Optional notes for this planned meal';
