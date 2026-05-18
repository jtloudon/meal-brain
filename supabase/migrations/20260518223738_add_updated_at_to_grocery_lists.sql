-- Add updated_at column to grocery_lists
ALTER TABLE grocery_lists ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Trigger: update updated_at when the list row itself changes (rename, protect toggle)
CREATE TRIGGER update_grocery_lists_updated_at
  BEFORE UPDATE ON grocery_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function + trigger: bump grocery_list.updated_at when any item is added/edited/deleted
CREATE OR REPLACE FUNCTION update_parent_list_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE grocery_lists SET updated_at = NOW()
  WHERE id = COALESCE(NEW.grocery_list_id, OLD.grocery_list_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_grocery_list_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON grocery_items
  FOR EACH ROW EXECUTE FUNCTION update_parent_list_updated_at();
