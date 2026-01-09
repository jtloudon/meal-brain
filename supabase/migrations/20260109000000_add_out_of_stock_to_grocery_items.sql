-- Add out_of_stock column to grocery_items table
ALTER TABLE grocery_items
ADD COLUMN out_of_stock BOOLEAN DEFAULT FALSE NOT NULL;

-- Add index for querying out of stock items
CREATE INDEX idx_grocery_items_out_of_stock ON grocery_items(out_of_stock);
