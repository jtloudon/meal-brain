# Tool Test: grocery.check_item

**Module**: `lib/tools/grocery.ts`

**Status**: ✅ Complete

**Test Count**: 2/2 passing

**Coverage**: 100%

---

## Overview

Agent SDK skill that toggles the checked state of a grocery item.

**Tool signature**:
```typescript
grocery.check_item.execute({
  grocery_item_id: string,
  checked: boolean,
}, context)
```

---

## Test Case 1: Check an unchecked item

**Status**: ✅

**Given**:
```typescript
// Create list and add item
const listResult = await grocery.create_list.execute({
  name: 'Test List',
}, { userId, householdId });

const itemResult = await grocery.add_item.execute({
  grocery_list_id: listResult.data.grocery_list_id,
  name: 'Milk',
  quantity: 1,
  unit: 'gallon',
}, { userId, householdId });

const itemId = itemResult.data.grocery_item_id;
```

**When**:
```typescript
const result = await grocery.check_item.execute({
  grocery_item_id: itemId,
  checked: true,
}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(true);
expect(result.data.checked).toBe(true);

const { data: item } = await supabase
  .from('grocery_items')
  .select('checked')
  .eq('id', itemId)
  .single();

expect(item.checked).toBe(true);
```

---

## Test Case 2: Item not found error

**Status**: ✅

**Given**:
```typescript
const fakeItemId = '00000000-0000-0000-0000-000000000000';
```

**When**:
```typescript
const result = await grocery.check_item.execute({
  grocery_item_id: fakeItemId,
  checked: true,
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
export const CheckItemSchema = z.object({
  grocery_item_id: z.string().uuid(),
  checked: z.boolean(),
});
```

---

## Progress Tracking

- [x] Test Case 1: Check item
- [x] Test Case 2: Item not found error

**When all 2 pass**: Update [../README.md](../README.md) status to ✅
