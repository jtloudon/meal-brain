-- Remove hardcoded meal type CHECK constraints to support dynamic meal types
-- Users can now define custom meal types in settings > meal planner

-- Drop CHECK constraint from recipes.meal_type
ALTER TABLE recipes
  DROP CONSTRAINT IF EXISTS recipes_meal_type_check;

-- Drop CHECK constraint from planner_meals.meal_type
ALTER TABLE planner_meals
  DROP CONSTRAINT IF EXISTS planner_meals_meal_type_check;

-- Meal types are now validated by the application layer using user_preferences.meal_courses
