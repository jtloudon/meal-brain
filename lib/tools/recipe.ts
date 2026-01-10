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
  'gallon',
  'quart',
  'pint',
  'fl oz',
  // Weight
  'lb',
  'oz',
  'g',
  'kg',
  // Count/Containers
  'whole',
  'clove',
  'can',
  'jar',
  'bottle',
  'package',
  'bag',
  'box',
  'slice',
  'fillet',
  'piece',
  'breast',
  'thigh',
  'head',
  'bunch',
  'stalk',
  'sprig',
  'leaf',
  // Seasoning
  'pinch',
  'dash',
  'to taste',
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
        quantity_min: z.number().nonnegative('Quantity cannot be negative'),
        quantity_max: z.number().positive().nullable().optional(),
        unit: z.enum(VALID_UNITS).or(z.literal('')), // Allow empty string for unitless ingredients
        prep_state: z.string().optional(),
        is_header: z.boolean().optional(),
      })
    )
    .min(1, 'At least one ingredient is required'),
  instructions: z.string().optional(),
  tags: z.array(z.string()).optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
  notes: z.string().optional(),
  image_url: z.union([z.string().url(), z.literal('')]).optional(),
  source: z.string().optional(),
  serving_size: z.string().optional(),
  prep_time: z.string().optional(),
  cook_time: z.string().optional(),
  meal_type: z.string().nullable().optional(),
});

export type CreateRecipeInput = z.infer<typeof CreateRecipeSchema>;

/**
 * Zod schema for listing recipes with optional filters.
 */
export const ListRecipesSchema = z.object({
  filters: z
    .object({
      tags: z.array(z.string()).optional(),
      rating: z.number().min(1).max(5).nullable().optional(),
      search: z.string().optional(),
      meal_type: z.string().nullable().optional(),
    })
    .optional(),
  limit: z.number().positive().max(100).default(50),
  offset: z.number().nonnegative().default(0),
});

export type ListRecipesInput = z.infer<typeof ListRecipesSchema>;

/**
 * Zod schema for updating an existing recipe.
 */
export const UpdateRecipeSchema = z.object({
  recipe_id: z.string().uuid('Invalid recipe ID format'),
  title: z.string().min(1).max(100).optional(),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1, 'Ingredient name is required'),
        quantity_min: z.number().nonnegative('Quantity cannot be negative'),
        quantity_max: z.number().positive().nullable().optional(),
        unit: z.enum(VALID_UNITS).or(z.literal('')), // Allow empty string for unitless ingredients
        prep_state: z.string().optional(),
        is_header: z.boolean().optional(),
      })
    )
    .optional(),
  instructions: z.string().optional(),
  tags: z.array(z.string()).optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
  notes: z.string().optional(),
  image_url: z.union([z.string().url(), z.literal('')]).optional(),
  source: z.string().optional(),
  serving_size: z.string().optional(),
  prep_time: z.string().optional(),
  cook_time: z.string().optional(),
  meal_type: z.string().nullable().optional(),
});

