/**
 * Auto-categorizes ingredients based on keywords
 */

// Default categories - same as in shopping list settings
export const DEFAULT_CATEGORIES = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Bakery',
  'Frozen',
  'Canned Goods',
  'Condiments & Sauces',
  'Beverages',
  'Snacks & Treats',
  'Pantry',
  'Household',
  'Other',
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Produce': [
    'onion', 'garlic', 'tomato', 'potato', 'carrot', 'celery', 'lettuce', 'spinach',
    'kale', 'cabbage', 'broccoli', 'cauliflower', 'pepper', 'bell pepper', 'jalapeño',
    'cucumber', 'zucchini', 'squash', 'eggplant', 'mushroom', 'avocado',
    'apple', 'banana', 'orange', 'lemon', 'lime', 'berry', 'strawberry', 'blueberry',
    'grape', 'melon', 'peach', 'pear', 'mango', 'pineapple', 'cilantro', 'parsley',
    'basil', 'thyme', 'rosemary', 'mint', 'dill', 'oregano', 'sage', 'arugula',
  ],
  'Meat & Seafood': [
    'chicken', 'beef', 'pork', 'turkey', 'lamb', 'steak', 'ground beef', 'ground turkey',
    'bacon', 'sausage', 'ham', 'fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster',
    'scallop', 'cod', 'tilapia', 'mahi', 'halibut', 'swordfish', 'anchovy',
  ],
  'Dairy & Eggs': [
    'milk', 'cheese', 'cheddar', 'mozzarella', 'parmesan', 'feta', 'goat cheese',
    'cream cheese', 'cottage cheese', 'ricotta', 'butter', 'margarine', 'yogurt',
    'sour cream', 'heavy cream', 'whipping cream', 'half and half', 'egg', 'eggs',
    'cream', 'ice cream', 'frozen yogurt',
  ],
  'Bakery': [
    'bread', 'bun', 'roll', 'bagel', 'english muffin', 'tortilla', 'pita', 'naan',
    'croissant', 'baguette', 'sourdough', 'wheat bread', 'white bread', 'rye',
    'ciabatta', 'focaccia', 'flatbread',
  ],
  'Frozen': [
    'frozen', 'ice', 'popsicle', 'frozen dinner', 'frozen pizza', 'frozen vegetable',
    'frozen fruit', 'frozen waffle', 'frozen fries',
  ],
  'Canned Goods': [
    'canned', 'can', 'black beans', 'kidney beans', 'chickpeas', 'refried beans',
    'corn', 'green beans', 'tomato sauce', 'tomato paste', 'diced tomatoes',
    'crushed tomatoes', 'coconut milk', 'evaporated milk', 'condensed milk',
    'broth', 'stock', 'soup', 'tuna can', 'salmon can', 'olives',
  ],
  'Condiments & Sauces': [
    'ketchup', 'mustard', 'mayonnaise', 'mayo', 'relish', 'hot sauce', 'sriracha',
    'soy sauce', 'worcestershire', 'bbq sauce', 'barbecue', 'teriyaki', 'salsa',
    'pico de gallo', 'guacamole', 'hummus', 'ranch', 'vinegar', 'balsamic',
    'oil', 'olive oil', 'vegetable oil', 'canola oil', 'sesame oil', 'coconut oil',
    'salad dressing', 'vinaigrette', 'chili sauce', 'fish sauce', 'oyster sauce',
  ],
  'Beverages': [
    'water', 'soda', 'juice', 'coffee', 'tea', 'beer', 'wine', 'liquor', 'vodka',
    'rum', 'whiskey', 'gin', 'tequila', 'seltzer', 'sparkling water', 'lemonade',
    'sports drink', 'energy drink', 'kombucha', 'almond milk', 'oat milk', 'soy milk',
  ],
  'Snacks & Treats': [
    'chips', 'crackers', 'pretzels', 'popcorn', 'nuts', 'almonds', 'peanuts', 'cashews',
    'trail mix', 'granola bar', 'protein bar', 'candy', 'chocolate', 'cookies',
    'cake', 'brownies', 'donuts', 'muffin', 'pie', 'pudding', 'jello', 'gummies',
  ],
  'Pantry': [
    'rice', 'pasta', 'noodle', 'spaghetti', 'macaroni', 'penne', 'quinoa', 'couscous',
    'flour', 'all-purpose flour', 'wheat flour', 'almond flour', 'coconut flour',
    'sugar', 'brown sugar', 'powdered sugar', 'honey', 'maple syrup', 'agave',
    'salt', 'pepper', 'spice', 'cinnamon', 'paprika', 'cumin', 'chili powder',
    'garlic powder', 'onion powder', 'cayenne', 'turmeric', 'ginger', 'nutmeg',
    'vanilla', 'extract', 'baking soda', 'baking powder', 'yeast', 'cornstarch',
    'breadcrumbs', 'panko', 'oats', 'cereal', 'granola', 'peanut butter', 'jam',
    'jelly', 'preserves', 'nutella', 'tahini', 'taco shells',
  ],
  'Household': [
    'paper towel', 'toilet paper', 'tissue', 'kleenex', 'napkin', 'plate', 'cup',
    'fork', 'spoon', 'knife', 'foil', 'aluminum foil', 'plastic wrap', 'wax paper',
    'parchment paper', 'ziploc', 'trash bag', 'garbage bag', 'sponge', 'dish soap',
    'detergent', 'laundry', 'bleach', 'cleaner', 'disinfectant', 'soap', 'shampoo',
    'conditioner', 'toothpaste', 'toothbrush', 'deodorant', 'razor', 'shaving cream',
  ],
};

/**
 * Categorizes an ingredient based on its name
 */
export function categorizeIngredient(ingredientName: string): string {
  const normalized = ingredientName.toLowerCase().trim();

  // Check each category's keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword) || keyword.includes(normalized)) {
        return category;
      }
    }
  }

  // Default to "Other" if no match
  return 'Other';
}

/**
 * Updates an ingredient's category in the database
 */
export async function updateIngredientCategory(
  ingredientId: string,
  category: string
): Promise<boolean> {
  try {
    const { supabase } = await import('@/lib/db/supabase');
    const { error } = await supabase
      .from('ingredients')
      .update({ category })
      .eq('id', ingredientId);

    return !error;
  } catch (error) {
    console.error('Error updating ingredient category:', error);
    return false;
  }
}

/**
 * Auto-categorizes all ingredients that are currently "Other"
 */
export async function autoCategorizeIngredients(): Promise<number> {
  try {
    const { supabase } = await import('@/lib/db/supabase');

    // Fetch all ingredients with category "Other"
    const { data: ingredients, error } = await supabase
      .from('ingredients')
      .select('id, canonical_name, category')
      .eq('category', 'Other');

    if (error || !ingredients) {
      console.error('Error fetching ingredients:', error);
      return 0;
    }

    let updated = 0;

    // Categorize and update each ingredient
    for (const ingredient of ingredients) {
      const newCategory = categorizeIngredient(ingredient.canonical_name);

      if (newCategory !== 'Other') {
        const success = await updateIngredientCategory(ingredient.id, newCategory);
        if (success) updated++;
      }
    }

    return updated;
  } catch (error) {
    console.error('Error auto-categorizing ingredients:', error);
    return 0;
  }
}
