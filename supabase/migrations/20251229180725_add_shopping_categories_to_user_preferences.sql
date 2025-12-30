-- Add shopping_categories column to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS shopping_categories JSONB DEFAULT '["Produce", "Meat & Seafood", "Dairy", "Bakery", "Frozen Food", "Canned Goods", "Condiments & Sauces", "Beverages", "Snacks", "Cooking & Baking", "Other"]'::jsonb;
