import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { createRecipe } from '@/lib/tools/recipe';
import { addMeal } from '@/lib/tools/planner';
import { pushIngredients } from '@/lib/tools/grocery';
import { supabase } from '@/lib/db/supabase';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get household_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('household_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.household_id) {
      return NextResponse.json(
        { error: 'User not associated with household' },
        { status: 400 }
      );
    }

    const householdId = userData.household_id;

    // Parse request body
    const { approval_id, approved, tool_name, tool_input } = await request.json();

    if (!approved) {
      return NextResponse.json({
        success: true,
        message: "Okay, I won't do that.",
      });
    }

    if (!tool_name || !tool_input) {
      return NextResponse.json(
        { error: 'Missing tool_name or tool_input' },
        { status: 400 }
      );
    }

    // Execute the approved tool
    const context = { householdId, userId: user.id };

    switch (tool_name) {
      case 'recipe_create': {
        // Add source attribution for AI-created recipes
        // Remove rating - AI shouldn't rate recipes it hasn't tasted
        const recipeInput = {
          ...tool_input,
          source: tool_input.source || 'Claude AI',
          rating: null, // AI-created recipes start unrated
        };

        const result = await createRecipe(recipeInput, context);

        if (!result.success) {
          return NextResponse.json(
            { error: result.error?.message || 'Failed to create recipe' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `Created "${tool_input.title}"! 🎉 You can find it in your recipes.`,
          data: result.data,
        });
      }

      case 'planner_add_meal': {
        console.log('[Approval API] Adding meal:', tool_input, 'context:', context);
        const result = await addMeal(tool_input, context);
        console.log('[Approval API] Add meal result:', result);

        if (!result.success) {
          console.error('[Approval API] Failed to add meal:', result.error);

          // Provide more helpful error message if recipe not found
          let errorMessage = result.error?.message || 'Failed to add meal to planner';
          if (result.error?.type === 'NOT_FOUND') {
            errorMessage = `I couldn't find that recipe in your collection. Please list your recipes first using recipe_list, then use the exact recipe_id from those results.`;
          }

          return NextResponse.json(
            { error: errorMessage },
            { status: result.error?.type === 'NOT_FOUND' ? 404 : 500 }
          );
        }

        // Get recipe name for confirmation message using authenticated client
        const { data: recipe } = await supabase
          .from('recipes')
          .select('title')
          .eq('id', tool_input.recipe_id)
          .eq('household_id', householdId)
          .maybeSingle();

        const mealTypeLabel = tool_input.meal_type.charAt(0).toUpperCase() + tool_input.meal_type.slice(1);
        const recipeName = recipe?.title || 'the recipe';

        return NextResponse.json({
          success: true,
          message: `Added ${recipeName} to ${mealTypeLabel} on ${tool_input.date}! 📅`,
          data: result.data,
        });
      }

      case 'grocery_push_ingredients': {
        // Get recipe ingredients using authenticated client
        const { data: recipe } = await supabase
          .from('recipes')
          .select(`
            id,
            title,
            recipe_ingredients (
              ingredient_id,
              display_name,
              quantity_min,
              quantity_max,
              unit,
              prep_state
            )
          `)
          .eq('id', tool_input.recipe_id)
          .eq('household_id', householdId)
          .maybeSingle();

        if (!recipe) {
          return NextResponse.json(
            { error: 'Recipe not found' },
            { status: 404 }
          );
        }

        const result = await pushIngredients(
          {
            grocery_list_id: tool_input.grocery_list_id,
            ingredients: recipe.recipe_ingredients.map((ing: any) => ({
              ingredient_id: ing.ingredient_id,
              display_name: ing.display_name,
              quantity_min: ing.quantity_min,
              quantity_max: ing.quantity_max,
              unit: ing.unit,
              prep_state: ing.prep_state,
              source_recipe_id: recipe.id,
            })),
          },
          context
        );

        if (!result.success) {
          return NextResponse.json(
            { error: result.error?.message || 'Failed to push ingredients' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `Added ${recipe.recipe_ingredients.length} ingredients from ${recipe.title} to your grocery list! 🛒`,
          data: result.data,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown tool: ${tool_name}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Approval API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
