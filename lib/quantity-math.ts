/**
 * Quantity Math Module
 *
 * Pure functions for quantity arithmetic operations.
 * No external dependencies.
 */

export interface Quantity {
  value: number;
  unit: string;
}

/**
 * Adds two quantities with the same unit.
 * Throws error if units differ or quantities are invalid.
 */
export function addQuantities(q1: Quantity, q2: Quantity): Quantity {
  // Validate both quantities are non-negative
  if (!isValidQuantity(q1) || !isValidQuantity(q2)) {
    throw new Error('Quantities must be non-negative');
  }

  // Validate units match
  if (q1.unit !== q2.unit) {
    throw new Error('Cannot add quantities with different units');
  }

  // Add values and round to 2 decimal places to avoid floating point precision issues
  const sum = parseFloat((q1.value + q2.value).toFixed(2));

  return {
    value: sum,
    unit: q1.unit,
  };
}

/**
 * Validates if a quantity is valid (non-negative).
 */
export function isValidQuantity(q: Quantity): boolean {
  return q.value >= 0;
}

/**
 * Multiplies a quantity by a factor.
 */
export function multiplyQuantity(q: Quantity, factor: number): Quantity {
  throw new Error('Not implemented');
}

/**
 * Compares two quantities with the same unit.
 * Returns -1 if q1 < q2, 0 if equal, 1 if q1 > q2.
 */
export function compareQuantities(q1: Quantity, q2: Quantity): number {
  throw new Error('Not implemented');
}
