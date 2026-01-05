-- Initial schema for MealBrain
-- Creates core tables for households, users, recipes, meal planning, and grocery lists

-- Note: Using gen_random_uuid() (built-in PostgreSQL function, no extension needed)

-- Households table
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table (synced with Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  household_context TEXT CHECK (household_context IN ('just-me', 'couple', 'family')),
  dietary_constraints TEXT[] DEFAULT '{}',
  ai_style TEXT CHECK (ai_style IN ('coach', 'collaborator')),
  planning_preferences TEXT[] DEFAULT '{}',
  ai_learning_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recipes table
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ingredient dictionary (canonical names)
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL UNIQUE,
  aliases TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recipe ingredients (structured, normalized)
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  quantity DECIMAL(10, 3) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL,
  prep_state TEXT,
  optional BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Planner meals (scheduled meals)
CREATE TABLE planner_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grocery lists
CREATE TABLE grocery_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grocery items (aggregated from recipes)
CREATE TABLE grocery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grocery_list_id UUID NOT NULL REFERENCES grocery_lists(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  quantity DECIMAL(10, 3) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL,
  checked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_users_household ON users(household_id);
CREATE INDEX idx_recipes_household ON recipes(household_id);
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_planner_meals_household ON planner_meals(household_id);
CREATE INDEX idx_planner_meals_date ON planner_meals(date);
CREATE INDEX idx_grocery_lists_household ON grocery_lists(household_id);
CREATE INDEX idx_grocery_items_list ON grocery_items(grocery_list_id);

-- Enable Row Level Security (RLS)
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access data from their own household
-- Helper function to get user's household_id
CREATE OR REPLACE FUNCTION public.user_household_id()
RETURNS UUID AS $$
  SELECT household_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Households: Users can read their own household
CREATE POLICY "Users can read own household"
  ON households FOR SELECT
  USING (id = public.user_household_id());

-- Households: Authenticated users can create households
CREATE POLICY "Users can create households"
  ON households FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users: Users can read their own record (even without household) AND household members
CREATE POLICY "Users can read own record"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can read household members"
  ON users FOR SELECT
  USING (household_id = public.user_household_id());

-- Users: Users can create their own record
CREATE POLICY "Users can create own record"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- User preferences: Users can manage their own preferences
CREATE POLICY "Users can read own preferences"
  ON user_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Recipes: Users can manage recipes in their household
CREATE POLICY "Users can read household recipes"
  ON recipes FOR SELECT
  USING (household_id = public.user_household_id());

CREATE POLICY "Users can insert household recipes"
  ON recipes FOR INSERT
  WITH CHECK (household_id = public.user_household_id());

CREATE POLICY "Users can update household recipes"
  ON recipes FOR UPDATE
  USING (household_id = public.user_household_id());

CREATE POLICY "Users can delete household recipes"
  ON recipes FOR DELETE
  USING (household_id = public.user_household_id());

-- Ingredients: Everyone can read (shared dictionary)
CREATE POLICY "Anyone can read ingredients"
  ON ingredients FOR SELECT
  TO authenticated
  USING (true);

-- Recipe ingredients: Users can manage ingredients for their household's recipes
CREATE POLICY "Users can read household recipe ingredients"
  ON recipe_ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.household_id = public.user_household_id()
    )
  );

CREATE POLICY "Users can insert household recipe ingredients"
  ON recipe_ingredients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.household_id = public.user_household_id()
    )
  );

CREATE POLICY "Users can update household recipe ingredients"
  ON recipe_ingredients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.household_id = public.user_household_id()
    )
  );

CREATE POLICY "Users can delete household recipe ingredients"
  ON recipe_ingredients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.household_id = public.user_household_id()
    )
  );

-- Planner meals: Users can manage meals in their household
CREATE POLICY "Users can read household planner meals"
  ON planner_meals FOR SELECT
  USING (household_id = public.user_household_id());

CREATE POLICY "Users can insert household planner meals"
  ON planner_meals FOR INSERT
  WITH CHECK (household_id = public.user_household_id());

CREATE POLICY "Users can update household planner meals"
  ON planner_meals FOR UPDATE
  USING (household_id = public.user_household_id());

CREATE POLICY "Users can delete household planner meals"
  ON planner_meals FOR DELETE
  USING (household_id = public.user_household_id());

-- Grocery lists: Users can manage lists in their household
CREATE POLICY "Users can read household grocery lists"
  ON grocery_lists FOR SELECT
  USING (household_id = public.user_household_id());

CREATE POLICY "Users can insert household grocery lists"
  ON grocery_lists FOR INSERT
  WITH CHECK (household_id = public.user_household_id());

CREATE POLICY "Users can update household grocery lists"
  ON grocery_lists FOR UPDATE
  USING (household_id = public.user_household_id());

CREATE POLICY "Users can delete household grocery lists"
  ON grocery_lists FOR DELETE
  USING (household_id = public.user_household_id());

-- Grocery items: Users can manage items in their household's lists
CREATE POLICY "Users can read household grocery items"
  ON grocery_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM grocery_lists
      WHERE grocery_lists.id = grocery_items.grocery_list_id
      AND grocery_lists.household_id = public.user_household_id()
    )
  );

CREATE POLICY "Users can insert household grocery items"
  ON grocery_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM grocery_lists
      WHERE grocery_lists.id = grocery_items.grocery_list_id
      AND grocery_lists.household_id = public.user_household_id()
    )
  );

CREATE POLICY "Users can update household grocery items"
  ON grocery_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM grocery_lists
      WHERE grocery_lists.id = grocery_items.grocery_list_id
      AND grocery_lists.household_id = public.user_household_id()
    )
  );

CREATE POLICY "Users can delete household grocery items"
  ON grocery_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM grocery_lists
      WHERE grocery_lists.id = grocery_items.grocery_list_id
      AND grocery_lists.household_id = public.user_household_id()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
