-- Add protected flag to grocery lists
ALTER TABLE grocery_lists
ADD COLUMN protected BOOLEAN NOT NULL DEFAULT false;

-- Add comment explaining the column
COMMENT ON COLUMN grocery_lists.protected IS 'When true, prevents bulk delete operations and hides shopping-specific UI (out-of-stock icons, check all). Useful for master/catalog lists.';
