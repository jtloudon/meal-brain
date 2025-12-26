// Pure functions for aggregating ingredients with deterministic merging rules

export interface Ingredient {
  ingredient_id: string;
  quantity: number;
  unit: string;
  prep_state?: string | null;
  source_recipe_id?: string;
}

export interface AggregatedIngredient {
  ingredient_id: string;
  quantity: number;
  total_quantity: number;
  unit: string;
  prep_state?: string | null;
  sources: Array<{ recipe_id: string; quantity: number }>;
}

/**
 * Determines if two ingredients can be merged.
 * Ingredients can merge if they have the same:
 * - ingredient_id
 * - unit
 * - prep_state (including both being null/undefined)
 */
export function shouldMerge(
  ingredient1: Ingredient,
  ingredient2: Ingredient
): boolean {
  return (
    ingredient1.ingredient_id === ingredient2.ingredient_id &&
    ingredient1.unit === ingredient2.unit &&
    ingredient1.prep_state === ingredient2.prep_state
  );
}

/**
 * Merges two ingredients by adding their quantities.
 * Throws error if ingredients cannot be merged.
 */
export function mergeIngredients(
  ingredient1: Ingredient,
  ingredient2: Ingredient
): Ingredient {
  if (!shouldMerge(ingredient1, ingredient2)) {
    throw new Error(
      'Cannot merge ingredients with different units or prep states'
    );
  }

  return {
    ingredient_id: ingredient1.ingredient_id,
    quantity: ingredient1.quantity + ingredient2.quantity,
    unit: ingredient1.unit,
    prep_state: ingredient1.prep_state,
  };
}

/**
 * Aggregates an array of ingredients into distinct groups.
 * Ingredients with the same id, unit, and prep_state are merged.
 */
export function aggregateIngredients(
  ingredients: Ingredient[]
): Ingredient[] {
  if (ingredients.length === 0) {
    return [];
  }

  const aggregated: Ingredient[] = [];

  for (const ingredient of ingredients) {
    // Find existing ingredient that can be merged with this one
    const existingIndex = aggregated.findIndex((existing) =>
      shouldMerge(existing, ingredient)
    );

    if (existingIndex >= 0) {
      // Merge with existing
      aggregated[existingIndex] = mergeIngredients(
        aggregated[existingIndex],
        ingredient
      );
    } else {
      // Add as new ingredient
      aggregated.push({
        ingredient_id: ingredient.ingredient_id,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        prep_state: ingredient.prep_state,
      });
    }
  }

  return aggregated;
}

/**
 * Aggregates ingredients while preserving source traceability.
 * Returns aggregated ingredients with sources array showing which recipes contributed.
 */
export function aggregateWithSources(
  ingredients: Ingredient[]
): AggregatedIngredient[] {
  if (ingredients.length === 0) {
    return [];
  }

  const aggregated: AggregatedIngredient[] = [];

  for (const ingredient of ingredients) {
    // Find existing ingredient that can be merged with this one
    const existingIndex = aggregated.findIndex((existing) =>
      shouldMerge(existing, ingredient)
    );

    if (existingIndex >= 0) {
      // Merge with existing - add to total and append source
      const existing = aggregated[existingIndex];
      aggregated[existingIndex] = {
        ...existing,
        quantity: existing.quantity + ingredient.quantity,
        total_quantity: existing.total_quantity + ingredient.quantity,
        sources: [
          ...existing.sources,
          {
            recipe_id: ingredient.source_recipe_id!,
            quantity: ingredient.quantity,
          },
        ],
      };
    } else {
      // Add as new ingredient
      aggregated.push({
        ingredient_id: ingredient.ingredient_id,
        quantity: ingredient.quantity,
        total_quantity: ingredient.quantity,
        unit: ingredient.unit,
        prep_state: ingredient.prep_state,
        sources: [
          {
            recipe_id: ingredient.source_recipe_id!,
            quantity: ingredient.quantity,
          },
        ],
      });
    }
  }

  return aggregated;
}
