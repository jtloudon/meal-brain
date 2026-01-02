'use server';

import { createClient } from '@/lib/auth/supabase-server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

/**
 * Seeds example recipes and a default grocery list for new users
 */
export async function seedUserData() {
  // Verify user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Use service role client for database operations
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get user's household
  const { data: userData, error: householdError } = await serviceClient
    .from('users')
    .select('household_id')
    .eq('id', user.id)
    .single();

  if (householdError || !userData?.household_id) {
    return { error: 'Could not find user household' };
  }

  const householdId = userData.household_id;

  // Check if example recipes already exist
  const { data: existingRecipes } = await serviceClient
    .from('recipes')
    .select('id')
    .eq('household_id', householdId)
    .ilike('title', 'Example:%');

  // Skip seeding if example recipes already exist
  if (existingRecipes && existingRecipes.length > 0) {
    console.log('[SEED] Example recipes already exist, skipping seed');
    return { success: true };
  }

  // Example recipes to seed
  const exampleRecipes = [
    {
      title: 'Example: Chicken Curry',
      rating: 5,
      tags: ['chicken', 'dairy-free', 'asian'],
      notes: 'Family favorite! Double the sauce.',
      instructions: `1. Heat oil in large pan over medium-high heat
2. Cook diced chicken until browned (5-7 min)
3. Add diced onion and minced garlic, cook until softened (3 min)
4. Stir in curry powder, cook 1 min until fragrant
5. Add coconut milk, bring to simmer
6. Reduce heat and simmer 15-20 min until chicken is cooked through
7. Meanwhile, cook rice according to package directions
8. Serve curry over rice`,
      meal_type: 'dinner',
      serving_size: '5',
      prep_time: '10 mins',
      cook_time: '30 mins',
      image_url: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80',
      ingredients: [
        { ingredient_name: 'chicken breast', quantity: '1.5', unit: 'lb', display_name: 'chicken breast' },
        { ingredient_name: 'rice', quantity: '2', unit: 'cup', display_name: 'rice' },
        { ingredient_name: 'coconut milk', quantity: '1', unit: 'can', display_name: 'coconut milk' },
        { ingredient_name: 'curry powder', quantity: '2', unit: 'tbsp', display_name: 'curry powder' },
        { ingredient_name: 'onion', quantity: '1', unit: 'whole', display_name: 'onion' },
        { ingredient_name: 'garlic', quantity: '3', unit: 'clove', display_name: 'garlic' },
      ],
    },
    {
      title: 'Example: Beef Tacos',
      rating: 4,
      tags: ['beef', 'mexican', 'quick'],
      notes: '20 minute meal',
      instructions: `1. Brown ground beef in skillet over medium-high heat (8-10 min)
2. Drain excess fat
3. Season with taco seasoning and a splash of water
4. Simmer 5 min until thickened
5. Warm taco shells according to package
6. Assemble: shells, beef, lettuce, tomato, cheese`,
      meal_type: 'dinner',
      serving_size: 'Serves 4',
      prep_time: '5 mins',
      cook_time: '15 mins',
      image_url: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&q=80',
      ingredients: [
        { ingredient_name: 'ground beef', quantity: '1', unit: 'lb', display_name: 'ground beef' },
        { ingredient_name: 'taco shells', quantity: '12', unit: 'whole', display_name: 'taco shells' },
        { ingredient_name: 'lettuce', quantity: '1', unit: 'cup', display_name: 'lettuce, shredded' },
        { ingredient_name: 'tomato', quantity: '2', unit: 'whole', display_name: 'tomatoes, diced' },
        { ingredient_name: 'cheddar cheese', quantity: '1', unit: 'cup', display_name: 'cheddar cheese, shredded' },
      ],
    },
    {
      title: 'Example: Black Bean Tacos',
      rating: 4,
      tags: ['vegetarian', 'mexican', 'dairy-free'],
      notes: 'Great for batch cooking',
      instructions: `1. Heat oil in skillet over medium heat
2. Sauté diced onion and sliced bell pepper until softened (5-7 min)
3. Add drained black beans, cumin, and chili powder
4. Cook until heated through (3-5 min)
5. Mash beans slightly with fork for better texture
6. Warm taco shells
7. Assemble: shells, black bean mixture, lettuce
8. Top with salsa or hot sauce if desired`,
      meal_type: 'lunch',
      serving_size: 'Serves 4-6',
      prep_time: '10 mins',
      cook_time: '20 mins',
      image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
      ingredients: [
        { ingredient_name: 'black beans', quantity: '2', unit: 'can', display_name: 'black beans, drained' },
        { ingredient_name: 'onion', quantity: '1', unit: 'whole', display_name: 'onion, diced' },
        { ingredient_name: 'bell pepper', quantity: '1', unit: 'whole', display_name: 'bell pepper, sliced' },
        { ingredient_name: 'taco shells', quantity: '12', unit: 'whole', display_name: 'taco shells' },
        { ingredient_name: 'lettuce', quantity: '1', unit: 'cup', display_name: 'lettuce, shredded' },
        { ingredient_name: 'olive oil', quantity: '1', unit: 'tbsp', display_name: 'olive oil' },
      ],
    },
  ];

  try {
    // Create example recipes
    for (const recipe of exampleRecipes) {
      const { ingredients, ...recipeData } = recipe;

      // Create recipe
      const { data: createdRecipe, error: recipeError } = await serviceClient
        .from('recipes')
        .insert({
          household_id: householdId,
          ...recipeData,
        })
        .select('id')
        .single();

      if (recipeError || !createdRecipe) {
        console.error('Error creating recipe:', recipeError);
        continue;
      }

      // Create ingredients for this recipe
      for (const ingredient of ingredients) {
        // Find or create ingredient in canonical list
        let { data: existingIngredient } = await serviceClient
          .from('ingredients')
          .select('id')
          .eq('canonical_name', ingredient.ingredient_name)
          .single();

        let ingredientId = existingIngredient?.id;

        if (!existingIngredient) {
          const { data: newIngredient } = await serviceClient
            .from('ingredients')
            .insert({ canonical_name: ingredient.ingredient_name })
            .select('id')
            .single();

          ingredientId = newIngredient?.id;
        }

        if (ingredientId) {
          await serviceClient.from('recipe_ingredients').insert({
            recipe_id: createdRecipe.id,
            ingredient_id: ingredientId,
            display_name: ingredient.display_name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
          });
        }
      }
    }

    // Create default grocery list
    await serviceClient.from('grocery_lists').insert({
      household_id: householdId,
      name: 'My First List',
    });

    return { success: true };
  } catch (error) {
    console.error('Error seeding user data:', error);
    return { error: 'Failed to seed user data' };
  }
}
