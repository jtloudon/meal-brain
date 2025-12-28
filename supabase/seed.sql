-- ============================================================================
-- SEED DATA STRATEGY
-- ============================================================================
--
-- This file seeds TWO households for different purposes:
--
-- 1. DEMO HOUSEHOLD (00000000-0000-4000-8000-000000000001)
--    - Purpose: Local development browsing
--    - Contains: 3 recipes, ingredients, grocery list with items
--    - Access: Use /dev-login page (dev mode only)
--    - Users: Created dynamically via /dev-login
--
-- 2. TEST HOUSEHOLD (00000000-0000-4000-8000-000000000002)
--    - Purpose: Automated tests (E2E, integration)
--    - Contains: No recipes (tests create their own)
--    - Access: Tests create temp users programmatically
--    - Users: Created/deleted by test setup/teardown
--
-- IMPORTANT: We do NOT seed auth.users!
-- - Auth users are managed by Supabase Auth
-- - Seeding them causes "user already exists" conflicts
-- - Dev: /dev-login creates them on-demand
-- - Tests: Test helpers create/cleanup programmatically
-- - Production: Magic link creates them naturally
--
-- ============================================================================

-- Demo Household (for local dev via /dev-login)
INSERT INTO households (id, name, created_at) VALUES
  ('00000000-0000-4000-8000-000000000001', 'Demo Household', NOW());

-- Test Household (for automated tests only)
INSERT INTO households (id, name, created_at) VALUES
  ('00000000-0000-4000-8000-000000000002', 'Test Household', NOW());

-- Demo Ingredients (canonical list)
INSERT INTO ingredients (id, canonical_name) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'chicken breast'),
  ('a0000000-0000-4000-8000-000000000002', 'rice'),
  ('a0000000-0000-4000-8000-000000000003', 'coconut milk'),
  ('a0000000-0000-4000-8000-000000000004', 'curry powder'),
  ('a0000000-0000-4000-8000-000000000005', 'onion'),
  ('a0000000-0000-4000-8000-000000000006', 'garlic'),
  ('a0000000-0000-4000-8000-000000000007', 'ground beef'),
  ('a0000000-0000-4000-8000-000000000008', 'taco shells'),
  ('a0000000-0000-4000-8000-000000000009', 'lettuce'),
  ('a0000000-0000-4000-8000-00000000000a', 'tomato'),
  ('a0000000-0000-4000-8000-00000000000b', 'cheddar cheese'),
  ('a0000000-0000-4000-8000-00000000000c', 'black beans'),
  ('a0000000-0000-4000-8000-00000000000d', 'bell pepper'),
  ('a0000000-0000-4000-8000-00000000000e', 'olive oil'),
  ('a0000000-0000-4000-8000-00000000000f', 'salt'),
  ('a0000000-0000-0000-0000-000000000010', 'black pepper');

-- Demo Recipes
INSERT INTO recipes (id, household_id, title, rating, tags, notes, instructions, image_url, created_at) VALUES
  ('b0000000-0000-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000001',
   'Chicken Curry',
   5,
   ARRAY['chicken', 'dairy-free', 'asian'],
   'Family favorite! Double the sauce.',
   E'1. Heat oil in large pan over medium-high heat\n2. Cook diced chicken until browned (5-7 min)\n3. Add diced onion and minced garlic, cook until softened (3 min)\n4. Stir in curry powder, cook 1 min until fragrant\n5. Add coconut milk, bring to simmer\n6. Reduce heat and simmer 15-20 min until chicken is cooked through\n7. Meanwhile, cook rice according to package directions\n8. Serve curry over rice',
   'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80',
   NOW()),
  ('b0000000-0000-4000-8000-000000000002',
   '00000000-0000-4000-8000-000000000001',
   'Beef Tacos',
   4,
   ARRAY['beef', 'mexican', 'quick'],
   '20 minute meal',
   E'1. Brown ground beef in skillet over medium-high heat (8-10 min)\n2. Drain excess fat\n3. Season with taco seasoning and a splash of water\n4. Simmer 5 min until thickened\n5. Warm taco shells according to package\n6. Assemble: shells, beef, lettuce, tomato, cheese',
   'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&q=80',
   NOW()),
  ('b0000000-0000-4000-8000-000000000003',
   '00000000-0000-4000-8000-000000000001',
   'Black Bean Tacos',
   4,
   ARRAY['vegetarian', 'mexican', 'dairy-free'],
   'Great for batch cooking',
   E'1. Heat oil in skillet over medium heat\n2. Sauté diced onion and sliced bell pepper until softened (5-7 min)\n3. Add drained black beans, cumin, and chili powder\n4. Cook until heated through (3-5 min)\n5. Mash beans slightly with fork for better texture\n6. Warm taco shells\n7. Assemble: shells, black bean mixture, lettuce\n8. Top with salsa or hot sauce if desired',
   NULL,
   NOW());

-- Recipe Ingredients (Chicken Curry)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, display_name, quantity, unit, prep_state, optional) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'chicken breast', 1.5, 'lb', 'diced', false),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'rice', 2, 'cup', 'uncooked', false),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 'coconut milk', 1, 'can', null, false),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 'curry powder', 2, 'tbsp', null, false),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000005', 'onion', 1, 'whole', 'diced', false),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000006', 'garlic', 3, 'clove', 'minced', false);

-- Recipe Ingredients (Beef Tacos)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, display_name, quantity, unit, prep_state, optional) VALUES
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000007', 'ground beef', 1, 'lb', null, false),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000008', 'taco shells', 8, 'whole', null, false),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000009', 'lettuce', 1, 'cup', 'shredded', false),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-00000000000a', 'tomato', 2, 'whole', 'diced', false),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-00000000000b', 'cheddar cheese', 1, 'cup', 'shredded', true);

-- Recipe Ingredients (Black Bean Tacos)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, display_name, quantity, unit, prep_state, optional) VALUES
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-00000000000c', 'black beans', 2, 'can', 'drained', false),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000008', 'taco shells', 8, 'whole', null, false),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-00000000000d', 'bell pepper', 1, 'whole', 'sliced', false),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000005', 'onion', 1, 'whole', 'diced', false),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000009', 'lettuce', 1, 'cup', 'shredded', false);

-- Demo Planner Meals (this week)
INSERT INTO planner_meals (household_id, recipe_id, date, meal_type) VALUES
  ('00000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', CURRENT_DATE, 'dinner'),
  ('00000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', CURRENT_DATE + INTERVAL '1 day', 'dinner'),
  ('00000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000003', CURRENT_DATE + INTERVAL '2 days', 'dinner');

-- Demo Grocery List
INSERT INTO grocery_lists (id, household_id, name, created_at) VALUES
  ('c0000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'This Week', NOW());

-- Demo Grocery Items (from planner meals)
INSERT INTO grocery_items (grocery_list_id, ingredient_id, display_name, quantity, unit, checked) VALUES
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'chicken breast', 1.5, 'lb', false),
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'rice', 2, 'cup', false),
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 'coconut milk', 1, 'can', false),
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000007', 'ground beef', 1, 'lb', false),
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000008', 'taco shells', 16, 'whole', true),
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-00000000000c', 'black beans', 2, 'can', false),
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000005', 'onion', 2, 'whole', false);
