-- Add shopping_categories column to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS shopping_categories JSONB DEFAULT '["Produce", "Meat & Seafood", "Dairy & Eggs", "Bakery", "Frozen", "Canned Goods", "Condiments & Sauces", "Beverages", "Snacks & Treats", "Pantry", "Household", "Other"]'::jsonb;

-- Update existing user_preferences to have default categories
UPDATE user_preferences 
SET shopping_categories = '["Produce", "Meat & Seafood", "Dairy & Eggs", "Bakery", "Frozen", "Canned Goods", "Condiments & Sauces", "Beverages", "Snacks & Treats", "Pantry", "Household", "Other"]'::jsonb
WHERE shopping_categories IS NULL;
