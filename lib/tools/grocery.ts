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
 * Zod schema for pushing ingredients to a grocery list.
 */
export const PushIngredientsSchema = z.object({
  grocery_list_id: z
    .string()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      'Invalid grocery list ID format'
    ),
  ingredients: z
    .array(
      z.object({
        ingredient_id: z.string(),
        display_name: z.string().min(1, 'Display name is required'),
        quantity: z.number().positive('Quantity must be positive'),
        unit: z.string().min(1, 'Unit is required'),
        prep_state: z.string().optional(),
        source_recipe_id: z.string().optional(),
      })
    )
    .min(1, 'At least one ingredient is required'),
});

export type PushIngredientsInput = z.infer<typeof PushIngredientsSchema>;

/**
 * Pushes ingredients to a grocery list with deterministic merging.
 * Ingredients with the same ingredient_id and unit are merged (quantities added).
 * Ingredients with different units are kept separate.
 *
 * @param input - Grocery list ID and ingredients to push
 * @param context - User and household context for RLS
 * @returns Tool result with items_added and items_merged counts
 */
export async function pushIngredients(
  input: PushIngredientsInput,
  context: ToolContext
): Promise<ToolResult<{ items_added: number; items_merged: number }>> {
  try {
    // Validate input
    const validated = PushIngredientsSchema.parse(input);

    // Verify grocery list exists and belongs to household
    const { data: groceryList, error: listError } = await supabase
      .from('grocery_lists')
      .select('id')
      .eq('id', validated.grocery_list_id)
      .eq('household_id', context.householdId)
      .single();

    if (listError || !groceryList) {
      return {
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: 'Grocery list not found or does not belong to your household',
        },
      };
    }

    // Fetch existing items in the grocery list
    const { data: existingItems, error: fetchError } = await supabase
      .from('grocery_items')
      .select('*')
      .eq('grocery_list_id', validated.grocery_list_id);

    if (fetchError) {
      return {
        success: false,
        error: {
          type: 'DATABASE_ERROR',
          message: fetchError.message,
        },
      };
    }

    let itemsAdded = 0;
    let itemsMerged = 0;

    // Process each incoming ingredient
    for (const ingredient of validated.ingredients) {
      // Check if ingredient already exists in list (same ingredient_id and unit)
      const existingItem = existingItems?.find(
        (item) =>
          item.ingredient_id === ingredient.ingredient_id &&
          item.unit === ingredient.unit &&
          item.display_name === ingredient.display_name
      );

      if (existingItem) {
        // Merge: update quantity
        const newQuantity =
          parseFloat(existingItem.quantity) + ingredient.quantity;

        const { error: updateError } = await supabase
          .from('grocery_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id);

        if (updateError) {
          return {
            success: false,
            error: {
              type: 'DATABASE_ERROR',
              message: updateError.message,
            },
          };
        }

        itemsMerged++;
      } else {
        // Add new item
        const { error: insertError } = await supabase
          .from('grocery_items')
          .insert({
            grocery_list_id: validated.grocery_list_id,
            ingredient_id: ingredient.ingredient_id,
            display_name: ingredient.display_name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            checked: false,
          });

        if (insertError) {
          return {
            success: false,
            error: {
              type: 'DATABASE_ERROR',
              message: insertError.message,
            },
          };
        }

        itemsAdded++;
      }
    }

    return {
      success: true,
      data: {
        items_added: itemsAdded,
        items_merged: itemsMerged,
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
 * Grocery tools namespace (for future expansion).
 */
export const grocery = {
  push_ingredients: {
    execute: pushIngredients,
    schema: PushIngredientsSchema,
  },
};
