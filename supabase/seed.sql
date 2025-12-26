-- Demo Data for Local Development
-- Run this with: supabase db reset

-- Demo Household
INSERT INTO households (id, name, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Demo Household', NOW());

-- Demo Auth Users (for local development only)
-- In production, these are created by Supabase Auth via magic-link
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, instance_id) VALUES
  ('10000000-0000-0000-0000-000000000001', 'demo@mealbrain.app', '', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
  ('10000000-0000-0000-0000-000000000002', 'spouse@mealbrain.app', '', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000');

-- Demo Users (link auth users to household)
INSERT INTO users (id, email, household_id, created_at) VALUES
  ('10000000-0000-0000-0000-000000000001', 'demo@mealbrain.app', '00000000-0000-0000-0000-000000000001', NOW()),
  ('10000000-0000-0000-0000-000000000002', 'spouse@mealbrain.app', '00000000-0000-0000-0000-000000000001', NOW());

-- Demo User Preferences (for first user)
INSERT INTO user_preferences (user_id, household_context, dietary_constraints, ai_style, planning_preferences, ai_learning_enabled, created_at) VALUES
  ('10000000-0000-0000-0000-000000000001',
   'couple',
   ARRAY['dairy-free'],
   'collaborator',
   ARRAY['week-by-week', 'batch-cooking'],
   true,
   NOW());

-- Demo Ingredients (canonical list)
INSERT INTO ingredients (id, canonical_name) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'chicken breast'),
  ('a0000000-0000-0000-0000-000000000002', 'rice'),
  ('a0000000-0000-0000-0000-000000000003', 'coconut milk'),
  ('a0000000-0000-0000-0000-000000000004', 'curry powder'),
  ('a0000000-0000-0000-0000-000000000005', 'onion'),
  ('a0000000-0000-0000-0000-000000000006', 'garlic'),
  ('a0000000-0000-0000-0000-000000000007', 'ground beef'),
  ('a0000000-0000-0000-0000-000000000008', 'taco shells'),
  ('a0000000-0000-0000-0000-000000000009', 'lettuce'),
  ('a0000000-0000-0000-0000-00000000000a', 'tomato'),
  ('a0000000-0000-0000-0000-00000000000b', 'cheddar cheese'),
  ('a0000000-0000-0000-0000-00000000000c', 'black beans'),
  ('a0000000-0000-0000-0000-00000000000d', 'bell pepper'),
  ('a0000000-0000-0000-0000-00000000000e', 'olive oil'),
  ('a0000000-0000-0000-0000-00000000000f', 'salt'),
  ('a0000000-0000-0000-0000-000000000010', 'black pepper');

-- Demo Recipes
INSERT INTO recipes (id, household_id, title, rating, tags, notes, created_at) VALUES
  ('b0000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Chicken Curry',
   5,
   ARRAY['chicken', 'dairy-free', 'asian'],
   'Family favorite! Double the sauce.',
   NOW()),
  ('b0000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   'Beef Tacos',
   4,
   ARRAY['beef', 'mexican', 'quick'],
   '20 minute meal',
   NOW()),
  ('b0000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000001',
   'Black Bean Tacos',
   4,
   ARRAY['vegetarian', 'mexican', 'dairy-free'],
   'Great for batch cooking',
   NOW());

-- Recipe Ingredients (Chicken Curry)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, display_name, quantity, unit, prep_state, optional) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'chicken breast', 1.5, 'lb', 'diced', false),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'rice', 2, 'cup', 'uncooked', false),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'coconut milk', 1, 'can', null, false),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'curry powder', 2, 'tbsp', null, false),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'onion', 1, 'whole', 'diced', false),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000006', 'garlic', 3, 'clove', 'minced', false);

-- Recipe Ingredients (Beef Tacos)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, display_name, quantity, unit, prep_state, optional) VALUES
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000007', 'ground beef', 1, 'lb', null, false),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000008', 'taco shells', 8, 'whole', null, false),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000009', 'lettuce', 1, 'cup', 'shredded', false),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-00000000000a', 'tomato', 2, 'whole', 'diced', false),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-00000000000b', 'cheddar cheese', 1, 'cup', 'shredded', true);

-- Recipe Ingredients (Black Bean Tacos)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, display_name, quantity, unit, prep_state, optional) VALUES
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-00000000000c', 'black beans', 2, 'can', 'drained', false),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000008', 'taco shells', 8, 'whole', null, false),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-00000000000d', 'bell pepper', 1, 'whole', 'sliced', false),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000005', 'onion', 1, 'whole', 'diced', false),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000009', 'lettuce', 1, 'cup', 'shredded', false);

-- Demo Planner Meals (this week)
INSERT INTO planner_meals (household_id, recipe_id, date, meal_type) VALUES
  ('00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', CURRENT_DATE, 'dinner'),
  ('00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', CURRENT_DATE + INTERVAL '1 day', 'dinner'),
  ('00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', CURRENT_DATE + INTERVAL '2 days', 'dinner');

-- Demo Grocery List
INSERT INTO grocery_lists (id, household_id, name, created_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'This Week', NOW());

-- Demo Grocery Items (from planner meals)
INSERT INTO grocery_items (grocery_list_id, ingredient_id, display_name, quantity, unit, checked) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'chicken breast', 1.5, 'lb', false),
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'rice', 2, 'cup', false),
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'coconut milk', 1, 'can', false),
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000007', 'ground beef', 1, 'lb', false),
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000008', 'taco shells', 16, 'whole', true),
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000c', 'black beans', 2, 'can', false),
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'onion', 2, 'whole', false);
