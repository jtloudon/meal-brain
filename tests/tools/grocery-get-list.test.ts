import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { grocery as groceryTools } from '@/lib/tools/grocery';
import { supabase } from '@/lib/db/supabase';

// Test household and user IDs
const TEST_HOUSEHOLD_ID = '00000000-0000-4000-8000-000000000002';
const TEST_USER_ID = '10000000-0000-4000-8000-000000000003';

describe('Tool: grocery.get_list', () => {
  beforeAll(async () => {
    // Test household should exist from seed data
  });

  beforeEach(async () => {
    // Clean up test grocery lists
    await supabase
      .from('grocery_lists')
      .delete()
      .eq('household_id', TEST_HOUSEHOLD_ID);
  });

  it('Test Case 1: Get list with items', async () => {
    // Given: A list with 2 items
    const listResult = await groceryTools.create_list.execute(
      {
        name: 'Test List',
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    expect(listResult.success).toBe(true);
    if (!listResult.success) return;

    const listId = listResult.data.grocery_list_id;

    await groceryTools.add_item.execute(
      {
        grocery_list_id: listId,
        name: 'Milk',
        quantity: 1,
        unit: 'gallon',
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    await groceryTools.add_item.execute(
      {
        grocery_list_id: listId,
        name: 'Eggs',
        quantity: 12,
        unit: 'whole',
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    // When: Get the list
    const result = await groceryTools.get_list.execute(
      {
        grocery_list_id: listId,
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    // Then: Should return list with items
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(listId);
      expect(result.data.name).toBe('Test List');
      expect(result.data.items).toHaveLength(2);

      // Check items have required fields
      result.data.items.forEach((item) => {
        expect(item.id).toBeDefined();
        expect(item.display_name).toBeDefined();
        expect(item.quantity).toBeDefined();
        expect(item.unit).toBeDefined();
        expect(item.checked).toBeDefined();
      });
    }
  });

  it('Test Case 2: Get empty list (no items)', async () => {
    // Given: A list with no items
    const listResult = await groceryTools.create_list.execute(
      {
        name: 'Empty List',
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    expect(listResult.success).toBe(true);
    if (!listResult.success) return;

    // When: Get the list
    const result = await groceryTools.get_list.execute(
      {
        grocery_list_id: listResult.data.grocery_list_id,
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    // Then: Should return empty items array
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toEqual([]);
    }
  });

  it('Test Case 3: List not found error', async () => {
    // Given: A fake list ID
    const fakeListId = '00000000-0000-0000-0000-000000000000';

    // When: Try to get the list
    const result = await groceryTools.get_list.execute(
      {
        grocery_list_id: fakeListId,
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
