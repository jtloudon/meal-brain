-- Add metadata fields to recipes table
-- Fields: source, serving_size, prep_time, cook_time

ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS serving_size TEXT,
ADD COLUMN IF NOT EXISTS prep_time TEXT,
ADD COLUMN IF NOT EXISTS cook_time TEXT;

-- Add comments for documentation
COMMENT ON COLUMN recipes.source IS 'Recipe source - URL or user notes (e.g., "NYT Cooking", "Grandma''s recipe")';
COMMENT ON COLUMN recipes.serving_size IS 'Serving size description (e.g., "Serves 4-6", "12 cookies")';
COMMENT ON COLUMN recipes.prep_time IS 'Preparation time (e.g., "15 mins", "1 hour")';
COMMENT ON COLUMN recipes.cook_time IS 'Cooking time (e.g., "30 mins", "2 hours")';
