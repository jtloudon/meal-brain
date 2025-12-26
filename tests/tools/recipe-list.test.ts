import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { recipe } from '@/lib/tools/recipe';
import { supabase } from '@/lib/db/supabase';

// Test household and user IDs
const TEST_HOUSEHOLD_ID = '00000000-0000-0000-0000-000000000001';
const TEST_USER_ID = '10000000-0000-0000-0000-000000000001';

describe('Tool: recipe.list', () => {
  beforeAll(async () => {
    // Test household should already exist from seed data
  });

  beforeEach(async () => {
    // Clean up test recipes
    await supabase
      .from('recipes')
      .delete()
      .eq('household_id', TEST_HOUSEHOLD_ID)
      .neq('title', 'Chicken Tikka Masala') // Keep seed recipe
      .neq('title', 'Spaghetti Carbonara')
      .neq('title', 'Greek Salad');
  });

  it('Test Case 1: List all recipes (no filters)', async () => {
    // Given: Pre-seed 3 recipes
    const testRecipes = [
      {
        household_id: TEST_HOUSEHOLD_ID,
        title: 'Chicken Curry',
        tags: ['chicken', 'dinner'],
      },
      {
        household_id: TEST_HOUSEHOLD_ID,
        title: 'Beef Tacos',
        tags: ['beef', 'dinner'],
      },
      {
        household_id: TEST_HOUSEHOLD_ID,
        title: 'Pancakes',
        tags: ['breakfast'],
      },
    ];

    await supabase.from('recipes').insert(testRecipes);

    // When: List all recipes
    const result = await recipe.list.execute(
      {},
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    // Then: Should return all 3 recipes
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recipes).toHaveLength(3);
      expect(result.data.total).toBe(3);
    }
  });

  it('Test Case 2: Filter by tags', async () => {
    // Given: Same 3 recipes
    const testRecipes = [
      {
        household_id: TEST_HOUSEHOLD_ID,
        title: 'Chicken Curry',
        tags: ['chicken', 'dinner'],
      },
      {
        household_id: TEST_HOUSEHOLD_ID,
        title: 'Beef Tacos',
        tags: ['beef', 'dinner'],
      },
      {
        household_id: TEST_HOUSEHOLD_ID,
        title: 'Pancakes',
        tags: ['breakfast'],
      },
    ];

    await supabase.from('recipes').insert(testRecipes);

    // When: Filter by 'chicken' tag
    const result = await recipe.list.execute(
      {
        filters: { tags: ['chicken'] },
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    // Then: Should return only Chicken Curry
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recipes).toHaveLength(1);
      expect(result.data.recipes[0].title).toBe('Chicken Curry');
    }
  });

  it('Test Case 3: Search by title (case-insensitive)', async () => {
    // Given: Same 3 recipes
    const testRecipes = [
      {
        household_id: TEST_HOUSEHOLD_ID,
        title: 'Chicken Curry',
        tags: ['chicken', 'dinner'],
      },
      {
        household_id: TEST_HOUSEHOLD_ID,
        title: 'Beef Tacos',
        tags: ['beef', 'dinner'],
      },
      {
        household_id: TEST_HOUSEHOLD_ID,
        title: 'Pancakes',
        tags: ['breakfast'],
      },
    ];

    await supabase.from('recipes').insert(testRecipes);

    // When: Search for 'taco' (case-insensitive)
    const result = await recipe.list.execute(
      {
        filters: { search: 'taco' },
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    // Then: Should return only Beef Tacos
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recipes).toHaveLength(1);
      expect(result.data.recipes[0].title).toBe('Beef Tacos');
    }
  });
});
