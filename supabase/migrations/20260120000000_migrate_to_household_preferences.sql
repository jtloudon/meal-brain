-- Migrate user preferences to household level
-- This fixes the issue where shopping categories, meal courses, and AI preferences
-- were per-user instead of shared across household members

-- Create household_preferences table
CREATE TABLE household_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE UNIQUE,
  household_context TEXT CHECK (household_context IN ('just-me', 'couple', 'family')),
  dietary_constraints TEXT[] DEFAULT '{}',
  ai_style TEXT CHECK (ai_style IN ('coach', 'collaborator')),
  planning_preferences TEXT[] DEFAULT '{}',
  ai_learning_enabled BOOLEAN DEFAULT true,
  shopping_categories JSONB DEFAULT '["Produce", "Meat & Seafood", "Dairy & Eggs", "Bakery", "Frozen", "Canned Goods", "Condiments & Sauces", "Beverages", "Snacks & Treats", "Pantry", "Household", "Other"]'::jsonb,
  meal_courses JSONB DEFAULT '[
    {"id": "breakfast", "name": "Breakfast", "time": "08:00", "color": "#22c55e"},
    {"id": "lunch", "name": "Lunch", "time": "12:00", "color": "#3b82f6"},
    {"id": "dinner", "name": "Dinner", "time": "18:00", "color": "#ef4444"},
    {"id": "snack", "name": "Snack", "time": "20:00", "color": "#f59e0b"}
  ]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE household_preferences IS 'Household-wide settings shared by all household members';
COMMENT ON COLUMN household_preferences.shopping_categories IS 'Custom grocery list categories for the household';
COMMENT ON COLUMN household_preferences.meal_courses IS 'Custom meal courses/types with time and color for planner display';

-- Migrate existing user preferences to household level
-- Take the first user's preferences for each household
INSERT INTO household_preferences (
  household_id,
  household_context,
  dietary_constraints,
  ai_style,
  planning_preferences,
  ai_learning_enabled,
  shopping_categories,
  meal_courses,
  created_at,
  updated_at
)
SELECT DISTINCT ON (u.household_id)
  u.household_id,
  up.household_context,
  up.dietary_constraints,
  up.ai_style,
  up.planning_preferences,
  up.ai_learning_enabled,
  COALESCE(up.shopping_categories, '["Produce", "Meat & Seafood", "Dairy & Eggs", "Bakery", "Frozen", "Canned Goods", "Condiments & Sauces", "Beverages", "Snacks & Treats", "Pantry", "Household", "Other"]'::jsonb),
  COALESCE(up.meal_courses, '[
    {"id": "breakfast", "name": "Breakfast", "time": "08:00", "color": "#22c55e"},
    {"id": "lunch", "name": "Lunch", "time": "12:00", "color": "#3b82f6"},
    {"id": "dinner", "name": "Dinner", "time": "18:00", "color": "#ef4444"},
    {"id": "snack", "name": "Snack", "time": "20:00", "color": "#f59e0b"}
  ]'::jsonb),
  up.created_at,
  up.updated_at
FROM users u
LEFT JOIN user_preferences up ON up.user_id = u.id
WHERE u.household_id IS NOT NULL
ORDER BY u.household_id, up.updated_at DESC NULLS LAST;

-- Remove household-level columns from user_preferences (keep only user-specific settings)
ALTER TABLE user_preferences
  DROP COLUMN IF EXISTS household_context,
  DROP COLUMN IF EXISTS dietary_constraints,
  DROP COLUMN IF EXISTS ai_style,
  DROP COLUMN IF EXISTS planning_preferences,
  DROP COLUMN IF EXISTS ai_learning_enabled,
  DROP COLUMN IF EXISTS shopping_categories,
  DROP COLUMN IF EXISTS meal_courses;

COMMENT ON TABLE user_preferences IS 'User-specific preferences (theme color, etc.)';
COMMENT ON COLUMN user_preferences.theme_color IS 'User-selected theme color in hex format (e.g., #f97316)';

-- Create index for faster household preferences lookups
CREATE INDEX idx_household_preferences_household_id ON household_preferences(household_id);
