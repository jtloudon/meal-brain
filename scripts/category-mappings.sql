-- Category mappings for top 150 common grocery items
-- Run this in Supabase SQL Editor
-- Safe to run multiple times (uses ON CONFLICT)

-- Produce (50 items)
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('potatoes', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('onions', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('tomatoes', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('bananas', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('apples', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('carrots', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('lettuce', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('cucumber', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('bell peppers', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('broccoli', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('cauliflower', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('spinach', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('celery', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('mushrooms', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('sliced mushrooms', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('garlic', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('ginger', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('avocados', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('lemon', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('limes', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('strawberries', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('blueberries', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('grapes', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('oranges', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('cilantro', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('parsley', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('basil', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('green beans', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('zucchini', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('squash', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('sweet potatoes', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('corn', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('cabbage', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('coleslaw', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('kale', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('arugula', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('romaine lettuce', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('cherry tomatoes', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('jalapeños', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('green onions', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('scallions', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('shallots', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('radishes', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('beets', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('asparagus', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('brussels sprouts', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('eggplant', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('power greens', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('revol greens romain or spring', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('mixed greens', 'Produce') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;

-- Dairy (15 items)
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('milk', 'Dairy') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('eggs', 'Dairy') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('butter', 'Dairy') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('cheese', 'Dairy') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('cheddar cheese', 'Dairy') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('mozzarella cheese', 'Dairy') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('parmesan cheese', 'Dairy') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('cream cheese', 'Dairy') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('sour cream', 'Dairy') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('yogurt', 'Dairy') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('greek yogurt', 'Dairy') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('heavy cream', 'Dairy') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('half and half', 'Dairy') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('cottage cheese', 'Dairy') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('dairy free creamer', 'Dairy') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;

-- Meat & Seafood (20 items)
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('chicken breast', 'Meat & Seafood') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('chicken thighs', 'Meat & Seafood') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('ground beef', 'Meat & Seafood') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('ground turkey', 'Meat & Seafood') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('pork chops', 'Meat & Seafood') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('bacon', 'Meat & Seafood') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('sausage', 'Meat & Seafood') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('salmon', 'Meat & Seafood') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('shrimp', 'Meat & Seafood') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('coconut shrimp', 'Meat & Seafood') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('tilapia', 'Meat & Seafood') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('cod', 'Meat & Seafood') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('tuna', 'Meat & Seafood') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('steak', 'Meat & Seafood') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('ground pork', 'Meat & Seafood') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('italian sausage', 'Meat & Seafood') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('ham', 'Meat & Seafood') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('turkey', 'Meat & Seafood') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('rotisserie chicken', 'Meat & Seafood') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('deli meat', 'Meat & Seafood') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;

-- Pantry (25 items)
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('rice', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('pasta', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('flour', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('sugar', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('salt', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('black pepper', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('olive oil', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('vegetable oil', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('canola oil', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('bread', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('tortillas', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('oats', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('cereal', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('great grains cereal', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('granola', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('peanut butter', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('jam', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('honey', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('maple syrup', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('crackers', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('chips', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('beans', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('canned beans', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('lentils', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('quinoa', 'Pantry') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;

-- Condiments & Sauces (15 items)
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('ketchup', 'Condiments & Sauces') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('mustard', 'Condiments & Sauces') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('mayonnaise', 'Condiments & Sauces') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('soy sauce', 'Condiments & Sauces') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('hot sauce', 'Condiments & Sauces') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('worcestershire', 'Condiments & Sauces') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('worcestershire sauce', 'Condiments & Sauces') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('bbq sauce', 'Condiments & Sauces') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('salsa', 'Condiments & Sauces') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('salad dressing', 'Condiments & Sauces') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('ranch dressing', 'Condiments & Sauces') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('italian dressing', 'Condiments & Sauces') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('vinegar', 'Condiments & Sauces') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('balsamic vinegar', 'Condiments & Sauces') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('apple cider vinegar', 'Condiments & Sauces') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;

-- Beverages (12 items)
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('water', 'Beverages') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('juice', 'Beverages') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('orange juice', 'Beverages') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('apple juice', 'Beverages') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('coffee', 'Beverages') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('tea', 'Beverages') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('soda', 'Beverages') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('sparkling water', 'Beverages') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('beer', 'Beverages') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('wine', 'Beverages') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('almond milk', 'Beverages') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('coconut milk beverage', 'Beverages') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;

-- Frozen / Refrigerated Food (13 items)
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('frozen pizza', 'Frozen / Refrigerated Food') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('ice cream', 'Frozen / Refrigerated Food') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('dairy free vanilla ice cream', 'Frozen / Refrigerated Food') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('frozen vegetables', 'Frozen / Refrigerated Food') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('frozen fruit', 'Frozen / Refrigerated Food') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('frozen chicken nuggets', 'Frozen / Refrigerated Food') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('frozen fries', 'Frozen / Refrigerated Food') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('frozen waffles', 'Frozen / Refrigerated Food') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('frozen burritos', 'Frozen / Refrigerated Food') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('frozen berries', 'Frozen / Refrigerated Food') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('frozen peas', 'Frozen / Refrigerated Food') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('frozen corn', 'Frozen / Refrigerated Food') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
INSERT INTO category_mappings (item_name_normalized, category) VALUES ('tofu', 'Frozen / Refrigerated Food') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;
