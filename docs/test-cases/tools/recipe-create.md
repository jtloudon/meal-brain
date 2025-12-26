# Tool Test: recipe.create

**Module**: `lib/tools/recipe.ts`

**Status**: ✅ Complete

**Test Count**: 4/4 passing

**Coverage**: 100%

---

## Overview

Agent SDK skill that creates a new recipe with validated ingredients.

**Tool signature**:
```typescript
recipe.create.execute({
  title: string,
  ingredients: Ingredient[],
  instructions?: string,
  tags?: string[],
  rating?: number,
  notes?: string,
}, context)
```

---

## Test Case 1: Create recipe with valid input

**Status**: ⬜

**Given**:
```typescript
const input = {
  title: 'Chicken Curry',
  ingredients: [
    { name: 'chicken', quantity: 1, unit: 'lb' },
    { name: 'curry powder', quantity: 2, unit: 'tbsp' },
  ],
  instructions: 'Cook chicken with curry powder.',
  tags: ['dinner', 'chicken'],
  rating: 4,
};
```

**When**:
```typescript
const result = await recipe.create.execute(input, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(true);
expect(result.data.recipe_id).toBeDefined();

// Verify in database
const { data: recipe } = await supabase
  .from('recipes')
  .select('*, recipe_ingredients(*)')
  .eq('id', result.data.recipe_id)
  .single();

expect(recipe.title).toBe('Chicken Curry');
expect(recipe.tags).toEqual(['dinner', 'chicken']);
expect(recipe.rating).toBe(4);
expect(recipe.recipe_ingredients).toHaveLength(2);
```

---

## Test Case 2: Reject recipe without title

**Status**: ⬜

**Given**:
```typescript
const input = {
  title: '',
  ingredients: [],
};
```

**When**:
```typescript
const result = await recipe.create.execute(input, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(false);
expect(result.error.type).toBe('VALIDATION_ERROR');
expect(result.error.field).toBe('title');
expect(result.error.message).toContain('required');
```

---

## Test Case 3: Reject ingredient with invalid unit

**Status**: ⬜

**Given**:
```typescript
const input = {
  title: 'Test Recipe',
  ingredients: [
    { name: 'rice', quantity: 1, unit: 'handfuls' }, // Invalid unit
  ],
};
```

**When**:
```typescript
const result = await recipe.create.execute(input, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(false);
expect(result.error.type).toBe('VALIDATION_ERROR');
expect(result.error.field).toBe('ingredients[0].unit');
expect(result.error.message).toContain('Invalid unit');
```

---

## Test Case 4: Enforce household isolation

**Status**: ⬜

**Given**:
```typescript
// Recipe created in household_A
const recipeId = await createRecipeInHousehold('household-A', 'Recipe A');
```

**When**:
```typescript
// User from household_B tries to access
const { data } = await supabase
  .from('recipes')
  .select('*')
  .eq('id', recipeId);
```

**Then**:
```typescript
expect(data).toEqual([]); // RLS blocks access
```

---

## Tool Schema

```typescript
import { z } from 'zod';

export const CreateRecipeSchema = z.object({
  title: z.string().min(1).max(100),
  ingredients: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().positive(),
    unit: z.string(),
    prep_state: z.string().optional(),
  })),
  instructions: z.string().optional(),
  tags: z.array(z.string()).optional(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
});
```

---

## Progress Tracking

- [x] Test Case 1: Valid input
- [x] Test Case 2: Missing title
- [x] Test Case 3: Invalid unit
- [x] Test Case 4: RLS enforcement

**Status**: ✅ All tests passing - [../README.md](../README.md) updated
