import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { planner } from '@/lib/tools/planner';
import { supabase } from '@/lib/db/supabase';

// Test household and user IDs (from seed data)
const TEST_HOUSEHOLD_ID = '00000000-0000-0000-0000-000000000001';
const TEST_USER_ID = '10000000-0000-0000-0000-000000000001';

// Test recipe ID (Chicken Curry from seed data)
const TEST_RECIPE_ID = 'b0000000-0000-0000-0000-000000000001';

describe('Tool: planner.add_meal', () => {
  beforeAll(async () => {
    // Verify seed data exists
    const { data: recipe } = await supabase
      .from('recipes')
      .select('id')
      .eq('id', TEST_RECIPE_ID)
      .single();

    if (!recipe) {
      throw new Error('Seed data missing - run supabase db reset');
    }
  });

  beforeEach(async () => {
    // Clean up planner_meals created during tests
    // Keep seed data intact (dates are CURRENT_DATE, CURRENT_DATE + 1)
    // Delete future meals beyond 2 days from now
    await supabase
      .from('planner_meals')
      .delete()
      .eq('household_id', TEST_HOUSEHOLD_ID)
      .gte('date', new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  });

  afterAll(async () => {
    // Clean up all test meals
    await supabase
      .from('planner_meals')
      .delete()
      .eq('household_id', TEST_HOUSEHOLD_ID)
      .gte('date', new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  });

  describe('Test Case 1: Add meal to valid date', () => {
    it('should create planner meal and store in database', async () => {
      const date = '2025-12-25';

      const result = await planner.add_meal.execute(
        {
          recipe_id: TEST_RECIPE_ID,
          date,
          meal_type: 'dinner',
        },
        {
          userId: TEST_USER_ID,
          householdId: TEST_HOUSEHOLD_ID,
        }
      );

      if (!result.success) {
        console.error('Planner add_meal failed:', result.error);
      }

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.planner_meal_id).toBeDefined();

      // Verify in database
      const { data: meal } = await supabase
        .from('planner_meals')
        .select('*')
        .eq('id', result.data.planner_meal_id)
        .single();

      expect(meal?.recipe_id).toBe(TEST_RECIPE_ID);
      expect(meal?.date).toBe(date);
      expect(meal?.meal_type).toBe('dinner');
      expect(meal?.household_id).toBe(TEST_HOUSEHOLD_ID);

      // Clean up
      await supabase.from('planner_meals').delete().eq('id', result.data.planner_meal_id);
    });
  });

  describe('Test Case 2: Reject invalid date format', () => {
    it('should return validation error for non-ISO date', async () => {
      const invalidDate = '12/25/2025'; // Wrong format

      const result = await planner.add_meal.execute(
        {
          recipe_id: TEST_RECIPE_ID,
          date: invalidDate,
          meal_type: 'dinner',
        },
        {
          userId: TEST_USER_ID,
          householdId: TEST_HOUSEHOLD_ID,
        }
      );

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.type).toBe('VALIDATION_ERROR');
      expect(result.error.field).toBe('date');
    });
  });

  describe('Test Case 3: Reject non-existent recipe', () => {
    it('should return NOT_FOUND error for non-existent recipe', async () => {
      const nonExistentRecipeId = '00000000-0000-0000-0000-999999999999';

      const result = await planner.add_meal.execute(
        {
          recipe_id: nonExistentRecipeId,
          date: '2025-12-25',
          meal_type: 'dinner',
        },
        {
          userId: TEST_USER_ID,
          householdId: TEST_HOUSEHOLD_ID,
        }
      );

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.type).toBe('NOT_FOUND');
      expect(result.error.message).toContain('Recipe not found');
    });
  });

  describe('Test Case 4: Reject invalid meal_type', () => {
    it('should return validation error for invalid meal_type', async () => {
      const result = await planner.add_meal.execute(
        {
          recipe_id: TEST_RECIPE_ID,
          date: '2025-12-25',
          meal_type: 'snack' as any, // Invalid
        },
        {
          userId: TEST_USER_ID,
          householdId: TEST_HOUSEHOLD_ID,
        }
      );

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.type).toBe('VALIDATION_ERROR');
      expect(result.error.field).toBe('meal_type');
    });
  });

  describe('Test Case 5: Allow duplicate meals on same date', () => {
    it('should allow adding same recipe to same date twice', async () => {
      const date = '2025-12-26';

      // Add meal first time
      const result1 = await planner.add_meal.execute(
        {
          recipe_id: TEST_RECIPE_ID,
          date,
          meal_type: 'dinner',
        },
        {
          userId: TEST_USER_ID,
          householdId: TEST_HOUSEHOLD_ID,
        }
      );

      expect(result1.success).toBe(true);
      if (!result1.success) return;

      // Add same recipe to same date again
      const result2 = await planner.add_meal.execute(
        {
          recipe_id: TEST_RECIPE_ID,
          date,
          meal_type: 'dinner',
        },
        {
          userId: TEST_USER_ID,
          householdId: TEST_HOUSEHOLD_ID,
        }
      );

      expect(result2.success).toBe(true);
      if (!result2.success) return;

      // Verify both meals exist
      const { data: meals } = await supabase
        .from('planner_meals')
        .select('*')
        .eq('date', date)
        .eq('meal_type', 'dinner')
        .eq('household_id', TEST_HOUSEHOLD_ID);

      expect(meals).toHaveLength(2);

      // Clean up
      await supabase.from('planner_meals').delete().eq('id', result1.data.planner_meal_id);
      await supabase.from('planner_meals').delete().eq('id', result2.data.planner_meal_id);
    });
  });
});
