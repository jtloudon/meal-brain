# Tool Test: grocery.add_item

**Module**: `backend/tools/grocery.ts`

**Status**: ⬜ Not started

**Test Count**: 0/2 passing

**Coverage**: 0%

---

## Overview

Agent SDK skill that manually adds a single item to a grocery list.

**Tool signature**:
```typescript
grocery.add_item.execute({
  grocery_list_id: string,
  name: string,
  quantity: number,
  unit: string,
  ingredient_id?: string,
}, context)
```

---

## Test Case 1: Add item to list

**Status**: ⬜

**Given**:
```typescript
const listId = await createGroceryList('Weekly Groceries');
```

**When**:
```typescript
const result = await grocery.add_item.execute({
  grocery_list_id: listId,
  name: 'milk',
  quantity: 1,
  unit: 'gallon',
}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(true);
expect(result.data.grocery_item_id).toBeDefined();

const { data: item } = await supabase
  .from('grocery_items')
  .select('*')
  .eq('id', result.data.grocery_item_id)
  .single();

expect(item.name).toBe('milk');
expect(item.quantity).toBe(1);
expect(item.unit).toBe('gallon');
expect(item.checked).toBe(false); // Default unchecked
```

---

## Test Case 2: Reject invalid unit

**Status**: ⬜

**Given**:
```typescript
const listId = await createGroceryList('Weekly Groceries');
```

**When**:
```typescript
const result = await grocery.add_item.execute({
  grocery_list_id: listId,
  name: 'sugar',
  quantity: 1,
  unit: 'handfuls', // Invalid unit
}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(false);
expect(result.error.type).toBe('VALIDATION_ERROR');
expect(result.error.field).toBe('unit');
```

---

## Tool Schema

```typescript
export const AddItemSchema = z.object({
  grocery_list_id: z.string().uuid(),
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string(),
  ingredient_id: z.string().optional(),
});
```

---

## Progress Tracking

- [ ] Test Case 1: Add item
- [ ] Test Case 2: Invalid unit

**When all 2 pass**: Update [../README.md](../README.md) status to ✅
