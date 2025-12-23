# Tool Test: planner.add_meal

**Module**: `backend/tools/planner.ts`

**Status**: ⬜ Not started

**Test Count**: 0/5 passing

**Coverage**: 0%

---

## Overview

Agent SDK skill that adds a recipe to the meal planner on a specific date.

**Tool signature**:
```typescript
planner.add_meal.execute({
  recipe_id: string,
  date: string, // ISO 8601
  meal_type: 'breakfast' | 'lunch' | 'dinner',
}, context)
```

---

## Test Case 1: Add meal to valid date

**Status**: ⬜

**Given**:
```typescript
const recipeId = await createRecipe({ title: 'Chicken Curry' });
const date = '2025-12-25';
```

**When**:
```typescript
const result = await planner.add_meal.execute({
  recipe_id: recipeId,
  date,
  meal_type: 'dinner',
}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(true);
expect(result.data.planner_meal_id).toBeDefined();

const { data: meal } = await supabase
  .from('planner_meals')
  .select('*')
  .eq('id', result.data.planner_meal_id)
  .single();

expect(meal.recipe_id).toBe(recipeId);
expect(meal.date).toBe(date);
expect(meal.meal_type).toBe('dinner');
```

---

## Test Case 2: Reject invalid date format

**Status**: ⬜

**Given**:
```typescript
const recipeId = await createRecipe({ title: 'Test Recipe' });
const invalidDate = '12/25/2025'; // Wrong format (should be ISO 8601)
```

**When**:
```typescript
const result = await planner.add_meal.execute({
  recipe_id: recipeId,
  date: invalidDate,
  meal_type: 'dinner',
}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(false);
expect(result.error.type).toBe('VALIDATION_ERROR');
expect(result.error.field).toBe('date');
```

---

## Test Case 3: Reject non-existent recipe

**Status**: ⬜

**Given**:
```typescript
const nonExistentRecipeId = 'non-existent-uuid';
```

**When**:
```typescript
const result = await planner.add_meal.execute({
  recipe_id: nonExistentRecipeId,
  date: '2025-12-25',
  meal_type: 'dinner',
}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(false);
expect(result.error.type).toBe('NOT_FOUND');
expect(result.error.message).toContain('Recipe not found');
```

---

## Test Case 4: Reject invalid meal_type

**Status**: ⬜

**Given**:
```typescript
const recipeId = await createRecipe({ title: 'Test Recipe' });
```

**When**:
```typescript
const result = await planner.add_meal.execute({
  recipe_id: recipeId,
  date: '2025-12-25',
  meal_type: 'snack', // Invalid (not in enum)
}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(false);
expect(result.error.type).toBe('VALIDATION_ERROR');
expect(result.error.field).toBe('meal_type');
```

---

## Test Case 5: Allow duplicate meals on same date

**Status**: ⬜

**Given**:
```typescript
const recipeId = await createRecipe({ title: 'Chicken Curry' });
const date = '2025-12-25';

// Add meal first time
await planner.add_meal.execute({
  recipe_id: recipeId,
  date,
  meal_type: 'dinner',
}, { userId, householdId });
```

**When**:
```typescript
// Add same recipe to same date again
const result = await planner.add_meal.execute({
  recipe_id: recipeId,
  date,
  meal_type: 'dinner',
}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(true); // Duplicates allowed

const { data: meals } = await supabase
  .from('planner_meals')
  .select('*')
  .eq('date', date)
  .eq('meal_type', 'dinner');

expect(meals).toHaveLength(2); // Both meals exist
```

---

## Tool Schema

```typescript
export const AddMealSchema = z.object({
  recipe_id: z.string().uuid(),
  date: z.string().datetime(), // ISO 8601
  meal_type: z.enum(['breakfast', 'lunch', 'dinner']),
});
```

---

## Progress Tracking

- [ ] Test Case 1: Add valid meal
- [ ] Test Case 2: Invalid date format
- [ ] Test Case 3: Non-existent recipe
- [ ] Test Case 4: Invalid meal_type
- [ ] Test Case 5: Allow duplicates

**When all 5 pass**: Update [../README.md](../README.md) status to ✅
