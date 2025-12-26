/**
 * Quick script to seed test recipes for the current user's household
 * Run with: npx tsx scripts/seed-user-recipes.ts <user-email>
 */

import { createRecipe } from '../lib/tools/recipe';
import { supabase } from '../lib/db/supabase';

const testRecipes = [
  {
    title: 'Chicken Stir Fry',
    rating: 5,
    tags: ['chicken', 'asian', 'quick'],
    notes: 'Great weeknight dinner!',
    ingredients: [
      { name: 'chicken breast', quantity: 1, unit: 'lb' as const, prep_state: 'diced' },
      { name: 'soy sauce', quantity: 3, unit: 'tbsp' as const },
      { name: 'broccoli', quantity: 2, unit: 'cup' as const, prep_state: 'florets' },
      { name: 'rice', quantity: 2, unit: 'cup' as const },
      { name: 'garlic', quantity: 2, unit: 'clove' as const, prep_state: 'minced' },
    ],
  },
  {
    title: 'Veggie Pasta',
    rating: 4,
    tags: ['vegetarian', 'italian', 'pasta'],
    notes: 'Easy and healthy',
    ingredients: [
      { name: 'pasta', quantity: 1, unit: 'lb' as const },
      { name: 'olive oil', quantity: 2, unit: 'tbsp' as const },
      { name: 'tomato', quantity: 3, unit: 'whole' as const, prep_state: 'diced' },
      { name: 'spinach', quantity: 2, unit: 'cup' as const },
      { name: 'garlic', quantity: 3, unit: 'clove' as const, prep_state: 'minced' },
    ],
  },
  {
    title: 'Fish Tacos',
    rating: 5,
    tags: ['fish', 'mexican', 'seafood'],
    notes: 'Friday favorite!',
    ingredients: [
      { name: 'white fish', quantity: 1, unit: 'lb' as const },
      { name: 'corn tortillas', quantity: 8, unit: 'whole' as const },
      { name: 'cabbage', quantity: 2, unit: 'cup' as const, prep_state: 'shredded' },
      { name: 'lime', quantity: 2, unit: 'whole' as const },
      { name: 'cilantro', quantity: 0.25, unit: 'cup' as const, prep_state: 'chopped' },
    ],
  },
];

async function seedRecipes(userEmail: string) {
  console.log(`\n🌱 Seeding recipes for user: ${userEmail}\n`);

  // Get user and household
  const { data: user } = await supabase
    .from('users')
    .select('id, household_id')
    .eq('email', userEmail)
    .single();

  if (!user) {
    console.error(`❌ User not found: ${userEmail}`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.id}`);
  console.log(`✅ Household: ${user.household_id}\n`);

  // Create recipes
  for (const recipe of testRecipes) {
    console.log(`Creating: ${recipe.title}...`);

    const result = await createRecipe(recipe, {
      userId: user.id,
      householdId: user.household_id,
    });

    if (result.success) {
      console.log(`  ✅ Created recipe: ${result.data.recipe_id}`);
    } else {
      console.log(`  ❌ Failed: ${result.error.message}`);
    }
  }

  console.log(`\n✨ Done! Created ${testRecipes.length} recipes.\n`);
}

// Get email from command line args
const userEmail = process.argv[2];

if (!userEmail) {
  console.error('Usage: npx tsx scripts/seed-user-recipes.ts <user-email>');
  process.exit(1);
}

seedRecipes(userEmail).catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
