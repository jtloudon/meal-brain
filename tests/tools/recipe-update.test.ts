import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { recipe as recipeTools } from '@/lib/tools/recipe';
import { supabase } from '@/lib/db/supabase';

// Test household and user IDs
const TEST_HOUSEHOLD_ID = '00000000-0000-4000-8000-000000000002';
const TEST_USER_ID = '10000000-0000-4000-8000-000000000003';
const TEST_HOUSEHOLD_B_ID = '00000000-0000-0000-0000-000000000002';
const TEST_USER_B_ID = '10000000-0000-0000-0000-000000000003';

describe('Tool: recipeTools.update', () => {
  beforeAll(async () => {
    // Ensure test households exist
    await supabase.from('households').upsert({
      id: TEST_HOUSEHOLD_B_ID,
      name: 'Test Household B',
    });

    // Ensure test user B exists
    await supabase.from('users').upsert({
      id: TEST_USER_B_ID,
      email: 'test-b@mealbrain.app',
      household_id: TEST_HOUSEHOLD_B_ID,
    });
  });

  beforeEach(async () => {
    // Clean up test recipes
    await supabase
      .from('recipes')
      .delete()
      .eq('household_id', TEST_HOUSEHOLD_ID)
      .neq('title', 'Chicken Tikka Masala') // Keep seed recipes
      .neq('title', 'Spaghetti Carbonara')
      .neq('title', 'Greek Salad');
  });

  it('Test Case 1: Update recipe title', async () => {
    // Given: Create a recipe
    const createResult = await recipeTools.create.execute(
      {
        title: 'Chicken Curry',
        ingredients: [{ name: 'chicken', quantity: 1, unit: 'lb' }],
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    expect(createResult.success).toBe(true);
    if (!createResult.success) throw new Error('Setup failed');

    const recipeId = createResult.data.recipe_id;

    // When: Update only the title
    const updateResult = await recipeTools.update.execute(
      {
        recipe_id: recipeId,
        title: 'Spicy Chicken Curry',
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    // Then: Update should succeed
    expect(updateResult.success).toBe(true);

    // Verify title changed
    const { data: updatedRecipe } = await supabase
      .from('recipes')
      .select('title')
      .eq('id', recipeId)
      .single();

    expect(updatedRecipe?.title).toBe('Spicy Chicken Curry');

    // Verify ingredients unchanged
    const { data: ingredients } = await supabase
      .from('recipe_ingredients')
      .select('*')
      .eq('recipe_id', recipeId);

    expect(ingredients).toHaveLength(1);
    expect(ingredients?.[0].display_name).toBe('chicken');
  });

  it('Test Case 2: Update non-existent recipe', async () => {
    // Given: Valid UUID v4 but non-existent recipe
    const nonExistentId = 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaaa';

    // When: Try to update
    const result = await recipeTools.update.execute(
      {
        recipe_id: nonExistentId,
        title: 'New Title',
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    // Then: Should return NOT_FOUND error
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('NOT_FOUND');
      expect(result.error.message).toContain('Recipe not found');
    }
  });

  it('Test Case 3: Cannot update recipe from different household', async () => {
    // Given: Recipe in household A
    const createResult = await recipeTools.create.execute(
      {
        title: 'Recipe A',
        ingredients: [{ name: 'ingredient', quantity: 1, unit: 'cup' }],
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    expect(createResult.success).toBe(true);
    if (!createResult.success) throw new Error('Setup failed');

    const recipeId = createResult.data.recipe_id;

    // When: User from household B tries to update
    const result = await recipeTools.update.execute(
      {
        recipe_id: recipeId,
        title: 'Hacked Title',
      },
      {
        userId: TEST_USER_B_ID,
        householdId: TEST_HOUSEHOLD_B_ID,
      }
    );

    // Then: Should return PERMISSION_DENIED error
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('PERMISSION_DENIED');
    }

    // Verify title unchanged
    const { data: recipe } = await supabase
      .from('recipes')
      .select('title')
      .eq('id', recipeId)
      .single();

    expect(recipe?.title).toBe('Recipe A');
  });
});
