# Tool Test: planner.list_meals

**Module**: `backend/tools/planner.ts`

**Status**: ⬜ Not started

**Test Count**: 0/2 passing

**Coverage**: 0%

---

## Overview

Agent SDK skill that lists planned meals for a date range.

**Tool signature**:
```typescript
planner.list_meals.execute({
  start_date: string, // ISO 8601
  end_date: string,   // ISO 8601
}, context)
```

---

## Test Case 1: List meals in date range

**Status**: ⬜

**Given**:
```typescript
const recipe1 = await createRecipe({ title: 'Chicken Curry' });
const recipe2 = await createRecipe({ title: 'Beef Tacos' });

// Add meals across 3 days
await addMeal(recipe1, '2025-12-23', 'dinner');
await addMeal(recipe2, '2025-12-24', 'dinner');
await addMeal(recipe1, '2025-12-25', 'lunch');
await addMeal(recipe2, '2025-12-26', 'dinner'); // Outside range
```

**When**:
```typescript
const result = await planner.list_meals.execute({
  start_date: '2025-12-23',
  end_date: '2025-12-25',
}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(true);
expect(result.data.meals).toHaveLength(3); // Only 3 meals in range
expect(result.data.meals[0].date).toBe('2025-12-23');
expect(result.data.meals[2].date).toBe('2025-12-25');

// Verify meal outside range not included
const mealDates = result.data.meals.map(m => m.date);
expect(mealDates).not.toContain('2025-12-26');
```

---

## Test Case 2: Empty result when no meals in range

**Status**: ⬜

**Given**:
```typescript
// No meals planned
```

**When**:
```typescript
const result = await planner.list_meals.execute({
  start_date: '2025-12-23',
  end_date: '2025-12-25',
}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(true);
expect(result.data.meals).toEqual([]);
expect(result.data.total).toBe(0);
```

---

## Tool Schema

```typescript
export const ListMealsSchema = z.object({
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
});
```

---

## Progress Tracking

- [ ] Test Case 1: List in range
- [ ] Test Case 2: Empty result

**When all 2 pass**: Update [../README.md](../README.md) status to ✅
