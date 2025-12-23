# Tool Test: recipe.update

**Module**: `backend/tools/recipe.ts`

**Status**: ⬜ Not started

**Test Count**: 0/3 passing

**Coverage**: 0%

---

## Overview

Agent SDK skill that updates an existing recipe.

**Tool signature**:
```typescript
recipe.update.execute({
  recipe_id: string,
  title?: string,
  ingredients?: Ingredient[],
  instructions?: string,
  tags?: string[],
  rating?: number,
  notes?: string,
}, context)
```

---

## Test Case 1: Update recipe title

**Status**: ⬜

**Given**:
```typescript
const recipeId = await createRecipe({
  title: 'Chicken Curry',
  ingredients: [{ name: 'chicken', quantity: 1, unit: 'lb' }],
});
```

**When**:
```typescript
const result = await recipe.update.execute({
  recipe_id: recipeId,
  title: 'Spicy Chicken Curry',
}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(true);

const { data: recipe } = await supabase
  .from('recipes')
  .select('*')
  .eq('id', recipeId)
  .single();

expect(recipe.title).toBe('Spicy Chicken Curry');
expect(recipe.ingredients).toHaveLength(1); // Unchanged
```

---

## Test Case 2: Update non-existent recipe

**Status**: ⬜

**Given**:
```typescript
const nonExistentId = 'non-existent-uuid';
```

**When**:
```typescript
const result = await recipe.update.execute({
  recipe_id: nonExistentId,
  title: 'New Title',
}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(false);
expect(result.error.type).toBe('NOT_FOUND');
expect(result.error.message).toContain('Recipe not found');
```

---

## Test Case 3: Cannot update recipe from different household

**Status**: ⬜

**Given**:
```typescript
// Recipe in household_A
const recipeId = await createRecipeInHousehold('household-A', 'Recipe A');
```

**When**:
```typescript
// User from household_B tries to update
const result = await recipe.update.execute({
  recipe_id: recipeId,
  title: 'Hacked Title',
}, { userId: userBId, householdId: 'household-B' });
```

**Then**:
```typescript
expect(result.success).toBe(false);
expect(result.error.type).toBe('PERMISSION_DENIED');
```

---

## Tool Schema

```typescript
export const UpdateRecipeSchema = z.object({
  recipe_id: z.string().uuid(),
  title: z.string().min(1).max(100).optional(),
  ingredients: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().positive(),
    unit: z.string(),
    prep_state: z.string().optional(),
  })).optional(),
  instructions: z.string().optional(),
  tags: z.array(z.string()).optional(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
});
```

---

## Progress Tracking

- [ ] Test Case 1: Update title
- [ ] Test Case 2: Not found error
- [ ] Test Case 3: Permission denied

**When all 3 pass**: Update [../README.md](../README.md) status to ✅
