-- Add default grocery list preference to user_preferences table
-- Allows users to set a default list for quick ingredient additions

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS default_grocery_list_id UUID REFERENCES grocery_lists(id) ON DELETE SET NULL;

COMMENT ON COLUMN user_preferences.default_grocery_list_id IS 'Default grocery list for quick ingredient additions. Pre-selected in push modals.';
