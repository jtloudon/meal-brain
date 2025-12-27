import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { grocery as groceryTools } from '@/lib/tools/grocery';
import { supabase } from '@/lib/db/supabase';

// Test household and user IDs
const TEST_HOUSEHOLD_ID = '00000000-0000-4000-8000-000000000002';
const TEST_USER_ID = '10000000-0000-4000-8000-000000000003';

describe('Tool: grocery.list_lists', () => {
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

  it('Test Case 1: List all grocery lists for household', async () => {
    // Given: 3 lists exist
    await groceryTools.create_list.execute(
      { name: 'Weekly' },
      { userId: TEST_USER_ID, householdId: TEST_HOUSEHOLD_ID }
    );
    await groceryTools.create_list.execute(
      { name: 'Monthly' },
      { userId: TEST_USER_ID, householdId: TEST_HOUSEHOLD_ID }
    );
    await groceryTools.create_list.execute(
      { name: 'Party' },
      { userId: TEST_USER_ID, householdId: TEST_HOUSEHOLD_ID }
    );

    // When: List all lists
    const result = await groceryTools.list_lists.execute(
      {},
      { userId: TEST_USER_ID, householdId: TEST_HOUSEHOLD_ID }
    );

    // Then: Should return all 3 lists
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lists).toHaveLength(3);

      const names = result.data.lists.map((l) => l.name);
      expect(names).toContain('Weekly');
      expect(names).toContain('Monthly');
      expect(names).toContain('Party');

      // Each list should have required fields
      result.data.lists.forEach((list) => {
        expect(list.id).toBeDefined();
        expect(list.name).toBeDefined();
        expect(list.created_at).toBeDefined();
      });
    }
  });

  it('Test Case 2: Return empty array when no lists exist', async () => {
    // Given: No lists exist (cleaned in beforeEach)

    // When: List all lists
    const result = await groceryTools.list_lists.execute(
      {},
      { userId: TEST_USER_ID, householdId: TEST_HOUSEHOLD_ID }
    );

    // Then: Should return empty array
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lists).toEqual([]);
    }
  });
});
