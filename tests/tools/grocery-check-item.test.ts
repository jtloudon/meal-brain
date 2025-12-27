import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { grocery as groceryTools } from '@/lib/tools/grocery';
import { supabase } from '@/lib/db/supabase';

// Test household and user IDs
const TEST_HOUSEHOLD_ID = '00000000-0000-4000-8000-000000000002';
const TEST_USER_ID = '10000000-0000-4000-8000-000000000003';

describe('Tool: grocery.check_item', () => {
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

    // Create a fresh test list for each test
    const listResult = await groceryTools.create_list.execute(
      {
        name: 'Test List',
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    if (listResult.success) {
      testListId = listResult.data.grocery_list_id;
    }
  });

  it('Test Case 1: Check an unchecked item', async () => {
    // Given: An unchecked item exists
    const itemResult = await groceryTools.add_item.execute(
      {
        grocery_list_id: testListId,
        name: 'Milk',
        quantity: 1,
        unit: 'gallon',
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    expect(itemResult.success).toBe(true);
    if (!itemResult.success) return;

    const itemId = itemResult.data.grocery_item_id;

    // When: Check the item
    const result = await groceryTools.check_item.execute(
      {
        grocery_item_id: itemId,
        checked: true,
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    // Then: Should succeed and item should be checked
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.checked).toBe(true);

      // Verify in database
      const { data: item } = await supabase
        .from('grocery_items')
        .select('checked')
        .eq('id', itemId)
        .single();

      expect(item?.checked).toBe(true);
    }
  });

  it('Test Case 2: Item not found error', async () => {
    // Given: A fake item ID
    const fakeItemId = '00000000-0000-0000-0000-000000000000';

    // When: Try to check the item
    const result = await groceryTools.check_item.execute(
      {
        grocery_item_id: fakeItemId,
        checked: true,
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    // Then: Should fail with NOT_FOUND error
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('NOT_FOUND');
      expect(result.error.message).toContain('not found');
    }
  });
});