export type UpdateRecipeInput = z.infer<typeof UpdateRecipeSchema>;

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
        type:
          | 'VALIDATION_ERROR'
          | 'DATABASE_ERROR'
          | 'AUTHORIZATION_ERROR'
          | 'NOT_FOUND'
          | 'PERMISSION_DENIED';
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
        instructions: validated.instructions ?? null,
        image_url: validated.image_url || null,
        source: validated.source || null,
        serving_size: validated.serving_size || null,
        prep_time: validated.prep_time || null,
        cook_time: validated.cook_time || null,
        meal_type: validated.meal_type || null,
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
    // First, ensure canonical ingredients exist in ingredients table (skip headers)
    for (const ingredient of validated.ingredients) {
      // Skip canonical ingredient creation for headers
      if (ingredient.is_header) continue;

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
        // Skip ingredient_id lookup for headers
        const isHeader = ingredient.is_header ?? false;
        let ingredientId = null;

        if (!isHeader) {
          // Get ingredient_id for non-headers
          const { data: canonicalIngredient } = await supabase
            .from('ingredients')
            .select('id')
            .eq('canonical_name', ingredient.name.toLowerCase())
            .single();
          ingredientId = canonicalIngredient?.id ?? null;
        }

        return {
          recipe_id: recipe.id,
          ingredient_id: ingredientId,
          display_name: ingredient.name,
          quantity_min: ingredient.quantity_min,
          quantity_max: ingredient.quantity_max ?? null,
          unit: ingredient.unit,
          prep_state: ingredient.prep_state ?? null,
          optional: false,
          is_header: isHeader,
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
 * Lists recipes with optional filtering and pagination.
 * Enforces household isolation via context.
 *
 * @param input - Filter and pagination options
 * @param context - User and household context for RLS
 * @returns Tool result with recipes array and total count
 */
export async function listRecipes(
  input: ListRecipesInput,
  context: ToolContext
): Promise<
  ToolResult<{
    recipes: Array<{
      id: string;
      title: string;
      tags: string[];
      rating: number | null;
      created_at: string;
      image_url: string | null;
      meal_type: string | null;
      prep_time: string | null;
      cook_time: string | null;
    }>;
    total: number;
  }>
> {
  try {
    // Validate input
    const validated = ListRecipesSchema.parse(input);

    // Build query - include ingredients, notes, and instructions for client-side search
    let query = supabase
      .from('recipes')
      .select('id, title, tags, rating, created_at, image_url, notes, instructions, meal_type, prep_time, cook_time, recipe_ingredients(display_name)', { count: 'exact' })
      .eq('household_id', context.householdId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (validated.filters) {
      // Filter by tags (array contains any of the provided tags)
      if (validated.filters.tags && validated.filters.tags.length > 0) {
        query = query.overlaps('tags', validated.filters.tags);
      }

      // Filter by rating
      if (validated.filters.rating) {
        query = query.eq('rating', validated.filters.rating);
      }

      // Search is handled client-side for comprehensive tag/text search
    }

    // Apply pagination
    query = query.range(
      validated.offset,
      validated.offset + validated.limit - 1
    );

    // Execute query
    const { data: recipes, error, count } = await query;

    if (error) {
      return {
        success: false,
        error: {
          type: 'DATABASE_ERROR',
          message: error.message,
        },
      };
    }

    return {
      success: true,
      data: {
        recipes: recipes ?? [],
        total: count ?? 0,
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
 * Updates an existing recipe.
 * Enforces household isolation and permission checks.
 *
 * @param input - Recipe fields to update (partial)
 * @param context - User and household context for RLS
 * @returns Tool result with success status
 */
export async function updateRecipe(
  input: UpdateRecipeInput,
  context: ToolContext
): Promise<ToolResult<{ recipe_id: string }>> {
  try {
    // Validate input
    const validated = UpdateRecipeSchema.parse(input);

    // Check if recipe exists and belongs to household
    const { data: existingRecipe, error: fetchError } = await supabase
      .from('recipes')
      .select('id, household_id')
      .eq('id', validated.recipe_id)
      .single();

    if (fetchError || !existingRecipe) {
      return {
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: 'Recipe not found',
        },
      };
    }

    // Check permission (household isolation)
    if (existingRecipe.household_id !== context.householdId) {
      return {
        success: false,
        error: {
          type: 'PERMISSION_DENIED',
          message: 'You do not have permission to update this recipe',
        },
      };
    }

    // Build update object (only include provided fields)
    const updateData: Record<string, any> = {};
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.rating !== undefined) updateData.rating = validated.rating;
    if (validated.tags !== undefined) updateData.tags = validated.tags;
    if (validated.notes !== undefined) updateData.notes = validated.notes;
    if (validated.instructions !== undefined)
      updateData.instructions = validated.instructions;
    if (validated.image_url !== undefined)
      updateData.image_url = validated.image_url || null;
    if (validated.source !== undefined)
      updateData.source = validated.source || null;
    if (validated.serving_size !== undefined)
      updateData.serving_size = validated.serving_size || null;
    if (validated.prep_time !== undefined)
      updateData.prep_time = validated.prep_time || null;
    if (validated.cook_time !== undefined)
      updateData.cook_time = validated.cook_time || null;
    if (validated.meal_type !== undefined)
      updateData.meal_type = validated.meal_type || null;

    // Update recipe if there are fields to update
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('recipes')
        .update(updateData)
        .eq('id', validated.recipe_id);

      if (updateError) {
        return {
          success: false,
          error: {
            type: 'DATABASE_ERROR',
            message: updateError.message,
          },
        };
      }
    }

    // Update ingredients if provided
    if (validated.ingredients) {
      // Delete existing ingredients
      const { error: deleteError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', validated.recipe_id);

      if (deleteError) {
        return {
          success: false,
          error: {
            type: 'DATABASE_ERROR',
            message: deleteError.message,
          },
        };
      }

      // Create canonical ingredients if they don't exist (skip headers)
      for (const ingredient of validated.ingredients) {
        // Skip canonical ingredient creation for headers
        if (ingredient.is_header) continue;

        const { data: existing } = await supabase
          .from('ingredients')
          .select('id')
          .eq('canonical_name', ingredient.name.toLowerCase())
          .single();

        if (!existing) {
          await supabase.from('ingredients').insert({
            canonical_name: ingredient.name.toLowerCase(),
          });
        }
      }

      // Insert new ingredients
      const recipeIngredients = await Promise.all(
        validated.ingredients.map(async (ingredient) => {
          // Skip ingredient_id lookup for headers
          const isHeader = ingredient.is_header ?? false;
          let ingredientId = null;

          if (!isHeader) {
            const { data: canonicalIngredient } = await supabase
              .from('ingredients')
              .select('id')
              .eq('canonical_name', ingredient.name.toLowerCase())
              .single();
            ingredientId = canonicalIngredient?.id ?? null;
          }

          return {
            recipe_id: validated.recipe_id,
            ingredient_id: ingredientId,
            display_name: ingredient.name,
            quantity_min: ingredient.quantity_min,
            quantity_max: ingredient.quantity_max ?? null,
            unit: ingredient.unit,
            prep_state: ingredient.prep_state ?? null,
            optional: false,
            is_header: isHeader,
          };
        })
      );

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(recipeIngredients);

      if (ingredientsError) {
        return {
          success: false,
          error: {
            type: 'DATABASE_ERROR',
            message: ingredientsError.message,
          },
        };
      }
    }

    // Fetch and return the updated recipe with ingredients
    const { data: updatedRecipe, error: refetchError } = await supabase
      .from('recipes')
      .select(
        `
        id,
        title,
        rating,
        tags,
        notes,
        instructions,
        image_url,
        source,
        serving_size,
        prep_time,
        cook_time,
        meal_type,
        created_at,
        recipe_ingredients (
          id,
          ingredient_id,
          display_name,
          quantity_min,
          quantity_max,
          unit,
          prep_state,
          optional,
          is_header
        )
      `
      )
      .eq('id', validated.recipe_id)
      .single();

    if (refetchError || !updatedRecipe) {
      return {
        success: false,
        error: {
          type: 'DATABASE_ERROR',
          message: 'Failed to fetch updated recipe',
        },
      };
    }

    return {
      success: true,
      data: updatedRecipe,
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
 * Zod schema for deleting a recipe.
 */
export const DeleteRecipeSchema = z.object({
  recipe_id: z.string().uuid('Invalid recipe ID format'),
});

export type DeleteRecipeInput = z.infer<typeof DeleteRecipeSchema>;

/**
 * Deletes a recipe and all its associated ingredients.
 * Enforces household isolation.
 *
 * @param input - Recipe ID to delete
 * @param context - User and household context for RLS
 * @returns Tool result with success status
 */
export async function deleteRecipe(
  input: DeleteRecipeInput,
  context: ToolContext
): Promise<ToolResult<{ recipe_id: string }>> {
  try {
    // Validate input
    const validated = DeleteRecipeSchema.parse(input);

    // Check if recipe exists and belongs to household
    const { data: existingRecipe, error: fetchError } = await supabase
      .from('recipes')
      .select('household_id')
      .eq('id', validated.recipe_id)
      .single();

    if (fetchError || !existingRecipe) {
      return {
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: 'Recipe not found',
        },
      };
    }

    // Check permission (household isolation)
    if (existingRecipe.household_id !== context.householdId) {
      return {
        success: false,
        error: {
          type: 'PERMISSION_DENIED',
          message: 'You do not have permission to delete this recipe',
        },
      };
    }

    // Delete recipe (cascade will delete recipe_ingredients)
    const { data: deleteData, error: deleteError } = await supabase
      .from('recipes')
      .delete()
      .eq('id', validated.recipe_id)
      .select();

    console.log('[DELETE RECIPE] Attempt to delete recipe:', validated.recipe_id);
    console.log('[DELETE RECIPE] Delete result:', { deleteData, deleteError });

    if (deleteError) {
      console.error('[DELETE RECIPE] Delete failed:', deleteError);
      return {
        success: false,
        error: {
          type: 'DATABASE_ERROR',
          message: deleteError.message,
        },
      };
    }

    console.log('[DELETE RECIPE] Successfully deleted recipe:', validated.recipe_id);
    return {
      success: true,
      data: { recipe_id: validated.recipe_id },
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
 * Recipe tools namespace (for future expansion).
 */
export const recipe = {
  create: {
    execute: createRecipe,
    schema: CreateRecipeSchema,
  },
  list: {
    execute: listRecipes,
    schema: ListRecipesSchema,
  },
  update: {
    execute: updateRecipe,
    schema: UpdateRecipeSchema,
  },
  delete: {
    execute: deleteRecipe,
    schema: DeleteRecipeSchema,
  },
};
