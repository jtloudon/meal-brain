import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { grocery as groceryTools } from '@/lib/tools/grocery';
import { supabase } from '@/lib/db/supabase';

// Test household and user IDs
const TEST_HOUSEHOLD_ID = '00000000-0000-0000-0000-000000000001';
const TEST_USER_ID = '10000000-0000-0000-0000-000000000001';

describe('Tool: grocery.add_item', () => {
  let testListId: string;

  beforeAll(async () => {
    // Test household should exist from seed data
  });

  beforeEach(async () => {
    // Clean up test grocery lists and items
    await supabase
      .from('grocery_lists')
      .delete()
      .eq('household_id', TEST_HOUSEHOLD_ID);

    // Create a test grocery list
    const listResult = await groceryTools.create_list.execute(
      {
        name: 'Weekly Groceries',
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    expect(listResult.success).toBe(true);
    if (listResult.success) {
      testListId = listResult.data.grocery_list_id;
    }
  });

  it('Test Case 1: Add item to list', async () => {
    // When: Add an item
    const result = await groceryTools.add_item.execute(
      {
        grocery_list_id: testListId,
        name: 'milk',
        quantity: 1,
        unit: 'gallon',
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    // Then: Should succeed
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.grocery_item_id).toBeDefined();

      // Verify in database
      const { data: item } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('id', result.data.grocery_item_id)
        .single();

      expect(item?.display_name).toBe('milk');
      expect(item?.quantity).toBe(1);
      expect(item?.unit).toBe('gallon');
      expect(item?.checked).toBe(false); // Default unchecked
    }
  });

  it('Test Case 2: Reject invalid unit', async () => {
    // When: Try to add item with invalid unit
    const result = await groceryTools.add_item.execute(
      {
        grocery_list_id: testListId,
        name: 'sugar',
        quantity: 1,
        unit: 'handfuls', // Invalid unit
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    // Then: Should fail with validation error
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('VALIDATION_ERROR');
      expect(result.error.field).toBe('unit');
    }
  });
});
