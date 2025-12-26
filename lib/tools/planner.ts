import { z } from 'zod';
import { supabase } from '@/lib/db/supabase';

/**
 * Tool context for authenticated operations.
 */
export interface ToolContext {
  userId: string;
  householdId: string;
}

/**
 * Tool result types.
 */
export type ToolResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: {
        type: 'VALIDATION_ERROR' | 'DATABASE_ERROR' | 'AUTHORIZATION_ERROR' | 'NOT_FOUND';
        field?: string;
        message: string;
      };
    };

/**
 * Zod schema for adding a meal to the planner.
 */
export const AddMealSchema = z.object({
  recipe_id: z
    .string()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      'Invalid recipe ID format'
    ),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format - must be YYYY-MM-DD'),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner']),
});

export type AddMealInput = z.infer<typeof AddMealSchema>;

/**
 * Adds a recipe to the meal planner on a specific date.
 * Enforces household isolation - only recipes from the user's household can be added.
 *
 * @param input - Meal data validated against AddMealSchema
 * @param context - User and household context for RLS
 * @returns Tool result with planner_meal_id on success
 */
export async function addMeal(
  input: AddMealInput,
  context: ToolContext
): Promise<ToolResult<{ planner_meal_id: string }>> {
  try {
    // Validate input
    const validated = AddMealSchema.parse(input);

    // Verify recipe exists and belongs to household
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('id')
      .eq('id', validated.recipe_id)
      .eq('household_id', context.householdId)
      .single();

    if (recipeError || !recipe) {
      return {
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: 'Recipe not found or does not belong to your household',
        },
      };
    }

    // Create planner meal
    const { data: plannerMeal, error: plannerError } = await supabase
      .from('planner_meals')
      .insert({
        household_id: context.householdId,
        recipe_id: validated.recipe_id,
        date: validated.date,
        meal_type: validated.meal_type,
      })
      .select('id')
      .single();

    if (plannerError || !plannerMeal) {
      return {
        success: false,
        error: {
          type: 'DATABASE_ERROR',
          message: plannerError?.message ?? 'Failed to add meal to planner',
        },
      };
    }

    return {
      success: true,
      data: {
        planner_meal_id: plannerMeal.id,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          field: firstError.path.join('.'),
          message: firstError.message,
        },
      };
    }

    // Log error for debugging
    console.error('Tool error:', error);

    return {
      success: false,
      error: {
        type: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Planner tools namespace (for future expansion).
 */
export const planner = {
  add_meal: {
    execute: addMeal,
    schema: AddMealSchema,
  },
};
