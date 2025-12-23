# Tool Test: grocery.create_list

**Module**: `backend/tools/grocery.ts`

**Status**: ⬜ Not started

**Test Count**: 0/2 passing

**Coverage**: 0%

---

## Overview

Agent SDK skill that creates a new grocery list for a household.

**Tool signature**:
```typescript
grocery.create_list.execute({
  name: string,
}, context)
```

---

## Test Case 1: Create list with valid name

**Status**: ⬜

**Given**:
```typescript
const listName = 'Weekly Groceries';
```

**When**:
```typescript
const result = await grocery.create_list.execute({
  name: listName,
}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(true);
expect(result.data.grocery_list_id).toBeDefined();

const { data: list } = await supabase
  .from('grocery_lists')
  .select('*')
  .eq('id', result.data.grocery_list_id)
  .single();

expect(list.name).toBe(listName);
expect(list.household_id).toBe(householdId);
```

---

## Test Case 2: Reject duplicate list name (within household)

**Status**: ⬜

**Given**:
```typescript
// Create first list
await grocery.create_list.execute({
  name: 'Weekly Groceries',
}, { userId, householdId });
```

**When**:
```typescript
// Try to create another with same name
const result = await grocery.create_list.execute({
  name: 'Weekly Groceries',
}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(false);
expect(result.error.type).toBe('VALIDATION_ERROR');
expect(result.error.message).toContain('already exists');
```

---

## Tool Schema

```typescript
export const CreateListSchema = z.object({
  name: z.string().min(1).max(50),
});
```

---

## Progress Tracking

- [ ] Test Case 1: Valid creation
- [ ] Test Case 2: Duplicate name error

**When all 2 pass**: Update [../README.md](../README.md) status to ✅
