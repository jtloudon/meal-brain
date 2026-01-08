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
 * Either recipe_id OR custom_title must be provided (not both, not neither).
 */
export const AddMealSchema = z.object({
  recipe_id: z
    .string()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      'Invalid recipe ID format'
    )
    .optional()
    .nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format - must be YYYY-MM-DD'),
  meal_type: z.string(), // Support custom meal types
  serving_size: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  custom_title: z.string().optional().nullable(), // For custom items
  custom_item_type: z.enum(['side', 'leftovers', 'other']).optional().nullable(), // Type of custom item
}).refine(
  (data) => (data.recipe_id && !data.custom_title) || (!data.recipe_id && data.custom_title),
  {
    message: 'Either recipe_id or custom_title must be provided, but not both',
  }
);

export type AddMealInput = z.infer<typeof AddMealSchema>;

/**
 * Zod schema for removing a meal from the planner.
 */
export const RemoveMealSchema = z.object({
  planner_meal_id: z.string().uuid('Invalid planner meal ID format'),
});

export type RemoveMealInput = z.infer<typeof RemoveMealSchema>;

/**
 * Zod schema for updating a planner meal.
 */
export const UpdateMealSchema = z.object({
  planner_meal_id: z.string().uuid('Invalid planner meal ID format'),
  recipe_id: z
    .string()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      'Invalid recipe ID format'
    )
    .optional()
    .nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format - must be YYYY-MM-DD').optional(),
  meal_type: z.string().optional(), // Support custom meal types
  serving_size: z.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
  custom_title: z.string().nullable().optional(), // For custom items
  custom_item_type: z.enum(['side', 'leftovers', 'other']).nullable().optional(), // Type of custom item
});

export type UpdateMealInput = z.infer<typeof UpdateMealSchema>;

/**
 * Zod schema for listing meals in a date range.
 */
export const ListMealsSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format - must be YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format - must be YYYY-MM-DD'),
});

