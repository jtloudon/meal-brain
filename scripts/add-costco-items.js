/**
 * Script to add grocery items to the "Costco Master" list
 * Run with: node scripts/add-costco-items.js <user-email>
 *
 * Prerequisites:
 * 1. Set environment variables:
 *    - NEXT_PUBLIC_SUPABASE_URL (production URL)
 *    - NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY
 * 2. Ensure "Costco Master" grocery list exists for the user's household
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Cleaned grocery items (emojis, checkboxes, and extra spaces removed)
const ITEMS = [
  'Muffins',
  'apples x2',
  'Nectarines',
  'Sweet potatoes',
  'Peppers',
  'Bananas',
  'Bagels',
  'Potatoes (golden or mini)',
  'White onion',
  'Whole Carrots',
  'mini Cucumbers (check for slime)',
  'Celery',
  'Cherry tomatoes (on vine)',
  'avocados',
  'Whole mushrooms (if slimy skip)',
  'asparagus (if slimy skip)',
  'Broccoli',
  'fresh green beans',
  'Sweet corn (8 pack)',
  'Lemons',
  'Limes',
  'Salad, if expiry is week+',
  'Cauliflower',
  'Golden kiwi',
  'Cantelope',
  'Watermelon',
  'Grapes (if plump, fresh)',
  'Blueberries (if look fresh)',
  'Strawberries (if look fresh)',
  'Cara Cara oranges',
  'Raspberries',
  'Pineapple',
  'Plums (honey?)',
  'Pears',
  'Hummus',
  'Rotisserie chicken',
  'Tri tip',
  'Flank steak',
  'Chicken breasts ( tenders',
  'Ground Turkey',
  'Chicken sausages (no dairy)',
  'Italian sausage links',
  'Frozen grassfed beef patties',
  'Salmon',
  'Brats (not Italian)',
  'Chicken bites',
  'frozen Shrimp (no tail, raw)',
  '2x Frozen shrimp tail raw',
  'Bitchin sauce',
  'Guacamole cups',
  'Hummus cups',
  'Pickles',
  'Kielbasa',
  'Gyro meat',
  'Tilapia',
  'Frozen plain cod',
  'egg x 2',
  'Almond milk',
  'Feta cheese',
  'Tillamook 3 pk cracker cut chz',
  'Plain green yogurt tub',
  'Sparkling water x2',
  'Olipop/Poppi (send flavor options)',
  'izze pop',
  'Spindrift',
  'Softener salt x2 blue',
  'Paper towels',
  'Traeger pellets',
  'Kleenex',
  'floor Swifters',
  'Toilet paper',
  'Laundry detergent',
  'Kitchen garbage bags',
  'Dishwasher pods',
  'Dave\'s Killer Bread',
  'Naan flaoconut shrimp',
  'Frzn spring rolls',
  'Frozen meal options?',
  'Frozen pizzas little',
  'Frozen mixed berries',
  'Frozen strawberries (only)',
  'Frozen pineapple',
  'Frozen mango',
  'Prdu chx ngs',
  'Bare breaded chicken breasts',
  'Bare breaded chicken bites',
  'frozen chicken strips',
  'Frozen breakfast sandwiches',
  'Yogurt kefir drinks',
  'Chobani yogurt',
  'Cheese and nut packs',
  'cheese and cracker packs',
  'string Cheese sticks',
  'simply go gurt sticks',
  'Siete almnd flr trtills (by coffee)',
  'Flour tortillas (refrigerated)',
  'Garlic powder',
  'Tomato sauce',
  'Diced tomatoes',
  'Tomato paste',
  'Coconut milk canned',
  'Olive salad',
  'Ketchup',
  'Yellow mustard',
  'avocado oil mayo',
  'honey',
  'BBQ sauce (Kinds)',
  'salsa',
  'Coffee x2',
  'White vinegar',
  'Pasta sauce tter',
  'Dad cereal',
  'triscuits',
  'Chicken bouillon jar',
  'Beef bouillon jar',
  'Olive oil',
  'Avocado oil',
  'Black beans canned',
  'pinto beans canned',
  'chickpeas (garbanzo)',
  'kidney beans canned',
  'Syrup',
  'Tuna (wild planet only)',
  'Rice seeds of change (orange)',
  'Cilantro lime rice pouches',
  'beets (cooked)',
  'Hippeas',
  'Siete chips small bags multi pack',
  'lesser evil snack bags',
  'boulder canyon chips',
  'Honest kids juice boxes',
  'Chocolate milk boxes (for kids)',
  'unreal drk choc coconut mini',
  'brookside drk choc berries',
  'Raw mixed nuts',
  'Belvitas',
  'Archer meat sticks (we have a lot)',
  'Raw unsalted cashews',
  'raw unsalted almonds',
  'Raw unsalted walnuts',
  'Pistachio in shells',
  'Sprouted Pepita seeds',
  'Boom chicka pop kettle corn',
  'Peanut butter pretzel bites',
  '2x Simple mills cinnamon grahams',
  'Simple mills almond crackers',
  'Yazzo frozen yogurt bars',
  'Chia seeds',
  'Tortilla chips',
  'Sandwich thins',
  'Dots pretzels',
  'Crunchmaster crackers',
  'Johnny pops'
];

// Helper: Smart unit inference based on item name
function inferUnit(itemName) {
  const lower = itemName.toLowerCase();

  // Count indicators (numbers followed by units or packs)
  if (/\bx\s*\d+|\d+\s*x\b|\d+\s*pk|package|pack|bag|box|can|jar|bottle/.test(lower)) {
    return 'package';
  }

  // Produce (typically whole)
  if (/apple|orange|lemon|lime|pear|onion|pepper|potato|tomato|cucumber|cantelope|watermelon|pineapple|avocado/.test(lower)) {
    return 'whole';
  }

  // Leafy greens/bunches
  if (/celery|lettuce|salad|spinach|kale|herb|cilantro|parsley|broccoli|cauliflower|carrot/.test(lower)) {
    return 'bunch';
  }

  // Berries and small fruits
  if (/berries|grape|kiwi|plum|strawberr/.test(lower)) {
    return 'package';
  }

  // Meat/protein
  if (/chicken|turkey|beef|salmon|fish|meat|sausage|steak|tilapia|cod|shrimp|brats/.test(lower)) {
    return 'lb';
  }

  // Dairy
  if (/milk|yogurt|cheese|feta/.test(lower)) {
    return 'package';
  }

  // Liquids in containers
  if (/sauce|salsa|oil|vinegar|ketchup|mustard|mayo|hummus|guacamole/.test(lower)) {
    return 'jar';
  }

  // Dry goods/pantry
  if (/flour|sugar|salt|rice|pasta|cereal|oat|bean|seed|nut|chip/.test(lower)) {
    return 'bag';
  }

  // Spices
  if (/spice|powder|bouillon/.test(lower)) {
    return 'jar';
  }

  // Frozen items
  if (/frozen/.test(lower)) {
    return 'package';
  }

  // Household items
  if (/towel|toilet|paper|kleenex|swiffer|bag|pod|detergent|pellet/.test(lower)) {
    return 'package';
  }

  // Beverages
  if (/water|pop|juice|coffee/.test(lower)) {
    return 'package';
  }

  // Default to whole for items
  return 'whole';
}

// Helper: Extract quantity from item name
function extractQuantity(itemName) {
  // Look for patterns like "x2", "2x", "x 2"
  const match = itemName.match(/\b(\d+)\s*x\b|x\s*(\d+)\b/i);
  if (match) {
    return parseInt(match[1] || match[2]);
  }
  // Default to 1
  return 1;
}

async function addCostcoItems(userEmail) {
  console.log('\n🛒 Adding items to Costco Master list\n');

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get user and household
  console.log(`🔍 Looking up user: ${userEmail}`);
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, household_id')
    .eq('email', userEmail)
    .single();

  if (userError || !user) {
    console.error(`❌ User not found: ${userEmail}`);
    console.error(userError?.message);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.id}`);
  console.log(`✅ Household: ${user.household_id}\n`);

  // Find or create "Costco Master" list
  console.log('🔍 Looking for "Costco Master" list...');
  let { data: list, error: listError } = await supabase
    .from('grocery_lists')
    .select('id, name')
    .eq('household_id', user.household_id)
    .eq('name', 'Costco Master')
    .single();

  if (listError && listError.code !== 'PGRST116') {
    console.error('❌ Error finding list:', listError.message);
    process.exit(1);
  }

  // Create list if it doesn't exist
  if (!list) {
    console.log('📝 Creating "Costco Master" list...');
    const { data: newList, error: createError } = await supabase
      .from('grocery_lists')
      .insert({
        household_id: user.household_id,
        name: 'Costco Master'
      })
      .select('id, name')
      .single();

    if (createError) {
      console.error('❌ Error creating list:', createError.message);
      process.exit(1);
    }

    list = newList;
    console.log(`✅ Created list: ${list.id}\n`);
  } else {
    console.log(`✅ Found list: ${list.id}\n`);
  }

  // Import categorization function
  console.log('📦 Adding items...\n');

  let successCount = 0;
  let errorCount = 0;

  // Add items with progress indication
  for (let i = 0; i < ITEMS.length; i++) {
    const itemName = ITEMS[i];
    const quantity = extractQuantity(itemName);
    const unit = inferUnit(itemName);

    process.stdout.write(`[${i + 1}/${ITEMS.length}] ${itemName}...`);

    try {
      // Simple categorization (could be improved)
      let category = 'Other';
      const lower = itemName.toLowerCase();
      if (/fruit|apple|orange|lemon|lime|berry|grape|kiwi|melon|pineapple|plum|pear/.test(lower)) category = 'Produce';
      else if (/vegetable|potato|onion|pepper|carrot|cucumber|celery|tomato|mushroom|asparagus|broccoli|bean|corn|salad|cauliflower/.test(lower)) category = 'Produce';
      else if (/chicken|turkey|beef|pork|meat|salmon|fish|sausage|steak|tilapia|cod|shrimp|brats|kielbasa|gyro/.test(lower)) category = 'Meat & Seafood';
      else if (/milk|yogurt|cheese|egg|feta/.test(lower)) category = 'Dairy & Eggs';
      else if (/frozen/.test(lower)) category = 'Frozen';
      else if (/bread|bagel|tortilla|naan/.test(lower)) category = 'Bakery';
      else if (/sauce|salsa|oil|vinegar|ketchup|mustard|mayo|hummus|guacamole|pickle/.test(lower)) category = 'Condiments';
      else if (/chip|pretzel|nut|cracker|popcorn/.test(lower)) category = 'Snacks';
      else if (/rice|pasta|bean|cereal/.test(lower)) category = 'Pantry';
      else if (/spice|powder|bouillon/.test(lower)) category = 'Spices';
      else if (/coffee|water|pop|juice|soda|drink/.test(lower)) category = 'Beverages';
      else if (/towel|toilet|paper|kleenex|swiffer|bag|pod|detergent|pellet|salt/.test(lower)) category = 'Household';

      const { error: insertError } = await supabase
        .from('grocery_items')
        .insert({
          grocery_list_id: list.id,
          display_name: itemName,
          quantity: quantity,
          unit: unit,
          category: category,
          checked: false
        });

      if (insertError) {
        process.stdout.write(` ❌\n`);
        console.error(`   Error: ${insertError.message}`);
        errorCount++;
      } else {
        process.stdout.write(` ✅\n`);
        successCount++;
      }
    } catch (error) {
      process.stdout.write(` ❌\n`);
      console.error(`   Error: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n✨ Done!`);
  console.log(`   ✅ Successfully added: ${successCount} items`);
  if (errorCount > 0) {
    console.log(`   ❌ Failed: ${errorCount} items`);
  }
  console.log();
}

// Get email from command line args
const userEmail = process.argv[2];

if (!userEmail) {
  console.error('Usage: node scripts/add-costco-items.js <user-email>');
  console.error('Example: node scripts/add-costco-items.js jesse@example.com');
  process.exit(1);
}

addCostcoItems(userEmail).catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
