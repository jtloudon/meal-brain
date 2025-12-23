# Unit Tests: Quantity Math

**Module**: `lib/quantity-math.ts`

**Status**: ⬜ Not started

**Test Count**: 0/5 passing

**Coverage**: 0%

---

## Overview

Pure functions for quantity arithmetic operations. No external dependencies.

**Functions to test**:
- `addQuantities(q1, q2): Quantity`
- `subtractQuantities(q1, q2): Quantity`
- `multiplyQuantity(q, factor): Quantity`
- `compareQuantities(q1, q2): number`
- `isValidQuantity(q): boolean`

---

## Test Case 1: Add quantities with same unit

**Status**: ⬜

**Given**:
```typescript
const quantity1 = { value: 1.5, unit: 'cup' };
const quantity2 = { value: 0.5, unit: 'cup' };
```

**When**:
```typescript
const result = addQuantities(quantity1, quantity2);
```

**Then**:
```typescript
expect(result).toEqual({ value: 2.0, unit: 'cup' });
```

**Implementation hint**: Simple addition of values, preserve unit

---

## Test Case 2: Add quantities with different units throws error

**Status**: ⬜

**Given**:
```typescript
const quantity1 = { value: 1, unit: 'cup' };
const quantity2 = { value: 500, unit: 'ml' };
```

**When**:
```typescript
addQuantities(quantity1, quantity2);
```

**Then**:
```typescript
// Should throw Error
expect(() => addQuantities(quantity1, quantity2))
  .toThrow('Cannot add quantities with different units');
```

**Rationale**: Phase 1 does not support unit conversion

---

## Test Case 3: Handle decimal precision correctly

**Status**: ⬜

**Given**:
```typescript
const quantity1 = { value: 0.1, unit: 'cup' };
const quantity2 = { value: 0.2, unit: 'cup' };
```

**When**:
```typescript
const result = addQuantities(quantity1, quantity2);
```

**Then**:
```typescript
expect(result.value).toBeCloseTo(0.3, 2);
// or exact: expect(result.value).toBe(0.30000000000000004) is wrong
// Round to 2 decimals: expect(result.value).toBe(0.3)
```

**Implementation hint**: Use `parseFloat((q1.value + q2.value).toFixed(2))`

---

## Test Case 4: Add handles zero quantities

**Status**: ⬜

**Given**:
```typescript
const quantity1 = { value: 0, unit: 'cup' };
const quantity2 = { value: 1.5, unit: 'cup' };
```

**When**:
```typescript
const result = addQuantities(quantity1, quantity2);
```

**Then**:
```typescript
expect(result).toEqual({ value: 1.5, unit: 'cup' });
```

**Edge case**: Zero is a valid quantity

---

## Test Case 5: Reject negative quantities

**Status**: ⬜

**Given**:
```typescript
const quantity1 = { value: -1, unit: 'cup' };
const quantity2 = { value: 1, unit: 'cup' };
```

**When**:
```typescript
addQuantities(quantity1, quantity2);
```

**Then**:
```typescript
expect(() => addQuantities(quantity1, quantity2))
  .toThrow('Quantities must be non-negative');
```

**Rationale**: Negative quantities don't make sense in cooking

---

## Bonus Test Cases (Optional)

### Test Case 6: Multiply quantity by factor
```typescript
const quantity = { value: 1.5, unit: 'cup' };
const result = multiplyQuantity(quantity, 2);
expect(result).toEqual({ value: 3.0, unit: 'cup' });
```

### Test Case 7: Compare quantities (same unit)
```typescript
compareQuantities({ value: 1, unit: 'cup' }, { value: 2, unit: 'cup' });
// Returns: -1 (first is less)
```

---

## Implementation Skeleton

```typescript
// lib/quantity-math.ts

export interface Quantity {
  value: number;
  unit: string;
}

export function addQuantities(q1: Quantity, q2: Quantity): Quantity {
  // TODO: Implement
  throw new Error('Not implemented');
}

export function isValidQuantity(q: Quantity): boolean {
  // TODO: Implement
  return false;
}
```

---

## Test File Location

`lib/__tests__/quantity-math.test.ts` (or next to implementation)

```typescript
import { describe, it, expect } from 'vitest';
import { addQuantities, isValidQuantity } from '../quantity-math';

describe('Quantity Math', () => {
  describe('addQuantities', () => {
    it('adds quantities with same unit', () => {
      // Test Case 1 implementation
    });

    it('throws error when units differ', () => {
      // Test Case 2 implementation
    });

    // ... more tests
  });
});
```

---

## Progress Tracking

- [ ] Test Case 1: Add same unit
- [ ] Test Case 2: Different units error
- [ ] Test Case 3: Decimal precision
- [ ] Test Case 4: Zero quantities
- [ ] Test Case 5: Negative rejection

**When all 5 pass**: Update [../README.md](../README.md) status to ✅
