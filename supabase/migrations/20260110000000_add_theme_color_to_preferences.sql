-- Add theme_color column to user_preferences table
-- Allows users to customize their app's accent color

ALTER TABLE user_preferences
ADD COLUMN theme_color TEXT DEFAULT '#f97316'
CHECK (theme_color ~ '^#[0-9A-Fa-f]{6}$');

COMMENT ON COLUMN user_preferences.theme_color IS 'User-selected theme color in hex format (e.g., #f97316)';

