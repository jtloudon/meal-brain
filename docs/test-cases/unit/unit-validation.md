# Unit Tests: Unit Validation

**Module**: `lib/unit-validation.ts`

**Status**: ⬜ Not started

**Test Count**: 0/4 passing

**Coverage**: 0%

---

## Overview

Pure functions for validating and normalizing measurement units.

**Functions to test**:
- `isValidUnit(unit: string): boolean`
- `normalizeUnit(unit: string): string`
- `getValidUnits(): string[]`
- `getUnitsByCategory(): Record<string, string[]>`

---

## Test Case 1: Accept valid units

**Status**: ⬜

**Given**:
```typescript
const validUnits = ['cup', 'tbsp', 'tsp', 'lb', 'oz', 'g', 'kg', 'whole', 'ml', 'l'];
```

**When/Then**:
```typescript
validUnits.forEach(unit => {
  expect(isValidUnit(unit)).toBe(true);
});
```

---

## Test Case 2: Reject invalid units

**Status**: ⬜

**Given**:
```typescript
const invalidUnits = ['handfuls', 'pinch', 'to taste', 'some', ''];
```

**When/Then**:
```typescript
invalidUnits.forEach(unit => {
  expect(isValidUnit(unit)).toBe(false);
});
```

---

## Test Case 3: Normalize unit casing

**Status**: ⬜

**Given**:
```typescript
const testCases = [
  { input: 'CUP', expected: 'cup' },
  { input: 'Tbsp', expected: 'tbsp' },
  { input: 'LB', expected: 'lb' },
  { input: 'WHOLE', expected: 'whole' },
];
```

**When/Then**:
```typescript
testCases.forEach(({ input, expected }) => {
  expect(normalizeUnit(input)).toBe(expected);
});
```

---

## Test Case 4: List all valid units by category

**Status**: ⬜

**When**:
```typescript
const units = getUnitsByCategory();
```

**Then**:
```typescript
expect(units).toEqual({
  volume: ['cup', 'tbsp', 'tsp', 'ml', 'l', 'fl oz'],
  weight: ['lb', 'oz', 'g', 'kg'],
  count: ['whole', 'piece', 'can', 'package', 'bunch'],
});
```

---

## Implementation Skeleton

```typescript
// lib/unit-validation.ts

const VALID_UNITS = {
  volume: ['cup', 'tbsp', 'tsp', 'ml', 'l', 'fl oz'],
  weight: ['lb', 'oz', 'g', 'kg'],
  count: ['whole', 'piece', 'can', 'package', 'bunch'],
} as const;

export function isValidUnit(unit: string): boolean {
  const normalized = normalizeUnit(unit);
  return getValidUnits().includes(normalized);
}

export function normalizeUnit(unit: string): string {
  return unit.toLowerCase().trim();
}

export function getValidUnits(): string[] {
  return Object.values(VALID_UNITS).flat();
}

export function getUnitsByCategory(): Record<string, string[]> {
  return VALID_UNITS;
}
```

---

## Progress Tracking

- [ ] Test Case 1: Accept valid units
- [ ] Test Case 2: Reject invalid units
- [ ] Test Case 3: Normalize casing
- [ ] Test Case 4: List by category

**When all 4 pass**: Update [../README.md](../README.md) status to ✅
