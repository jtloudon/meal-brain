# Tool Test: grocery.get_list

**Module**: `lib/tools/grocery.ts`

**Status**: ✅ Complete

**Test Count**: 3/3 passing

**Coverage**: 100%

---

## Overview

Agent SDK skill that gets a single grocery list with all items (read-only).

**Tool signature**:
```typescript
grocery.get_list.execute({
  grocery_list_id: string,
}, context)
```

---

## Test Case 1: Get list with items

**Status**: ✅

**Given**:
```typescript
// Create list and add items
const listResult = await grocery.create_list.execute({
  name: 'Test List',
}, { userId, householdId });

const listId = listResult.data.grocery_list_id;

await grocery.add_item.execute({
  grocery_list_id: listId,
  name: 'Milk',
  quantity: 1,
  unit: 'gallon',
}, { userId, householdId });

await grocery.add_item.execute({
  grocery_list_id: listId,
  name: 'Eggs',
  quantity: 12,
  unit: 'whole',
}, { userId, householdId });
```

**When**:
```typescript
const result = await grocery.get_list.execute({
  grocery_list_id: listId,
}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(true);
expect(result.data.id).toBe(listId);
expect(result.data.name).toBe('Test List');
expect(result.data.items).toHaveLength(2);

// Check items have required fields
result.data.items.forEach(item => {
  expect(item.id).toBeDefined();
  expect(item.display_name).toBeDefined();
  expect(item.quantity).toBeDefined();
  expect(item.unit).toBeDefined();
  expect(item.checked).toBeDefined();
});
```

---

## Test Case 2: Get empty list (no items)

**Status**: ✅

**Given**:
```typescript
// Create list without items
const listResult = await grocery.create_list.execute({
  name: 'Empty List',
}, { userId, householdId });
```

**When**:
```typescript
const result = await grocery.get_list.execute({
  grocery_list_id: listResult.data.grocery_list_id,
}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(true);
expect(result.data.items).toEqual([]);
```

---

## Test Case 3: List not found error

**Status**: ✅

**Given**:
```typescript
const fakeListId = '00000000-0000-0000-0000-000000000000';
```

**When**:
```typescript
const result = await grocery.get_list.execute({
  grocery_list_id: fakeListId,
}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(false);
expect(result.error.type).toBe('NOT_FOUND');
expect(result.error.message).toContain('not found');
```

---

## Tool Schema

```typescript
export const GetListSchema = z.object({
  grocery_list_id: z.string().uuid(),
});
```

---

## Progress Tracking

- [x] Test Case 1: Get list with items
- [x] Test Case 2: Get empty list
- [x] Test Case 3: List not found error

**When all 3 pass**: Update [../README.md](../README.md) status to ✅
