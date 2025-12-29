-- Add category field to ingredients for grocery list grouping
ALTER TABLE ingredients
  ADD COLUMN category TEXT DEFAULT 'Other';

-- Create index for category-based queries
CREATE INDEX idx_ingredients_category ON ingredients(category);

-- Update existing ingredients with common categories
-- These can be refined later, but provide sensible defaults
UPDATE ingredients SET category = 'Produce' WHERE canonical_name IN ('onion', 'garlic', 'bell pepper', 'jalapeño', 'lime', 'cilantro', 'tomato', 'lettuce');
UPDATE ingredients SET category = 'Meat & Seafood' WHERE canonical_name IN ('chicken breast', 'ground beef', 'flank steak', 'steak');
UPDATE ingredients SET category = 'Dairy & Eggs' WHERE canonical_name IN ('milk', 'cheese', 'butter', 'yogurt', 'sour cream');
UPDATE ingredients SET category = 'Pantry' WHERE canonical_name IN ('rice', 'flour', 'sugar', 'salt', 'pepper');
UPDATE ingredients SET category = 'Condiments, Sauces & Spices' WHERE canonical_name IN ('olive oil', 'soy sauce', 'worcestershire sauce', 'paprika', 'cumin', 'chili powder', 'garlic powder');
UPDATE ingredients SET category = 'Bakery' WHERE canonical_name IN ('tortillas', 'bread', 'taco shells');
UPDATE ingredients SET category = 'Canned & Jarred' WHERE canonical_name IN ('black beans', 'coconut milk', 'tomato sauce', 'salsa');

COMMENT ON COLUMN ingredients.category IS 'Grocery store category for organizing shopping lists (e.g., Produce, Meat & Seafood, Bakery)';
