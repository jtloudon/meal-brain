-- Add source_recipe_id to track which recipe an ingredient came from
-- This enables displaying "from [Recipe Name]" in the grocery list UI
ALTER TABLE grocery_items
  ADD COLUMN source_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL;

-- Add prep_state to store preparation instructions (e.g., "chopped", "diced")
ALTER TABLE grocery_items
  ADD COLUMN prep_state TEXT;

-- Add index for performance when querying items by recipe or joining with recipes
CREATE INDEX idx_grocery_items_source_recipe ON grocery_items(source_recipe_id);

-- Add comment explaining the ON DELETE SET NULL behavior
COMMENT ON COLUMN grocery_items.source_recipe_id IS 'References the recipe this item was pushed from. Set to NULL if source recipe is deleted to preserve grocery items.';
