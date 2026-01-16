/**
 * Script to generate category mappings for the top 150 common grocery items.
 * Run with: npx tsx scripts/generate-category-mappings.ts
 *
 * Output: SQL INSERT statements or JSON for preloading category_mappings table
 */

interface CategoryMapping {
  item_name_normalized: string;
  category: string;
}

// Top 150 common grocery items with their categories
const categoryMappings: CategoryMapping[] = [
  // Produce (50 items)
  { item_name_normalized: 'potatoes', category: 'Produce' },
  { item_name_normalized: 'onions', category: 'Produce' },
  { item_name_normalized: 'tomatoes', category: 'Produce' },
  { item_name_normalized: 'bananas', category: 'Produce' },
  { item_name_normalized: 'apples', category: 'Produce' },
  { item_name_normalized: 'carrots', category: 'Produce' },
  { item_name_normalized: 'lettuce', category: 'Produce' },
  { item_name_normalized: 'cucumber', category: 'Produce' },
  { item_name_normalized: 'bell peppers', category: 'Produce' },
  { item_name_normalized: 'broccoli', category: 'Produce' },
  { item_name_normalized: 'cauliflower', category: 'Produce' },
  { item_name_normalized: 'spinach', category: 'Produce' },
  { item_name_normalized: 'celery', category: 'Produce' },
  { item_name_normalized: 'mushrooms', category: 'Produce' },
  { item_name_normalized: 'sliced mushrooms', category: 'Produce' },
  { item_name_normalized: 'garlic', category: 'Produce' },
  { item_name_normalized: 'ginger', category: 'Produce' },
  { item_name_normalized: 'avocados', category: 'Produce' },
  { item_name_normalized: 'lemon', category: 'Produce' },
  { item_name_normalized: 'limes', category: 'Produce' },
  { item_name_normalized: 'strawberries', category: 'Produce' },
  { item_name_normalized: 'blueberries', category: 'Produce' },
  { item_name_normalized: 'grapes', category: 'Produce' },
  { item_name_normalized: 'oranges', category: 'Produce' },
  { item_name_normalized: 'cilantro', category: 'Produce' },
  { item_name_normalized: 'parsley', category: 'Produce' },
  { item_name_normalized: 'basil', category: 'Produce' },
  { item_name_normalized: 'green beans', category: 'Produce' },
  { item_name_normalized: 'zucchini', category: 'Produce' },
  { item_name_normalized: 'squash', category: 'Produce' },
  { item_name_normalized: 'sweet potatoes', category: 'Produce' },
  { item_name_normalized: 'corn', category: 'Produce' },
  { item_name_normalized: 'cabbage', category: 'Produce' },
  { item_name_normalized: 'coleslaw', category: 'Produce' },
  { item_name_normalized: 'kale', category: 'Produce' },
  { item_name_normalized: 'arugula', category: 'Produce' },
  { item_name_normalized: 'romaine lettuce', category: 'Produce' },
  { item_name_normalized: 'cherry tomatoes', category: 'Produce' },
  { item_name_normalized: 'jalapeños', category: 'Produce' },
  { item_name_normalized: 'green onions', category: 'Produce' },
  { item_name_normalized: 'scallions', category: 'Produce' },
  { item_name_normalized: 'shallots', category: 'Produce' },
  { item_name_normalized: 'radishes', category: 'Produce' },
  { item_name_normalized: 'beets', category: 'Produce' },
  { item_name_normalized: 'asparagus', category: 'Produce' },
  { item_name_normalized: 'brussels sprouts', category: 'Produce' },
  { item_name_normalized: 'eggplant', category: 'Produce' },
  { item_name_normalized: 'power greens', category: 'Produce' },
  { item_name_normalized: 'revol greens romain or spring', category: 'Produce' },
  { item_name_normalized: 'mixed greens', category: 'Produce' },

  // Dairy (15 items)
  { item_name_normalized: 'milk', category: 'Dairy' },
  { item_name_normalized: 'eggs', category: 'Dairy' },
  { item_name_normalized: 'butter', category: 'Dairy' },
  { item_name_normalized: 'cheese', category: 'Dairy' },
  { item_name_normalized: 'cheddar cheese', category: 'Dairy' },
  { item_name_normalized: 'mozzarella cheese', category: 'Dairy' },
  { item_name_normalized: 'parmesan cheese', category: 'Dairy' },
  { item_name_normalized: 'cream cheese', category: 'Dairy' },
  { item_name_normalized: 'sour cream', category: 'Dairy' },
  { item_name_normalized: 'yogurt', category: 'Dairy' },
  { item_name_normalized: 'greek yogurt', category: 'Dairy' },
  { item_name_normalized: 'heavy cream', category: 'Dairy' },
  { item_name_normalized: 'half and half', category: 'Dairy' },
  { item_name_normalized: 'cottage cheese', category: 'Dairy' },
  { item_name_normalized: 'dairy free creamer', category: 'Dairy' },

  // Meat & Seafood (20 items)
  { item_name_normalized: 'chicken breast', category: 'Meat & Seafood' },
  { item_name_normalized: 'chicken thighs', category: 'Meat & Seafood' },
  { item_name_normalized: 'ground beef', category: 'Meat & Seafood' },
  { item_name_normalized: 'ground turkey', category: 'Meat & Seafood' },
  { item_name_normalized: 'pork chops', category: 'Meat & Seafood' },
  { item_name_normalized: 'bacon', category: 'Meat & Seafood' },
  { item_name_normalized: 'sausage', category: 'Meat & Seafood' },
  { item_name_normalized: 'salmon', category: 'Meat & Seafood' },
  { item_name_normalized: 'shrimp', category: 'Meat & Seafood' },
  { item_name_normalized: 'coconut shrimp', category: 'Meat & Seafood' },
  { item_name_normalized: 'tilapia', category: 'Meat & Seafood' },
  { item_name_normalized: 'cod', category: 'Meat & Seafood' },
  { item_name_normalized: 'tuna', category: 'Meat & Seafood' },
  { item_name_normalized: 'steak', category: 'Meat & Seafood' },
  { item_name_normalized: 'ground pork', category: 'Meat & Seafood' },
  { item_name_normalized: 'italian sausage', category: 'Meat & Seafood' },
  { item_name_normalized: 'ham', category: 'Meat & Seafood' },
  { item_name_normalized: 'turkey', category: 'Meat & Seafood' },
  { item_name_normalized: 'rotisserie chicken', category: 'Meat & Seafood' },
  { item_name_normalized: 'deli meat', category: 'Meat & Seafood' },

  // Pantry (25 items)
  { item_name_normalized: 'rice', category: 'Pantry' },
  { item_name_normalized: 'pasta', category: 'Pantry' },
  { item_name_normalized: 'flour', category: 'Pantry' },
  { item_name_normalized: 'sugar', category: 'Pantry' },
  { item_name_normalized: 'salt', category: 'Pantry' },
  { item_name_normalized: 'black pepper', category: 'Pantry' },
  { item_name_normalized: 'olive oil', category: 'Pantry' },
  { item_name_normalized: 'vegetable oil', category: 'Pantry' },
  { item_name_normalized: 'canola oil', category: 'Pantry' },
  { item_name_normalized: 'bread', category: 'Pantry' },
  { item_name_normalized: 'tortillas', category: 'Pantry' },
  { item_name_normalized: 'oats', category: 'Pantry' },
  { item_name_normalized: 'cereal', category: 'Pantry' },
  { item_name_normalized: 'great grains cereal', category: 'Pantry' },
  { item_name_normalized: 'granola', category: 'Pantry' },
  { item_name_normalized: 'peanut butter', category: 'Pantry' },
  { item_name_normalized: 'jam', category: 'Pantry' },
  { item_name_normalized: 'honey', category: 'Pantry' },
  { item_name_normalized: 'maple syrup', category: 'Pantry' },
  { item_name_normalized: 'crackers', category: 'Pantry' },
  { item_name_normalized: 'chips', category: 'Pantry' },
  { item_name_normalized: 'beans', category: 'Pantry' },
  { item_name_normalized: 'canned beans', category: 'Pantry' },
  { item_name_normalized: 'lentils', category: 'Pantry' },
  { item_name_normalized: 'quinoa', category: 'Pantry' },

  // Condiments & Sauces (15 items)
  { item_name_normalized: 'ketchup', category: 'Condiments & Sauces' },
  { item_name_normalized: 'mustard', category: 'Condiments & Sauces' },
  { item_name_normalized: 'mayonnaise', category: 'Condiments & Sauces' },
  { item_name_normalized: 'soy sauce', category: 'Condiments & Sauces' },
  { item_name_normalized: 'hot sauce', category: 'Condiments & Sauces' },
  { item_name_normalized: 'worcestershire', category: 'Condiments & Sauces' },
  { item_name_normalized: 'worcestershire sauce', category: 'Condiments & Sauces' },
  { item_name_normalized: 'bbq sauce', category: 'Condiments & Sauces' },
  { item_name_normalized: 'salsa', category: 'Condiments & Sauces' },
  { item_name_normalized: 'salad dressing', category: 'Condiments & Sauces' },
  { item_name_normalized: 'ranch dressing', category: 'Condiments & Sauces' },
  { item_name_normalized: 'italian dressing', category: 'Condiments & Sauces' },
  { item_name_normalized: 'vinegar', category: 'Condiments & Sauces' },
  { item_name_normalized: 'balsamic vinegar', category: 'Condiments & Sauces' },
  { item_name_normalized: 'apple cider vinegar', category: 'Condiments & Sauces' },

  // Beverages (12 items)
  { item_name_normalized: 'water', category: 'Beverages' },
  { item_name_normalized: 'juice', category: 'Beverages' },
  { item_name_normalized: 'orange juice', category: 'Beverages' },
  { item_name_normalized: 'apple juice', category: 'Beverages' },
  { item_name_normalized: 'coffee', category: 'Beverages' },
  { item_name_normalized: 'tea', category: 'Beverages' },
  { item_name_normalized: 'soda', category: 'Beverages' },
  { item_name_normalized: 'sparkling water', category: 'Beverages' },
  { item_name_normalized: 'beer', category: 'Beverages' },
  { item_name_normalized: 'wine', category: 'Beverages' },
  { item_name_normalized: 'almond milk', category: 'Beverages' },
  { item_name_normalized: 'coconut milk beverage', category: 'Beverages' },

  // Frozen / Refrigerated Food (13 items)
  { item_name_normalized: 'frozen pizza', category: 'Frozen / Refrigerated Food' },
  { item_name_normalized: 'ice cream', category: 'Frozen / Refrigerated Food' },
  { item_name_normalized: 'dairy free vanilla ice cream', category: 'Frozen / Refrigerated Food' },
  { item_name_normalized: 'frozen vegetables', category: 'Frozen / Refrigerated Food' },
  { item_name_normalized: 'frozen fruit', category: 'Frozen / Refrigerated Food' },
  { item_name_normalized: 'frozen chicken nuggets', category: 'Frozen / Refrigerated Food' },
  { item_name_normalized: 'frozen fries', category: 'Frozen / Refrigerated Food' },
  { item_name_normalized: 'frozen waffles', category: 'Frozen / Refrigerated Food' },
  { item_name_normalized: 'frozen burritos', category: 'Frozen / Refrigerated Food' },
  { item_name_normalized: 'frozen berries', category: 'Frozen / Refrigerated Food' },
  { item_name_normalized: 'frozen peas', category: 'Frozen / Refrigerated Food' },
  { item_name_normalized: 'frozen corn', category: 'Frozen / Refrigerated Food' },
  { item_name_normalized: 'tofu', category: 'Frozen / Refrigerated Food' },
];

// Generate SQL INSERT statements
function generateSQL(): string {
  const statements = categoryMappings.map(mapping => {
    return `INSERT INTO category_mappings (item_name_normalized, category) VALUES ('${mapping.item_name_normalized}', '${mapping.category}') ON CONFLICT (item_name_normalized) DO UPDATE SET category = EXCLUDED.category;`;
  });

  return statements.join('\n');
}

// Generate JSON output
function generateJSON(): string {
  return JSON.stringify(categoryMappings, null, 2);
}

// Main execution
console.log('=== Category Mappings for Top 150 Grocery Items ===\n');
console.log(`Total mappings: ${categoryMappings.length}\n`);

console.log('=== SQL INSERT Statements ===\n');
console.log(generateSQL());
console.log('\n');

console.log('=== JSON Format ===\n');
console.log(generateJSON());

// Category breakdown
const categoryCount = categoryMappings.reduce((acc, mapping) => {
  acc[mapping.category] = (acc[mapping.category] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

console.log('\n=== Category Breakdown ===');
Object.entries(categoryCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(([category, count]) => {
    console.log(`${category}: ${count} items`);
  });
