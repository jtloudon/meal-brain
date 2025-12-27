import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { grocery } from '@/lib/tools/grocery';
import { supabase } from '@/lib/db/supabase';

// Test household and user IDs (from seed data)
const TEST_HOUSEHOLD_ID = '00000000-0000-4000-8000-000000000002';
const TEST_USER_ID = '10000000-0000-4000-8000-000000000003';

// Test ingredient IDs (from seed data)
const RICE_INGREDIENT_ID = 'a0000000-0000-0000-0000-000000000002';
const CHICKEN_INGREDIENT_ID = 'a0000000-0000-0000-0000-000000000001';

describe('Tool: grocery.push_ingredients', () => {
  let testGroceryListId: string;

  beforeAll(async () => {
    // Verify seed data exists
    const { data: household } = await supabase
      .from('households')
      .select('id')
      .eq('id', TEST_HOUSEHOLD_ID)
      .single();

    if (!household) {
      throw new Error('Seed data missing - run supabase db reset');
    }
  });

  beforeEach(async () => {
    // Create a fresh grocery list for each test
    const { data: groceryList, error } = await supabase
      .from('grocery_lists')
      .insert({
        household_id: TEST_HOUSEHOLD_ID,
        name: 'Test Grocery List',
      })
      .select('id')
      .single();

    if (error || !groceryList) {
      throw new Error(`Failed to create test grocery list: ${error?.message}`);
    }

    testGroceryListId = groceryList.id;
  });

  afterAll(async () => {
    // Clean up test grocery lists and items
    await supabase
      .from('grocery_lists')
      .delete()
      .eq('household_id', TEST_HOUSEHOLD_ID)
      .eq('name', 'Test Grocery List');
  });

  describe('Test Case 1: Push ingredients to empty list', () => {
    it('should add ingredients to empty grocery list', async () => {
      const ingredients = [
        {
          ingredient_id: RICE_INGREDIENT_ID,
          display_name: 'rice',
          quantity: 1,
          unit: 'cup',
        },
        {
          ingredient_id: CHICKEN_INGREDIENT_ID,
          display_name: 'chicken breast',
          quantity: 1,
          unit: 'lb',
        },
      ];

      const result = await grocery.push_ingredients.execute(
        {
          grocery_list_id: testGroceryListId,
          ingredients,
        },
        {
          userId: TEST_USER_ID,
          householdId: TEST_HOUSEHOLD_ID,
        }
      );

      if (!result.success) {
        console.error('Push ingredients failed:', result.error);
      }

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.items_added).toBe(2);
      expect(result.data.items_merged).toBe(0);

      // Verify in database
      const { data: items } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('grocery_list_id', testGroceryListId)
        .order('display_name');

      expect(items).toHaveLength(2);
      expect(items?.[0]).toMatchObject({
        ingredient_id: CHICKEN_INGREDIENT_ID,
        display_name: 'chicken breast',
        unit: 'lb',
      });
      expect(parseFloat(items![0].quantity)).toBe(1);
      expect(items?.[1]).toMatchObject({
        ingredient_id: RICE_INGREDIENT_ID,
        display_name: 'rice',
        unit: 'cup',
      });
      expect(parseFloat(items![1].quantity)).toBe(1);
    });
  });

  describe('Test Case 2: Merge with existing ingredients (same unit)', () => {
    it('should merge ingredients with same ingredient_id and unit', async () => {
      // Add existing item
      await supabase.from('grocery_items').insert({
        grocery_list_id: testGroceryListId,
        ingredient_id: RICE_INGREDIENT_ID,
        display_name: 'rice',
        quantity: 1,
        unit: 'cup',
      });

      // Push additional rice with same unit
      const incoming = [
        {
          ingredient_id: RICE_INGREDIENT_ID,
          display_name: 'rice',
          quantity: 0.5,
          unit: 'cup',
        },
      ];

      const result = await grocery.push_ingredients.execute(
        {
          grocery_list_id: testGroceryListId,
          ingredients: incoming,
        },
        {
          userId: TEST_USER_ID,
          householdId: TEST_HOUSEHOLD_ID,
        }
      );

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.items_added).toBe(0);
      expect(result.data.items_merged).toBe(1);

      // Verify merged quantity
      const { data: items } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('grocery_list_id', testGroceryListId)
        .eq('ingredient_id', RICE_INGREDIENT_ID);

      expect(items).toHaveLength(1);
      expect(parseFloat(items![0].quantity)).toBe(1.5); // 1 + 0.5
    });
  });

  describe('Test Case 3: Do not merge when units differ', () => {
    it('should add separate items when units differ', async () => {
      // Add existing item: chicken 1 lb
      await supabase.from('grocery_items').insert({
        grocery_list_id: testGroceryListId,
        ingredient_id: CHICKEN_INGREDIENT_ID,
        display_name: 'chicken breast',
        quantity: 1,
        unit: 'lb',
      });

      // Push chicken with different unit: 500 g
      const incoming = [
        {
          ingredient_id: CHICKEN_INGREDIENT_ID,
          display_name: 'chicken breast',
          quantity: 500,
          unit: 'g',
        },
      ];

      const result = await grocery.push_ingredients.execute(
        {
          grocery_list_id: testGroceryListId,
          ingredients: incoming,
        },
        {
          userId: TEST_USER_ID,
          householdId: TEST_HOUSEHOLD_ID,
        }
      );

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.items_added).toBe(1);
      expect(result.data.items_merged).toBe(0);

      // Verify two separate items
      const { data: items } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('grocery_list_id', testGroceryListId)
        .eq('ingredient_id', CHICKEN_INGREDIENT_ID)
        .order('unit');

      expect(items).toHaveLength(2);
      expect(items?.[0]).toMatchObject({
        unit: 'g',
      });
      expect(parseFloat(items![0].quantity)).toBe(500);
      expect(items?.[1]).toMatchObject({
        unit: 'lb',
      });
      expect(parseFloat(items![1].quantity)).toBe(1);
    });
  });

  describe('Test Case 4: Validation - Invalid grocery list ID', () => {
    it('should return NOT_FOUND for non-existent grocery list', async () => {
      const nonExistentListId = '00000000-0000-0000-0000-999999999999';

      const result = await grocery.push_ingredients.execute(
        {
          grocery_list_id: nonExistentListId,
          ingredients: [
            {
              ingredient_id: RICE_INGREDIENT_ID,
              display_name: 'rice',
              quantity: 1,
              unit: 'cup',
            },
          ],
        },
        {
          userId: TEST_USER_ID,
          householdId: TEST_HOUSEHOLD_ID,
        }
      );

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.type).toBe('NOT_FOUND');
      expect(result.error.message).toContain('Grocery list not found');
    });
  });
});
