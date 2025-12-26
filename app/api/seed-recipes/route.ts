import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createRecipe } from '@/lib/tools/recipe';

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

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get household_id
    const { data: userRecord } = await supabase
      .from('users')
      .select('household_id')
      .eq('id', user.id)
      .single();

    if (!userRecord?.household_id) {
      return NextResponse.json(
        { error: 'User not associated with household' },
        { status: 400 }
      );
    }

    const results = [];

    for (const recipe of testRecipes) {
      const result = await createRecipe(recipe, {
        userId: user.id,
        householdId: userRecord.household_id,
      });

      results.push({
        title: recipe.title,
        success: result.success,
        recipe_id: result.success ? result.data.recipe_id : null,
        error: !result.success ? result.error.message : null,
      });
    }

    return NextResponse.json({
      message: `Created ${results.filter((r) => r.success).length} of ${testRecipes.length} recipes`,
      results,
    });
  } catch (error) {
    console.error('Seed recipes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
