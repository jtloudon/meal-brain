# Tool Test: recipe.list

**Module**: `backend/tools/recipe.ts`

**Status**: ⬜ Not started

**Test Count**: 0/3 passing

**Coverage**: 0%

---

## Overview

Agent SDK skill that lists recipes with optional filtering.

**Tool signature**:
```typescript
recipe.list.execute({
  filters?: {
    tags?: string[],
    rating?: number,
    search?: string,
  },
  limit?: number,
  offset?: number,
}, context)
```

---

## Test Case 1: List all recipes (no filters)

**Status**: ⬜

**Given**:
```typescript
// Pre-seed 3 recipes in household
await seedRecipes([
  { title: 'Chicken Curry', tags: ['chicken', 'dinner'] },
  { title: 'Beef Tacos', tags: ['beef', 'dinner'] },
  { title: 'Pancakes', tags: ['breakfast'] },
]);
```

**When**:
```typescript
const result = await recipe.list.execute({}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(true);
expect(result.data.recipes).toHaveLength(3);
expect(result.data.total).toBe(3);
```

---

## Test Case 2: Filter by tags

**Status**: ⬜

**Given**:
```typescript
// Same 3 recipes as above
```

**When**:
```typescript
const result = await recipe.list.execute({
  filters: { tags: ['chicken'] },
}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(true);
expect(result.data.recipes).toHaveLength(1);
expect(result.data.recipes[0].title).toBe('Chicken Curry');
```

---

## Test Case 3: Search by title

**Status**: ⬜

**Given**:
```typescript
// Same 3 recipes as above
```

**When**:
```typescript
const result = await recipe.list.execute({
  filters: { search: 'taco' }, // Case-insensitive search
}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(true);
expect(result.data.recipes).toHaveLength(1);
expect(result.data.recipes[0].title).toBe('Beef Tacos');
```

---

## Tool Schema

```typescript
export const ListRecipesSchema = z.object({
  filters: z.object({
    tags: z.array(z.string()).optional(),
    rating: z.number().min(1).max(5).optional(),
    search: z.string().optional(),
  }).optional(),
  limit: z.number().positive().max(100).default(50),
  offset: z.number().nonnegative().default(0),
});
```

---

## Progress Tracking

- [ ] Test Case 1: List all
- [ ] Test Case 2: Filter by tags
- [ ] Test Case 3: Search by title

**When all 3 pass**: Update [../README.md](../README.md) status to ✅
