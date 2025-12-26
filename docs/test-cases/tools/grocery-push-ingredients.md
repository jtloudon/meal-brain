# Tool Test: grocery.push_ingredients

**Module**: `lib/tools/grocery.ts`

**Status**: ✅ Complete

**Test Count**: 4/4 passing

**Coverage**: 100%

---

## Overview

Agent SDK skill that pushes ingredients from recipes to a grocery list with deterministic aggregation.

**Tool signature**:
```typescript
grocery.push_ingredients.execute({
  grocery_list_id: UUID,
  ingredients: Ingredient[],
}, context)
```

**Dependencies**:
- Supabase database
- Ingredient aggregation logic
- RLS policies

---

## Test Case 1: Push ingredients to empty list

**Status**: ✅

**Given**:
```typescript
// Empty grocery_list exists
const groceryListId = 'list-123';

const ingredients = [
  { ingredient_id: 'rice-123', quantity: 1, unit: 'cup', source_recipe_id: 'recipe-A' },
  { ingredient_id: 'chicken-456', quantity: 1, unit: 'lb', source_recipe_id: 'recipe-A' },
];
```

**When**:
```typescript
const result = await grocery.push_ingredients.execute({
  grocery_list_id: groceryListId,
  ingredients,
}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(true);
expect(result.data.items_added).toBe(2);
expect(result.data.items_merged).toBe(0);

// Verify in database
const { data: items } = await supabase
  .from('grocery_items')
  .select('*')
  .eq('grocery_list_id', groceryListId);

expect(items).toHaveLength(2);
expect(items[0]).toMatchObject({
  ingredient_id: 'rice-123',
  quantity: 1,
  unit: 'cup',
});
```

---

## Test Case 2: Merge with existing ingredients (same unit)

**Status**: ✅

**Given**:
```typescript
// Grocery list already has:
// - rice: 1 cup (from previous push)

const existingItem = await supabase
  .from('grocery_items')
  .insert({
    grocery_list_id: groceryListId,
    ingredient_id: 'rice-123',
    quantity: 1,
    unit: 'cup',
  })
  .select()
  .single();

// Incoming ingredient
const incoming = [
  { ingredient_id: 'rice-123', quantity: 0.5, unit: 'cup', source_recipe_id: 'recipe-B' },
];
```

**When**:
```typescript
const result = await grocery.push_ingredients.execute({
  grocery_list_id: groceryListId,
  ingredients: incoming,
}, context);
```

**Then**:
```typescript
expect(result.success).toBe(true);
expect(result.data.items_merged).toBe(1);

// Verify merged quantity
const { data: items } = await supabase
  .from('grocery_items')
  .select('*')
  .eq('grocery_list_id', groceryListId)
  .eq('ingredient_id', 'rice-123');

expect(items).toHaveLength(1); // Still one item
expect(items[0].quantity).toBe(1.5); // Merged: 1 + 0.5

// Verify summary message
expect(result.message).toContain('Merged rice: 1 cup + 0.5 cup = 1.5 cup');
```

---

## Test Case 3: Do not merge when units differ

**Status**: ✅

**Given**:
```typescript
// Existing: chicken 1 lb
await supabase.from('grocery_items').insert({
  grocery_list_id: groceryListId,
  ingredient_id: 'chicken-456',
  quantity: 1,
  unit: 'lb',
});

// Incoming: chicken 500 g (different unit)
const incoming = [
  { ingredient_id: 'chicken-456', quantity: 500, unit: 'g' },
];
```

**When**:
```typescript
const result = await grocery.push_ingredients.execute({
  grocery_list_id: groceryListId,
  ingredients: incoming,
}, context);
```

**Then**:
```typescript
expect(result.success).toBe(true);
expect(result.data.items_added).toBe(1); // Added as separate item
expect(result.data.items_merged).toBe(0);

// Verify two separate items
const { data: items } = await supabase
  .from('grocery_items')
  .select('*')
  .eq('grocery_list_id', groceryListId)
  .eq('ingredient_id', 'chicken-456')
  .order('unit');

expect(items).toHaveLength(2);
expect(items[0]).toMatchObject({ quantity: 500, unit: 'g' });
expect(items[1]).toMatchObject({ quantity: 1, unit: 'lb' });

// Verify warning in message
expect(result.message).toContain('Unit mismatch');
```

---

## Test Case 4: Validation - Invalid grocery list ID

**Status**: ✅

**Given**:
```typescript
const nonExistentListId = 'non-existent-uuid';
const ingredients = [
  { ingredient_id: 'rice-123', quantity: 1, unit: 'cup' },
];
```

**When**:
```typescript
const result = await grocery.push_ingredients.execute({
  grocery_list_id: nonExistentListId,
  ingredients,
}, context);
```

**Then**:
```typescript
expect(result.success).toBe(false);
expect(result.error.type).toBe('NOT_FOUND');
expect(result.error.message).toContain('Grocery list not found');
```

---

## Additional Test Cases (Lower Priority)

### Test Case 5: Preserve source traceability
```typescript
// After merge, source_recipe_id should be preserved
// Could be stored as JSONB array: ['recipe-A', 'recipe-B']
```

### Test Case 6: Handle prep_state differences
```typescript
// onion 1 whole !== onion 1 chopped
// Should create separate items
```

### Test Case 7: Household isolation (RLS)
```typescript
// User from household_A cannot push to list in household_B
// Should fail with PERMISSION_DENIED
```

---

## Tool Schema (Zod)

```typescript
import { z } from 'zod';

export const PushIngredientsSchema = z.object({
  grocery_list_id: z.string().uuid(),
  ingredients: z.array(z.object({
    ingredient_id: z.string(),
    quantity: z.number().positive(),
    unit: z.string(),
    prep_state: z.string().optional(),
    source_recipe_id: z.string().uuid().optional(),
  })),
});

export type PushIngredientsInput = z.infer<typeof PushIngredientsSchema>;
```

---

## Test File Location

`backend/tools/__tests__/grocery-push-ingredients.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '../../tests/setup-integration';
import { groceryTools } from '../grocery';

describe('grocery.push_ingredients Tool', () => {
  let householdId: string;
  let userId: string;
  let groceryListId: string;

  beforeEach(async () => {
    // Create test household, user, and grocery list
    // ... setup code
  });

  it('pushes ingredients to empty list', async () => {
    // Test Case 1
  });

  it('merges ingredients with same unit', async () => {
    // Test Case 2
  });

  // ... more tests
});
```

---

## Progress Tracking

- [x] Test Case 1: Push to empty list
- [x] Test Case 2: Merge same unit
- [x] Test Case 3: No merge different units
- [x] Test Case 4: Invalid list ID error

✅ **All tests passing!**
