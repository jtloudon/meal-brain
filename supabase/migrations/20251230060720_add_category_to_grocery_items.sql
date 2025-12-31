-- Add category field to grocery_items for per-item category overrides
-- This allows users to customize the category for specific grocery items
-- even if the ingredient has a different default category

ALTER TABLE grocery_items
  ADD COLUMN category TEXT DEFAULT 'Other';

-- Create index for category-based queries
CREATE INDEX idx_grocery_items_category ON grocery_items(category);

-- Populate existing items with category from their linked ingredient
-- If no ingredient is linked, default to 'Other'
UPDATE grocery_items gi
SET category = COALESCE(
  (SELECT i.category FROM ingredients i WHERE i.id = gi.ingredient_id),
  'Other'
);

COMMENT ON COLUMN grocery_items.category IS 'Grocery store category for this specific item. Can be overridden from the default ingredient category.';
