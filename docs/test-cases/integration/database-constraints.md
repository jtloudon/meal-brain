# Integration Test: Database Constraints

**Module**: Database integrity and constraint enforcement

**Status**: ⬜ Not started

**Test Count**: 0/3 passing

**Coverage**: 0%

---

## Overview

Tests that database constraints (foreign keys, unique constraints, NOT NULL) are enforced correctly.

---

## Test Case 1: Foreign key constraint - Cannot add meal with non-existent recipe

**Status**: ⬜

**Given**:
```typescript
const nonExistentRecipeId = '00000000-0000-0000-0000-000000000000';
```

**When**:
```typescript
const result = await supabase
  .from('planner_meals')
  .insert({
    household_id: householdId,
    recipe_id: nonExistentRecipeId,
    date: '2025-12-25',
    meal_type: 'dinner',
  });
```

**Then**:
```typescript
expect(result.error).toBeDefined();
expect(result.error.code).toBe('23503'); // Foreign key violation
```

---

## Test Case 2: Cascade delete - Deleting recipe removes planner meals

**Status**: ⬜

**Given**:
```typescript
const recipe = await createRecipe({ title: 'Chicken Curry' });

// Add recipe to planner
await supabase.from('planner_meals').insert({
  household_id: householdId,
  recipe_id: recipe.id,
  date: '2025-12-25',
  meal_type: 'dinner',
});
```

**When**:
```typescript
// Delete recipe
await supabase.from('recipes').delete().eq('id', recipe.id);
```

**Then**:
```typescript
// Planner meals should also be deleted (cascade)
const { data: meals } = await supabase
  .from('planner_meals')
  .select('*')
  .eq('recipe_id', recipe.id);

expect(meals).toEqual([]);
```

**Note**: Or implement soft delete (set `deleted_at`) instead of cascade

---

## Test Case 3: NOT NULL constraint - Recipe title required

**Status**: ⬜

**When**:
```typescript
const result = await supabase.from('recipes').insert({
  household_id: householdId,
  title: null, // Should fail
  ingredients: [],
});
```

**Then**:
```typescript
expect(result.error).toBeDefined();
expect(result.error.code).toBe('23502'); // NOT NULL violation
```

---

## Progress Tracking

- [ ] Test Case 1: Foreign key violation
- [ ] Test Case 2: Cascade delete
- [ ] Test Case 3: NOT NULL constraint

**When all 3 pass**: Update [../README.md](../README.md) status to ✅