export type ListMealsInput = z.infer<typeof ListMealsSchema>;

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

    // Verify recipe exists and belongs to household (only if recipe_id is provided)
    if (validated.recipe_id) {
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
    }

    // Create planner meal
    const { data: plannerMeal, error: plannerError } = await supabase
      .from('planner_meals')
      .insert({
        household_id: context.householdId,
        recipe_id: validated.recipe_id ?? null,
        date: validated.date,
        meal_type: validated.meal_type,
        serving_size: validated.serving_size ?? null,
        notes: validated.notes ?? null,
        custom_title: validated.custom_title ?? null,
        custom_item_type: validated.custom_item_type ?? null,
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
 * Removes a meal from the planner.
 * Enforces household isolation - only meals from the user's household can be removed.
 *
 * @param input - Meal ID to remove
 * @param context - User and household context for RLS
 * @returns Tool result with success message
 */
export async function removeMeal(
  input: RemoveMealInput,
  context: ToolContext
): Promise<ToolResult<{ message: string }>> {
  try {
    // Validate input
    const validated = RemoveMealSchema.parse(input);

    // Check if meal exists and belongs to household
    const { data: existingMeal, error: fetchError } = await supabase
      .from('planner_meals')
      .select('id, household_id')
      .eq('id', validated.planner_meal_id)
      .single();

    if (fetchError || !existingMeal) {
      return {
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: 'Meal not found',
        },
      };
    }

    // Check permission (household isolation)
    if (existingMeal.household_id !== context.householdId) {
      return {
        success: false,
        error: {
          type: 'AUTHORIZATION_ERROR',
          message: 'You do not have permission to remove this meal',
        },
      };
    }

    // Delete the meal
    const { error: deleteError } = await supabase
      .from('planner_meals')
      .delete()
      .eq('id', validated.planner_meal_id);

    if (deleteError) {
      return {
        success: false,
        error: {
          type: 'DATABASE_ERROR',
          message: deleteError.message,
        },
      };
    }

    return {
      success: true,
      data: {
        message: 'Meal removed successfully',
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
 * Updates a planned meal.
 * Enforces household isolation - only meals from the user's household can be updated.
 *
 * @param input - Meal ID and fields to update
 * @param context - User and household context for RLS
 * @returns Tool result with success message
 */
export async function updateMeal(
  input: UpdateMealInput,
  context: ToolContext
): Promise<ToolResult<{ message: string }>> {
  try {
    // Validate input
    const validated = UpdateMealSchema.parse(input);

    // Check if meal exists and belongs to household
    const { data: existingMeal, error: fetchError } = await supabase
      .from('planner_meals')
      .select('id, household_id, recipe_id')
      .eq('id', validated.planner_meal_id)
      .single();

    if (fetchError || !existingMeal) {
      return {
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: 'Meal not found',
        },
      };
    }

    // Check permission (household isolation)
    if (existingMeal.household_id !== context.householdId) {
      return {
        success: false,
        error: {
          type: 'AUTHORIZATION_ERROR',
          message: 'You do not have permission to update this meal',
        },
      };
    }

    // If recipe_id is being changed, verify new recipe belongs to household
    if (validated.recipe_id && validated.recipe_id !== existingMeal.recipe_id) {
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
    }

    // Build update object (only include fields that were provided)
    const updateData: any = {};
    if (validated.recipe_id !== undefined) updateData.recipe_id = validated.recipe_id;
    if (validated.date !== undefined) updateData.date = validated.date;
    if (validated.meal_type !== undefined) updateData.meal_type = validated.meal_type;
    if (validated.serving_size !== undefined) updateData.serving_size = validated.serving_size;
    if (validated.notes !== undefined) updateData.notes = validated.notes;
    if (validated.custom_title !== undefined) updateData.custom_title = validated.custom_title;
    if (validated.custom_item_type !== undefined) updateData.custom_item_type = validated.custom_item_type;

    // Update the meal
    const { error: updateError } = await supabase
      .from('planner_meals')
      .update(updateData)
      .eq('id', validated.planner_meal_id);

    if (updateError) {
      return {
        success: false,
        error: {
          type: 'DATABASE_ERROR',
          message: updateError.message,
        },
      };
    }

    return {
      success: true,
      data: {
        message: 'Meal updated successfully',
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
 * Lists planned meals for a given date range.
 * Enforces household isolation - only meals from the user's household are returned.
 *
 * @param input - Start and end dates for the range (YYYY-MM-DD)
 * @param context - User and household context for RLS
 * @returns Tool result with meals array and total count
 */
export async function listMeals(
  input: ListMealsInput,
  context: ToolContext
): Promise<
  ToolResult<{
    meals: Array<{
      id: string;
      recipe_id: string | null;
      date: string;
      meal_type: string;
      serving_size: number | null;
      notes: string | null;
      custom_title: string | null;
      custom_item_type: string | null;
      recipe?: {
        title: string;
        tags: string[];
        rating: number | null;
      } | null;
    }>;
    total: number;
  }>
> {
  try {
    // Validate input
    const validated = ListMealsSchema.parse(input);

    // Query meals in date range with recipe info
    const { data: meals, error } = await supabase
      .from('planner_meals')
      .select(
        `
        id,
        recipe_id,
        date,
        meal_type,
        serving_size,
        notes,
        custom_title,
        custom_item_type,
        recipes (
          title,
          tags,
          rating
        )
      `
      )
      .eq('household_id', context.householdId)
      .gte('date', validated.start_date)
      .lte('date', validated.end_date)
      .order('date', { ascending: true })
      .order('meal_type', { ascending: true });

    if (error) {
      return {
        success: false,
        error: {
          type: 'DATABASE_ERROR',
          message: error.message,
        },
      };
    }

    // Transform data to include recipe object
    const formattedMeals = (meals ?? []).map((meal: any) => ({
      id: meal.id,
      recipe_id: meal.recipe_id,
      date: meal.date,
      meal_type: meal.meal_type,
      serving_size: meal.serving_size ?? null,
      notes: meal.notes ?? null,
      custom_title: meal.custom_title ?? null,
      custom_item_type: meal.custom_item_type ?? null,
      recipe: meal.recipes ? {
        title: meal.recipes.title,
        tags: meal.recipes.tags ?? [],
        rating: meal.recipes.rating ?? null,
      } : null,
    }));

    return {
      success: true,
      data: {
        meals: formattedMeals,
        total: formattedMeals.length,
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
  remove_meal: {
    execute: removeMeal,
    schema: RemoveMealSchema,
  },
  update_meal: {
    execute: updateMeal,
    schema: UpdateMealSchema,
  },
  list_meals: {
    execute: listMeals,
    schema: ListMealsSchema,
  },
};
