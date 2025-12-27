import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { planner as plannerTools } from '@/lib/tools/planner';
import { recipe as recipeTools } from '@/lib/tools/recipe';
import { supabase } from '@/lib/db/supabase';

// Test household and user IDs
const TEST_HOUSEHOLD_ID = '00000000-0000-4000-8000-000000000002';
const TEST_USER_ID = '10000000-0000-4000-8000-000000000003';

describe('Tool: planner.remove_meal', () => {
  beforeAll(async () => {
    // Test household should exist from seed data
  });

  beforeEach(async () => {
    // Clean up test planner meals
    await supabase
      .from('planner_meals')
      .delete()
      .eq('household_id', TEST_HOUSEHOLD_ID);
  });

  it('Test Case 1: Remove existing meal', async () => {
    // Given: Create a recipe and add it to the planner
    const recipeResult = await recipeTools.create.execute(
      {
        title: 'Chicken Curry',
        ingredients: [{ name: 'chicken', quantity: 1, unit: 'lb' }],
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    expect(recipeResult.success).toBe(true);
    if (!recipeResult.success) throw new Error('Setup failed');

    const { data: meal } = await supabase
      .from('planner_meals')
      .insert({
        household_id: TEST_HOUSEHOLD_ID,
        recipe_id: recipeResult.data.recipe_id,
        date: '2025-12-25',
        meal_type: 'dinner',
      })
      .select()
      .single();

    expect(meal).toBeTruthy();
    if (!meal) throw new Error('Setup failed');

    // When: Remove the meal
    const result = await plannerTools.remove_meal.execute(
      {
        planner_meal_id: meal.id,
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    // Then: Should succeed
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toContain('Meal removed');
    }

    // Verify deleted from database
    const { data: deletedMeal } = await supabase
      .from('planner_meals')
      .select('*')
      .eq('id', meal.id)
      .single();

    expect(deletedMeal).toBeNull();
  });

  it('Test Case 2: Remove non-existent meal', async () => {
    // Given: Valid UUID but non-existent meal
    const nonExistentMealId = 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaaa';

    // When: Try to remove
    const result = await plannerTools.remove_meal.execute(
      {
        planner_meal_id: nonExistentMealId,
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
      expect(result.error.message).toContain('Meal not found');
    }
  });
});
