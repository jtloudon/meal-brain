import { z } from 'zod';
import { supabase } from '@/lib/db/supabase';

/**
 * Valid units for recipe ingredients.
 * Phase 1: Limited set. Unit conversion not supported.
 */
const VALID_UNITS = [
  // Volume
  'cup',
  'tbsp',
  'tsp',
  'ml',
  'l',
  'fl oz',
  // Weight
  'lb',
  'oz',
  'g',
  'kg',
  // Count
  'whole',
  'clove',
  'can',
  'package',
  'slice',
] as const;

/**
 * Zod schema for creating a new recipe.
 */
export const CreateRecipeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1, 'Ingredient name is required'),
        quantity: z.number().positive('Quantity must be positive'),
        unit: z.enum(VALID_UNITS),
        prep_state: z.string().optional(),
      })
    )
    .min(1, 'At least one ingredient is required'),
  instructions: z.string().optional(),
  tags: z.array(z.string()).optional(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
});

export type CreateRecipeInput = z.infer<typeof CreateRecipeSchema>;

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
        type: 'VALIDATION_ERROR' | 'DATABASE_ERROR' | 'AUTHORIZATION_ERROR';
        field?: string;
        message: string;
      };
    };

/**
 * Creates a new recipe with ingredients in the database.
 * Enforces household isolation via context.
 *
 * @param input - Recipe data validated against CreateRecipeSchema
 * @param context - User and household context for RLS
 * @returns Tool result with recipe_id on success
 */
export async function createRecipe(
  input: CreateRecipeInput,
  context: ToolContext
): Promise<ToolResult<{ recipe_id: string }>> {
  try {
    // Validate input
    const validated = CreateRecipeSchema.parse(input);

    // Create recipe
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        household_id: context.householdId,
        title: validated.title,
        rating: validated.rating ?? null,
        tags: validated.tags ?? [],
        notes: validated.notes ?? null,
      })
      .select('id')
      .single();

    if (recipeError || !recipe) {
      return {
        success: false,
        error: {
          type: 'DATABASE_ERROR',
          message: recipeError?.message ?? 'Failed to create recipe',
        },
      };
    }

    // Create ingredients
    // First, ensure canonical ingredients exist in ingredients table
    for (const ingredient of validated.ingredients) {
      // Check if ingredient exists
      const { data: existing } = await supabase
        .from('ingredients')
        .select('id')
        .eq('canonical_name', ingredient.name.toLowerCase())
        .single();

      if (!existing) {
        // Create canonical ingredient
        await supabase.from('ingredients').insert({
          canonical_name: ingredient.name.toLowerCase(),
        });
      }
    }

    // Now create recipe_ingredients
    const recipeIngredients = await Promise.all(
      validated.ingredients.map(async (ingredient) => {
        // Get ingredient_id
        const { data: canonicalIngredient } = await supabase
          .from('ingredients')
          .select('id')
          .eq('canonical_name', ingredient.name.toLowerCase())
          .single();

        return {
          recipe_id: recipe.id,
          ingredient_id: canonicalIngredient?.id ?? null,
          display_name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          prep_state: ingredient.prep_state ?? null,
          optional: false,
        };
      })
    );

    const { error: ingredientsError } = await supabase
      .from('recipe_ingredients')
      .insert(recipeIngredients);

    if (ingredientsError) {
      // Rollback: delete the recipe
      await supabase.from('recipes').delete().eq('id', recipe.id);

      return {
        success: false,
        error: {
          type: 'DATABASE_ERROR',
          message: ingredientsError.message,
        },
      };
    }

    return {
      success: true,
      data: {
        recipe_id: recipe.id,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Zod errors always have at least one error in the issues array
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
 * Recipe tools namespace (for future expansion).
 */
export const recipe = {
  create: {
    execute: createRecipe,
    schema: CreateRecipeSchema,
  },
};
