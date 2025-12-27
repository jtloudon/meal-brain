import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { planner as plannerTools } from '@/lib/tools/planner';
import { recipe as recipeTools } from '@/lib/tools/recipe';
import { supabase } from '@/lib/db/supabase';

// Test household and user IDs
const TEST_HOUSEHOLD_ID = '00000000-0000-4000-8000-000000000002';
const TEST_USER_ID = '10000000-0000-4000-8000-000000000003';

describe('Tool: planner.list_meals', () => {
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

  it('Test Case 1: List meals in date range', async () => {
    // Given: Create recipes
    const recipe1Result = await recipeTools.create.execute(
      {
        title: 'Chicken Curry',
        ingredients: [{ name: 'chicken', quantity: 1, unit: 'lb' }],
      },
      { userId: TEST_USER_ID, householdId: TEST_HOUSEHOLD_ID }
    );

    const recipe2Result = await recipeTools.create.execute(
      {
        title: 'Beef Tacos',
        ingredients: [{ name: 'beef', quantity: 1, unit: 'lb' }],
      },
      { userId: TEST_USER_ID, householdId: TEST_HOUSEHOLD_ID }
    );

    expect(recipe1Result.success && recipe2Result.success).toBe(true);
    if (!recipe1Result.success || !recipe2Result.success) throw new Error('Setup failed');

    const recipe1Id = recipe1Result.data.recipe_id;
    const recipe2Id = recipe2Result.data.recipe_id;

    // Add meals across 4 days (3 in range, 1 outside)
    await plannerTools.add_meal.execute(
      { recipe_id: recipe1Id, date: '2025-12-23', meal_type: 'dinner' },
      { userId: TEST_USER_ID, householdId: TEST_HOUSEHOLD_ID }
    );
    await plannerTools.add_meal.execute(
      { recipe_id: recipe2Id, date: '2025-12-24', meal_type: 'dinner' },
      { userId: TEST_USER_ID, householdId: TEST_HOUSEHOLD_ID }
    );
    await plannerTools.add_meal.execute(
      { recipe_id: recipe1Id, date: '2025-12-25', meal_type: 'lunch' },
      { userId: TEST_USER_ID, householdId: TEST_HOUSEHOLD_ID }
    );
    await plannerTools.add_meal.execute(
      { recipe_id: recipe2Id, date: '2025-12-26', meal_type: 'dinner' }, // Outside range
      { userId: TEST_USER_ID, householdId: TEST_HOUSEHOLD_ID }
    );

    // When: List meals in range (Dec 23-25)
    const result = await plannerTools.list_meals.execute(
      {
        start_date: '2025-12-23',
        end_date: '2025-12-25',
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    // Then: Should return only 3 meals in range
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.meals).toHaveLength(3);
      expect(result.data.total).toBe(3);
      expect(result.data.meals[0].date).toBe('2025-12-23');
      expect(result.data.meals[2].date).toBe('2025-12-25');

      // Verify meal outside range not included
      const mealDates = result.data.meals.map((m) => m.date);
      expect(mealDates).not.toContain('2025-12-26');

      // Verify recipe titles are included
      expect(result.data.meals[0].recipe_title).toBe('Chicken Curry');
    }
  });

  it('Test Case 2: Empty result when no meals in range', async () => {
    // Given: No meals planned

    // When: List meals in range
    const result = await plannerTools.list_meals.execute(
      {
        start_date: '2025-12-23',
        end_date: '2025-12-25',
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    // Then: Should return empty array
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.meals).toEqual([]);
      expect(result.data.total).toBe(0);
    }
  });
});
