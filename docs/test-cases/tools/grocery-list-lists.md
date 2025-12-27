# Tool Test: grocery.list_lists

**Module**: `lib/tools/grocery.ts`

**Status**: ✅ Complete

**Test Count**: 2/2 passing

**Coverage**: 100%

---

## Overview

Agent SDK skill that lists all grocery lists for a household (read-only).

**Tool signature**:
```typescript
grocery.list_lists.execute({}, context)
```

---

## Test Case 1: List all grocery lists for household

**Status**: ✅

**Given**:
```typescript
// Create 3 lists
await grocery.create_list.execute({ name: 'Weekly' }, { userId, householdId });
await grocery.create_list.execute({ name: 'Monthly' }, { userId, householdId });
await grocery.create_list.execute({ name: 'Party' }, { userId, householdId });
```

**When**:
```typescript
const result = await grocery.list_lists.execute({}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(true);
expect(result.data.lists).toHaveLength(3);
expect(result.data.lists.map(l => l.name)).toContain('Weekly');
expect(result.data.lists.map(l => l.name)).toContain('Monthly');
expect(result.data.lists.map(l => l.name)).toContain('Party');

// Each list should have basic metadata
result.data.lists.forEach(list => {
  expect(list.id).toBeDefined();
  expect(list.name).toBeDefined();
  expect(list.created_at).toBeDefined();
});
```

---

## Test Case 2: Return empty array when no lists exist

**Status**: ✅

**Given**:
```typescript
// Clean database, no lists created
```

**When**:
```typescript
const result = await grocery.list_lists.execute({}, { userId, householdId });
```

**Then**:
```typescript
expect(result.success).toBe(true);
expect(result.data.lists).toEqual([]);
```

---

## Tool Schema

```typescript
export const ListListsSchema = z.object({});
```

---

## Progress Tracking

- [x] Test Case 1: List all lists
- [x] Test Case 2: Empty array when none exist

**When all 2 pass**: Update [../README.md](../README.md) status to ✅
