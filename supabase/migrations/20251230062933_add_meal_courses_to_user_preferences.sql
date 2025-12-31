-- Add meal_courses field to user_preferences for custom meal types
ALTER TABLE user_preferences
  ADD COLUMN meal_courses JSONB DEFAULT '[
    {"id": "breakfast", "name": "Breakfast", "time": "08:00", "color": "#22c55e"},
    {"id": "lunch", "name": "Lunch", "time": "12:00", "color": "#3b82f6"},
    {"id": "dinner", "name": "Dinner", "time": "18:00", "color": "#ef4444"},
    {"id": "snack", "name": "Snack", "time": "20:00", "color": "#f59e0b"}
  ]'::jsonb;

COMMENT ON COLUMN user_preferences.meal_courses IS 'Custom meal courses/types with time and color for planner display';
