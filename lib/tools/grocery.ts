import { z } from 'zod';
import { supabase } from '@/lib/db/supabase';

/**
 * Valid units for grocery items (matches recipe units).
 */
const VALID_UNITS = [
  // Volume
  'cup',
  'tbsp',
  'tsp',
  'ml',
  'l',
  'fl oz',
  'gallon',
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
        ingredient_id: z.string().nullable(),
        display_name: z.string().min(1, 'Display name is required'),
        quantity_min: z.number().positive('Quantity must be positive'),
        quantity_max: z.number().positive().nullable().optional(),
        unit: z.string().min(1, 'Unit is required'),
        prep_state: z.string().optional(),
        source_recipe_id: z.string().optional(),
      })
    )
    .min(1, 'At least one ingredient is required'),
});

export type PushIngredientsInput = z.infer<typeof PushIngredientsSchema>;

/**
 * Zod schema for creating a new grocery list.
 */
export const CreateListSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
});

export type CreateListInput = z.infer<typeof CreateListSchema>;

/**
 * Zod schema for manually adding an item to a grocery list.
 */
export const AddItemSchema = z.object({
  grocery_list_id: z.string().uuid('Invalid grocery list ID format'),
  name: z.string().min(1, 'Name is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.enum(VALID_UNITS),
  ingredient_id: z.string().optional(),
});

export type AddItemInput = z.infer<typeof AddItemSchema>;

/**
 * Zod schema for checking/unchecking a grocery item.
 */
export const CheckItemSchema = z.object({
  grocery_item_id: z.string().uuid('Invalid item ID format'),
  checked: z.boolean(),
});

export type CheckItemInput = z.infer<typeof CheckItemSchema>;

/**
 * Zod schema for listing all grocery lists.
 */
export const ListListsSchema = z.object({});

export type ListListsInput = z.infer<typeof ListListsSchema>;

/**
 * Zod schema for getting a single grocery list with items.
 */
export const GetListSchema = z.object({
  grocery_list_id: z.string().uuid('Invalid grocery list ID format'),
});

export type GetListInput = z.infer<typeof GetListSchema>;

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
      // Check if ingredient already exists in list from the SAME recipe
      // We only merge if it's the exact same ingredient from the same recipe
      // Different recipes get separate line items for traceability
      const existingItem = existingItems?.find(
        (item) =>
          item.ingredient_id === ingredient.ingredient_id &&
          item.unit === ingredient.unit &&
          item.display_name === ingredient.display_name &&
          item.source_recipe_id === (ingredient.source_recipe_id || null)
      );

      if (existingItem) {
        // Merge: update quantity (only if from same recipe)
        // Use quantity_max if available (for ranges like "1-2"), otherwise use quantity_min
        const ingredientQty = ingredient.quantity_max ?? ingredient.quantity_min;
        const newQuantity =
          parseFloat(existingItem.quantity) + ingredientQty;

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
        // Add new item - auto-categorize based on ingredient
        const { categorizeIngredient } = await import('@/lib/utils/categorize-ingredient');
        const category = categorizeIngredient(ingredient.display_name);

        // Use quantity_max if available (for ranges like "1-2"), otherwise use quantity_min
        const ingredientQty = ingredient.quantity_max ?? ingredient.quantity_min;

        const { error: insertError } = await supabase
          .from('grocery_items')
          .insert({
            grocery_list_id: validated.grocery_list_id,
            ingredient_id: ingredient.ingredient_id,
            display_name: ingredient.display_name,
            quantity: ingredientQty,
            unit: ingredient.unit,
            checked: false,
            category: category,
            source_recipe_id: ingredient.source_recipe_id || null,
            prep_state: ingredient.prep_state || null,
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
 * Creates a new grocery list for a household.
 * Enforces household isolation and prevents duplicate list names.
 *
 * @param input - List name
 * @param context - User and household context for RLS
 * @returns Tool result with grocery_list_id on success
 */
export async function createList(
  input: CreateListInput,
  context: ToolContext
): Promise<ToolResult<{ grocery_list_id: string }>> {
  try {
    // Validate input
    const validated = CreateListSchema.parse(input);

    // Check if list with same name already exists in household
    const { data: existingList } = await supabase
      .from('grocery_lists')
      .select('id')
      .eq('household_id', context.householdId)
      .eq('name', validated.name)
      .single();

    if (existingList) {
      return {
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          field: 'name',
          message: `A grocery list named "${validated.name}" already exists`,
        },
      };
    }

    // Create the list
    const { data: groceryList, error } = await supabase
      .from('grocery_lists')
      .insert({
        household_id: context.householdId,
        name: validated.name,
      })
      .select('id')
      .single();

    if (error || !groceryList) {
      return {
        success: false,
        error: {
          type: 'DATABASE_ERROR',
          message: error?.message ?? 'Failed to create grocery list',
        },
      };
    }

    return {
      success: true,
      data: {
        grocery_list_id: groceryList.id,
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
 * Manually adds a single item to a grocery list.
 * Enforces household isolation and unit validation.
 *
 * @param input - Item details (name, quantity, unit)
 * @param context - User and household context for RLS
 * @returns Tool result with grocery_item_id on success
 */
export async function addItem(
  input: AddItemInput,
  context: ToolContext
): Promise<ToolResult<{ grocery_item_id: string }>> {
  try {
    // Validate input
    const validated = AddItemSchema.parse(input);

    // Verify grocery list exists and belongs to household
    const { data: list, error: listError } = await supabase
      .from('grocery_lists')
      .select('id, household_id')
      .eq('id', validated.grocery_list_id)
      .single();

    if (listError || !list) {
      return {
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: 'Grocery list not found',
        },
      };
    }

    if (list.household_id !== context.householdId) {
      return {
        success: false,
        error: {
          type: 'AUTHORIZATION_ERROR',
          message: 'You do not have permission to add items to this list',
        },
      };
    }

    // Auto-categorize the item
    const { categorizeIngredient } = await import('@/lib/utils/categorize-ingredient');
    const category = categorizeIngredient(validated.name);

    // Add the item
    const { data: item, error } = await supabase
      .from('grocery_items')
      .insert({
        grocery_list_id: validated.grocery_list_id,
        ingredient_id: validated.ingredient_id ?? null,
        display_name: validated.name,
        quantity: validated.quantity,
        unit: validated.unit,
        category: category,
        checked: false,
      })
      .select('id')
      .single();

    if (error || !item) {
      return {
        success: false,
        error: {
          type: 'DATABASE_ERROR',
          message: error?.message ?? 'Failed to add item',
        },
      };
    }

    return {
      success: true,
      data: {
        grocery_item_id: item.id,
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
 * Toggles the checked state of a grocery item.
 *
 * @param input - Item ID and checked state
 * @param context - User and household context for RLS
 * @returns Tool result with updated checked state
 */
export async function checkItem(
  input: CheckItemInput,
  context: ToolContext
): Promise<ToolResult<{ checked: boolean }>> {
  try {
    // Validate input
    const validated = CheckItemSchema.parse(input);

    // Verify item exists and belongs to household
    const { data: item, error: fetchError } = await supabase
      .from('grocery_items')
      .select('id, grocery_list_id, grocery_lists!inner(household_id)')
      .eq('id', validated.grocery_item_id)
      .single();

    if (fetchError || !item) {
      return {
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: 'Grocery item not found',
        },
      };
    }

    // Check household isolation
    const householdId = (item.grocery_lists as any).household_id;
    if (householdId !== context.householdId) {
      return {
        success: false,
        error: {
          type: 'AUTHORIZATION_ERROR',
          message: 'You do not have permission to modify this item',
        },
      };
    }

    // Update checked state
    const { error: updateError } = await supabase
      .from('grocery_items')
      .update({ checked: validated.checked })
      .eq('id', validated.grocery_item_id);

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
        checked: validated.checked,
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
 * Lists all grocery lists for a household.
 *
 * @param input - Empty object (no parameters needed)
 * @param context - User and household context for RLS
 * @returns Tool result with list of grocery lists
 */
export async function listLists(
  input: ListListsInput,
  context: ToolContext
): Promise<ToolResult<{ lists: Array<{ id: string; name: string; created_at: string }> }>> {
  try {
    // Validate input
    ListListsSchema.parse(input);

    // Fetch all lists for household
    const { data: lists, error } = await supabase
      .from('grocery_lists')
      .select('id, name, created_at')
      .eq('household_id', context.householdId)
      .order('created_at', { ascending: false });

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
        lists: lists || [],
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
 * Gets a single grocery list with all items.
 *
 * @param input - Grocery list ID
 * @param context - User and household context for RLS
 * @returns Tool result with list details and items
 */
export async function getList(
  input: GetListInput,
  context: ToolContext
): Promise<
  ToolResult<{
    id: string;
    name: string;
    created_at: string;
    items: Array<{
      id: string;
      display_name: string;
      quantity: number;
      unit: string;
      checked: boolean;
      ingredient_id: string | null;
      source_recipe_id: string | null;
      prep_state: string | null;
      recipes: { id: string; title: string } | null;
      category: string;
    }>;
  }>
> {
  try {
    // Validate input
    const validated = GetListSchema.parse(input);

    // Verify list exists and belongs to household
    const { data: list, error: listError } = await supabase
      .from('grocery_lists')
      .select('id, name, created_at')
      .eq('id', validated.grocery_list_id)
      .eq('household_id', context.householdId)
      .single();

    if (listError || !list) {
      return {
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: 'Grocery list not found or does not belong to your household',
        },
      };
    }

    // Fetch all items in the list with recipe information
    const { data: items, error: itemsError } = await supabase
      .from('grocery_items')
      .select('id, display_name, quantity, unit, checked, ingredient_id, source_recipe_id, prep_state, category, recipes:source_recipe_id(id, title)')
      .eq('grocery_list_id', validated.grocery_list_id)
      .order('created_at', { ascending: true });

    if (itemsError) {
      return {
        success: false,
        error: {
          type: 'DATABASE_ERROR',
          message: itemsError.message,
        },
      };
    }

    return {
      success: true,
      data: {
        id: list.id,
        name: list.name,
        created_at: list.created_at,
        items: (items || []).map((item: any) => ({
          ...item,
          recipes: Array.isArray(item.recipes) ? item.recipes[0] || null : item.recipes,
          ingredients: Array.isArray(item.ingredients) ? item.ingredients[0] || null : item.ingredients,
        })),
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
 * Grocery tools namespace (for future expansion).
 */
export const grocery = {
  push_ingredients: {
    execute: pushIngredients,
    schema: PushIngredientsSchema,
  },
  create_list: {
    execute: createList,
    schema: CreateListSchema,
  },
  add_item: {
    execute: addItem,
    schema: AddItemSchema,
  },
  check_item: {
    execute: checkItem,
    schema: CheckItemSchema,
  },
  list_lists: {
    execute: listLists,
    schema: ListListsSchema,
  },
  get_list: {
    execute: getList,
    schema: GetListSchema,
  },
};
