# Tool Test: planner.remove_meal

**Module**: `backend/tools/planner.ts`

**Status**: ⬜ Not started

**Test Count**: 0/2 passing

**Coverage**: 0%

---

## Overview

Agent SDK skill that removes a planned meal from the calendar.

**Tool signature**:
```typescript
planner.remove_meal.execute({
  planner_meal_id: string,
}, context)
```

---

## Test Case 1: Remove existing meal

**Status**: ⬜

**Given**:
```typescript
const recipeId = await createRecipe({ title: 'Chicken Curry' });
const { data: meal } = await supabase
  .from('planner_meals')
  .insert({
    household_id: householdId,
    recipe_id: recipeId,
    date: '2025-12-25',
    meal_type: 'dinner',
  })
  .select()
  .single();
```

**When**:
```typescript
const result = await planner.remove_meal.execute({
  planner_meal_id: meal.id,
}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(true);
expect(result.message).toContain('Meal removed');

// Verify deleted from database
const { data: deletedMeal } = await supabase
  .from('planner_meals')
  .select('*')
  .eq('id', meal.id)
  .single();

expect(deletedMeal).toBeNull();
```

---

## Test Case 2: Remove non-existent meal

**Status**: ⬜

**Given**:
```typescript
const nonExistentMealId = 'non-existent-uuid';
```

**When**:
```typescript
const result = await planner.remove_meal.execute({
  planner_meal_id: nonExistentMealId,
}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(false);
expect(result.error.type).toBe('NOT_FOUND');
expect(result.error.message).toContain('Meal not found');
```

---

## Tool Schema

```typescript
export const RemoveMealSchema = z.object({
  planner_meal_id: z.string().uuid(),
});
```

---

## Progress Tracking

- [ ] Test Case 1: Remove existing
- [ ] Test Case 2: Not found error

**When all 2 pass**: Update [../README.md](../README.md) status to ✅
