import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { grocery as groceryTools } from '@/lib/tools/grocery';
import { supabase } from '@/lib/db/supabase';

// Test household and user IDs
const TEST_HOUSEHOLD_ID = '00000000-0000-0000-0000-000000000001';
const TEST_USER_ID = '10000000-0000-0000-0000-000000000001';

describe('Tool: grocery.create_list', () => {
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

  it('Test Case 1: Create list with valid name', async () => {
    // Given: A list name
    const listName = 'Weekly Groceries';

    // When: Create the list
    const result = await groceryTools.create_list.execute(
      {
        name: listName,
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    // Then: Should succeed
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.grocery_list_id).toBeDefined();

      // Verify in database
      const { data: list } = await supabase
        .from('grocery_lists')
        .select('*')
        .eq('id', result.data.grocery_list_id)
        .single();

      expect(list?.name).toBe(listName);
      expect(list?.household_id).toBe(TEST_HOUSEHOLD_ID);
    }
  });

  it('Test Case 2: Reject duplicate list name (within household)', async () => {
    // Given: A list already exists
    const firstResult = await groceryTools.create_list.execute(
      {
        name: 'Weekly Groceries',
      },
      {
        userId: TEST_USER_ID,
        householdId: TEST_HOUSEHOLD_ID,
      }
    );

    expect(firstResult.success).toBe(true);

    // When: Try to create another with same name
    const result = await groceryTools.create_list.execute(
      {
        name: 'Weekly Groceries',
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
      expect(result.error.message).toContain('already exists');
    }
  });
});
