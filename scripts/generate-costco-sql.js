// Generate SQL to add Costco items
// Run this script, then copy/paste the SQL into Supabase Dashboard

const items = [
  "Muffins",
  "apples x2",
  "Nectarines",
  "Sweet potatoes",
  "Peppers",
  "Bananas",
  "Bagels",
  "Potatoes (golden or mini)",
  "White onion",
  "Whole Carrots",
  "mini Cucumbers (check for slime)",
  "Celery",
  "Cherry tomatoes (on vine)",
  "avocados",
  "Whole mushrooms (if slimy skip)",
  "asparagus (if slimy skip)",
  "Broccoli",
  "fresh green beans",
  "Sweet corn (8 pack)",
  "Lemons",
  "Limes",
  "Salad, if expiry is week+",
  "Cauliflower",
  "Golden kiwi",
  "Cantelope",
  "Watermelon",
  "Grapes (if plump, fresh)",
  "Blueberries (if look fresh)",
  "Strawberries (if look fresh)",
  "Cara Cara oranges",
  "Raspberries",
  "Pineapple",
  "Plums (honey?)",
  "Pears",
  "Hummus",
  "Rotisserie chicken",
  "Tri tip",
  "Flank steak",
  "Chicken breasts ( tenders",
  "Ground Turkey",
  "Chicken sausages (no dairy)",
  "Italian sausage links",
  "Frozen grassfed beef patties",
  "Salmon",
  "Brats (not Italian)",
  "Chicken bites",
  "frozen Shrimp (no tail, raw)",
  "2x Frozen shrimp tail raw",
  "Bitchin sauce",
  "Guacamole cups",
  "Hummus cups",
  "Pickles",
  "Kielbasa",
  "Gyro meat",
  "Tilapia",
  "Frozen plain cod",
  "egg x 2",
  "Almond milk",
  "Feta cheese",
  "Tillamook 3 pk cracker cut chz",
  "Plain green yogurt tub",
  "Sparkling water x2",
  "Olipop/Poppi (send flavor options)",
  "izze pop",
  "Spindrift",
  "Softener salt x2 blue",
  "Paper towels",
  "Traeger pellets",
  "Kleenex",
  "floor Swifters",
  "Toilet paper",
  "Laundry detergent",
  "Kitchen garbage bags",
  "Dishwasher pods",
  "Dave's Killer Bread",
  "Naan flaoconut shrimp",
  "Frzn spring rolls",
  "Frozen meal options?",
  "Frozen pizzas little",
  "Frozen mixed berries",
  "Frozen strawberries (only)",
  "Frozen pineapple",
  "Frozen mango",
  "Prdu chx ngs",
  "Bare breaded chicken breasts",
  "Bare breaded chicken bites",
  "frozen chicken strips",
  "Frozen breakfast sandwiches",
  "Yogurt kefir drinks",
  "Chobani yogurt",
  "Cheese and nut packs",
  "cheese and cracker packs",
  "string Cheese sticks",
  "simply go gurt sticks",
  "Siete almnd flr trtills (by coffee)",
  "Flour tortillas (refrigerated)",
  "Garlic powder",
  "Tomato sauce",
  "Diced tomatoes",
  "Tomato paste",
  "Coconut milk canned",
  "Olive salad",
  "Ketchup",
  "Yellow mustard",
  "avocado oil mayo",
  "honey",
  "BBQ sauce (Kinds)",
  "salsa",
  "Coffee x2",
  "White vinegar",
  "Pasta sauce tter",
  "Dad cereal",
  "triscuits",
  "Chicken bouillon jar",
  "Beef bouillon jar",
  "Olive oil",
  "Avocado oil",
  "Black beans canned",
  "pinto beans canned",
  "chickpeas (garbanzo)",
  "kidney beans canned",
  "Syrup",
  "Tuna (wild planet only)",
  "Rice seeds of change (orange)",
  "Cilantro lime rice pouches",
  "beets (cooked)",
  "Hippeas",
  "Siete chips small bags multi pack",
  "lesser evil snack bags",
  "boulder canyon chips",
  "Honest kids juice boxes",
  "Chocolate milk boxes (for kids)",
  "unreal drk choc coconut mini",
  "brookside drk choc berries",
  "Raw mixed nuts",
  "Belvitas",
  "Archer meat sticks (we have a lot)",
  "Raw unsalted cashews",
  "raw unsalted almonds",
  "Raw unsalted walnuts",
  "Pistachio in shells",
  "Sprouted Pepita seeds",
  "Boom chicka pop kettle corn",
  "Peanut butter pretzel bites",
  "2x Simple mills cinnamon grahams",
  "Simple mills almond crackers",
  "Yazzo frozen yogurt bars",
  "Chia seeds",
  "Tortilla chips",
  "Sandwich thins",
  "Dots pretzels",
  "Crunchmaster crackers",
  "Johnny pops"
];

console.log(`
-- Add ${items.length} items to Costco Master list
-- Run this in Supabase Dashboard SQL Editor

-- Step 1: Find or create the list (run this first and note the list ID)
DO $$
DECLARE
  v_list_id UUID;
  v_household_id UUID;
BEGIN
  -- Get your household ID (replace with your email)
  SELECT household_id INTO v_household_id
  FROM users
  WHERE email = 'jtloudon@me.com';

  -- Find or create Costco Master list
  SELECT id INTO v_list_id
  FROM grocery_lists
  WHERE household_id = v_household_id
    AND name = 'Costco Master';

  IF v_list_id IS NULL THEN
    INSERT INTO grocery_lists (household_id, name)
    VALUES (v_household_id, 'Costco Master')
    RETURNING id INTO v_list_id;
    RAISE NOTICE 'Created new list: %', v_list_id;
  ELSE
    RAISE NOTICE 'Using existing list: %', v_list_id;
  END IF;

  -- Store for next step
  RAISE NOTICE 'List ID: %', v_list_id;
END $$;

-- Step 2: Copy the list ID from above and paste it below, then run this:
-- INSERT INTO grocery_items (grocery_list_id, display_name, quantity, unit, checked)
-- SELECT
--   'PASTE_LIST_ID_HERE'::uuid,
--   item_name,
--   1,
--   'whole',
--   false
-- FROM (VALUES
`);

items.forEach((item, i) => {
  const escaped = item.replace(/'/g, "''");
  const comma = i < items.length - 1 ? ',' : '';
  console.log(`  ('${escaped}')${comma}`);
});

console.log(`) AS t(item_name);

-- Done! ${items.length} items added to Costco Master
`);
