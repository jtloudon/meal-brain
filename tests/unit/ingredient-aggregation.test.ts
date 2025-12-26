import { describe, it, expect } from 'vitest';
import {
  shouldMerge,
  mergeIngredients,
  aggregateIngredients,
  aggregateWithSources,
  type Ingredient,
} from '@/lib/ingredient-aggregation';

describe('Ingredient Aggregation', () => {
  describe('Test Case 1: Merge ingredients with exact match', () => {
    it('should merge ingredients with same id, unit, and prep_state', () => {
      const existing: Ingredient = {
        ingredient_id: 'rice-123',
        quantity: 1,
        unit: 'cup',
        prep_state: null,
      };

      const incoming: Ingredient = {
        ingredient_id: 'rice-123',
        quantity: 0.5,
        unit: 'cup',
        prep_state: null,
      };

      const canMerge = shouldMerge(existing, incoming);
      const result = mergeIngredients(existing, incoming);

      expect(canMerge).toBe(true);
      expect(result).toEqual({
        ingredient_id: 'rice-123',
        quantity: 1.5,
        unit: 'cup',
        prep_state: null,
      });
    });
  });

  describe('Test Case 2: Do not merge when units differ', () => {
    it('should not merge ingredients with different units', () => {
      const existing: Ingredient = {
        ingredient_id: 'chicken-456',
        quantity: 1,
        unit: 'lb',
      };

      const incoming: Ingredient = {
        ingredient_id: 'chicken-456',
        quantity: 500,
        unit: 'g',
      };

      const canMerge = shouldMerge(existing, incoming);

      expect(canMerge).toBe(false);
    });
  });

  describe('Test Case 3: Do not merge when prep_state differs', () => {
    it('should not merge ingredients with different prep_state', () => {
      const existing: Ingredient = {
        ingredient_id: 'onion-789',
        quantity: 1,
        unit: 'whole',
        prep_state: null,
      };

      const incoming: Ingredient = {
        ingredient_id: 'onion-789',
        quantity: 1,
        unit: 'whole',
        prep_state: 'chopped',
      };

      const canMerge = shouldMerge(existing, incoming);

      expect(canMerge).toBe(false);
    });
  });

  describe('Test Case 4: Aggregate multiple ingredients', () => {
    it('should aggregate multiple ingredients into distinct groups', () => {
      const ingredients: Ingredient[] = [
        { ingredient_id: 'rice-123', quantity: 1, unit: 'cup' },
        { ingredient_id: 'rice-123', quantity: 0.5, unit: 'cup' },
        { ingredient_id: 'rice-123', quantity: 1.75, unit: 'cup' },
        { ingredient_id: 'chicken-456', quantity: 1, unit: 'lb' },
      ];

      const result = aggregateIngredients(ingredients);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        ingredient_id: 'rice-123',
        quantity: 3.25,
        unit: 'cup',
      });
      expect(result[1]).toEqual({
        ingredient_id: 'chicken-456',
        quantity: 1,
        unit: 'lb',
      });
    });
  });

  describe('Test Case 5: Preserve source traceability', () => {
    it('should track which recipes contributed to aggregated ingredients', () => {
      const ingredients: Ingredient[] = [
        {
          ingredient_id: 'rice-123',
          quantity: 1,
          unit: 'cup',
          source_recipe_id: 'recipe-A',
        },
        {
          ingredient_id: 'rice-123',
          quantity: 0.5,
          unit: 'cup',
          source_recipe_id: 'recipe-B',
        },
      ];

      const result = aggregateWithSources(ingredients);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        ingredient_id: 'rice-123',
        total_quantity: 1.5,
        unit: 'cup',
        sources: [
          { recipe_id: 'recipe-A', quantity: 1 },
          { recipe_id: 'recipe-B', quantity: 0.5 },
        ],
      });
    });
  });

  describe('Test Case 6: Handle empty array', () => {
    it('should return empty array for empty input', () => {
      const ingredients: Ingredient[] = [];

      const result = aggregateIngredients(ingredients);

      expect(result).toEqual([]);
    });
  });
});
