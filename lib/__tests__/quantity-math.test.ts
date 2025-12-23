import { describe, it, expect } from 'vitest';
import { addQuantities, isValidQuantity, type Quantity } from '../quantity-math';

describe('Quantity Math', () => {
  describe('addQuantities', () => {
    // Test Case 1: Add quantities with same unit
    it('adds quantities with same unit', () => {
      const quantity1: Quantity = { value: 1.5, unit: 'cup' };
      const quantity2: Quantity = { value: 0.5, unit: 'cup' };

      const result = addQuantities(quantity1, quantity2);

      expect(result).toEqual({ value: 2.0, unit: 'cup' });
    });

    // Test Case 2: Add quantities with different units throws error
    it('throws error when units differ', () => {
      const quantity1: Quantity = { value: 1, unit: 'cup' };
      const quantity2: Quantity = { value: 500, unit: 'ml' };

      expect(() => addQuantities(quantity1, quantity2)).toThrow(
        'Cannot add quantities with different units'
      );
    });

    // Test Case 3: Handle decimal precision correctly
    it('handles decimal precision correctly', () => {
      const quantity1: Quantity = { value: 0.1, unit: 'cup' };
      const quantity2: Quantity = { value: 0.2, unit: 'cup' };

      const result = addQuantities(quantity1, quantity2);

      // Use toBeCloseTo to avoid floating point precision issues
      expect(result.value).toBeCloseTo(0.3, 2);
      expect(result.unit).toBe('cup');
    });

    // Test Case 4: Add handles zero quantities
    it('handles zero quantities', () => {
      const quantity1: Quantity = { value: 0, unit: 'cup' };
      const quantity2: Quantity = { value: 1.5, unit: 'cup' };

      const result = addQuantities(quantity1, quantity2);

      expect(result).toEqual({ value: 1.5, unit: 'cup' });
    });

    // Test Case 5: Reject negative quantities
    it('rejects negative quantities', () => {
      const quantity1: Quantity = { value: -1, unit: 'cup' };
      const quantity2: Quantity = { value: 1, unit: 'cup' };

      expect(() => addQuantities(quantity1, quantity2)).toThrow(
        'Quantities must be non-negative'
      );
    });
  });

  describe('isValidQuantity', () => {
    it('returns true for valid positive quantity', () => {
      const quantity: Quantity = { value: 1.5, unit: 'cup' };
      expect(isValidQuantity(quantity)).toBe(true);
    });

    it('returns true for zero quantity', () => {
      const quantity: Quantity = { value: 0, unit: 'cup' };
      expect(isValidQuantity(quantity)).toBe(true);
    });

    it('returns false for negative quantity', () => {
      const quantity: Quantity = { value: -1, unit: 'cup' };
      expect(isValidQuantity(quantity)).toBe(false);
    });
  });
});
