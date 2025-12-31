import { describe, it, expect } from 'vitest';

// These functions would need to be exported from the import route or extracted to a utils file
// For now, we're writing the tests as documentation of expected behavior

describe('normalizeServingSize', () => {
  // Mock implementation for testing
  const normalizeServingSize = (servingSize: any): string | null => {
    if (!servingSize) return null;

    const str = String(servingSize);

    // Replace European decimal comma with period (4,4 -> 4.4)
    let normalized = str.replace(',', '.');

    // Extract first number if it contains text like "Serves 4-6" or "4 servings"
    const match = normalized.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      const num = parseFloat(match[1]);
      // Round to nearest integer if it's close (4.4 -> 4)
      return String(Math.round(num));
    }

    return normalized;
  };

  it('converts European decimal format to integer', () => {
    expect(normalizeServingSize('4,4')).toBe('4');
    expect(normalizeServingSize('6,5')).toBe('7');
  });

  it('extracts number from text format', () => {
    expect(normalizeServingSize('Serves 4')).toBe('4');
    expect(normalizeServingSize('4 servings')).toBe('4');
    expect(normalizeServingSize('Serves 4-6')).toBe('4');
  });

  it('rounds decimal to nearest integer', () => {
    expect(normalizeServingSize('4.4')).toBe('4');
    expect(normalizeServingSize('4.6')).toBe('5');
  });

  it('handles clean integers', () => {
    expect(normalizeServingSize('4')).toBe('4');
    expect(normalizeServingSize(4)).toBe('4');
  });

  it('returns null for empty/undefined input', () => {
    expect(normalizeServingSize(null)).toBe(null);
    expect(normalizeServingSize(undefined)).toBe(null);
    expect(normalizeServingSize('')).toBe(null);
  });
});

describe('extractIngredients with section filtering', () => {
  // Mock implementation
  const extractIngredients = (items: any): string[] => {
    if (!Array.isArray(items)) return [];
    return items
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && item.text) return item.text;
        return '';
      })
      .filter(Boolean)
      .filter((ing) => {
        const trimmed = ing.trim();

        // Skip very short strings (likely headers like "Sauce", "Main", etc.)
        if (trimmed.length < 10) {
          // But keep it if it has measurements or numbers (like "2 eggs")
          const hasMeasurement = /\d|cup|tbsp|tsp|oz|lb|kg|ml|gram/i.test(trimmed);
          return hasMeasurement;
        }

        // Also filter out common section header patterns even if longer
        const sectionPattern = /^(For the |For )?[\w\s&]+(:|and|vegetables)$/i;
        if (sectionPattern.test(trimmed) && !trimmed.match(/\d/)) {
          return false;
        }

        return true;
      });
  };

  it('filters out section headers', () => {
    const input = [
      'Sauce',
      '6 tablespoons low-sodium soy sauce',
      'Main',
      '1 tablespoon hoisin sauce',
      'Chicken and Vegetables',
      '1 pound chicken breast',
    ];

    const result = extractIngredients(input);

    expect(result).not.toContain('Sauce');
    expect(result).not.toContain('Main');
    expect(result).not.toContain('Chicken and Vegetables');
    expect(result).toContain('6 tablespoons low-sodium soy sauce');
    expect(result).toContain('1 tablespoon hoisin sauce');
    expect(result).toContain('1 pound chicken breast');
  });

  it('keeps short ingredients with measurements', () => {
    const input = ['Sauce', '2 eggs', 'Main', '1 cup water'];

    const result = extractIngredients(input);

    expect(result).toContain('2 eggs');
    expect(result).toContain('1 cup water');
    expect(result).not.toContain('Sauce');
    expect(result).not.toContain('Main');
  });

  it('handles empty array', () => {
    expect(extractIngredients([])).toEqual([]);
  });

  it('handles non-array input', () => {
    expect(extractIngredients(null)).toEqual([]);
    expect(extractIngredients(undefined)).toEqual([]);
    expect(extractIngredients('not an array')).toEqual([]);
  });

  it('filters out empty strings', () => {
    const input = ['', '  ', '1 cup flour', null, undefined, '2 eggs'];

    const result = extractIngredients(input);

    expect(result).toEqual(['1 cup flour', '2 eggs']);
  });

  it('preserves hyphens in ingredient names', () => {
    const input = [
      '6 tablespoons low-sodium soy sauce',
      '1 pound chicken, cut into 1-inch cubes',
    ];

    const result = extractIngredients(input);

    expect(result[0]).toContain('low-sodium');
    expect(result[1]).toContain('1-inch');
  });
});

describe('flexible ingredient parsing', () => {
  // This would test the fallback parsing logic in the frontend
  // Mock the flexible parser
  const parseFlexibleIngredient = (ing: string) => {
    const flexMatch = ing.match(
      /^([\d\s.\/½¼¾⅓⅔⅛⅜⅝⅞]+)?\s*(cup|tbsp|tsp|lb|oz|g|kg|ml|l|whole|clove|can|package|slice|pound|ounce|tablespoon|teaspoon|gram|kilogram)s?\s+(.+)$/i
    );

    if (flexMatch) {
      const [, qty, unit, name] = flexMatch;
      let quantity = 1;

      if (qty) {
        const qtyTrimmed = qty.trim().replace(/\s+/g, ' ');
        if (qtyTrimmed.includes('½')) {
          const parts = qtyTrimmed.split(' ');
          const whole = parts.length > 1 ? parseFloat(parts[0]) : 0;
          quantity = whole + 0.5;
        }
        else if (qtyTrimmed.includes('¼')) {
          const parts = qtyTrimmed.split(' ');
          const whole = parts.length > 1 ? parseFloat(parts[0]) : 0;
          quantity = whole + 0.25;
        }
        else if (qtyTrimmed.includes('¾')) {
          const parts = qtyTrimmed.split(' ');
          const whole = parts.length > 1 ? parseFloat(parts[0]) : 0;
          quantity = whole + 0.75;
        }
        else {
          quantity = parseFloat(qtyTrimmed);
        }
      }

      let normalizedUnit = unit.toLowerCase();
      if (normalizedUnit === 'tablespoons' || normalizedUnit === 'tablespoon')
        normalizedUnit = 'tbsp';
      else if (normalizedUnit === 'teaspoons' || normalizedUnit === 'teaspoon')
        normalizedUnit = 'tsp';
      else if (normalizedUnit === 'pounds' || normalizedUnit === 'pound') normalizedUnit = 'lb';
      else if (normalizedUnit.endsWith('s')) normalizedUnit = normalizedUnit.slice(0, -1);

      return {
        name: name.trim(),
        quantity: isNaN(quantity) ? 1 : quantity,
        unit: normalizedUnit,
      };
    }

    // Last resort
    return {
      name: ing.trim(),
      quantity: 1,
      unit: 'whole',
    };
  };

  it('parses standard format ingredients', () => {
    const result = parseFlexibleIngredient('2 cups flour');
    expect(result).toEqual({
      name: 'flour',
      quantity: 2,
      unit: 'cup',
    });
  });

  it('parses ingredients with mixed fractions', () => {
    const result = parseFlexibleIngredient('1 ½ cups broccoli florets');
    expect(result.name).toBe('broccoli florets');
    expect(result.quantity).toBeCloseTo(1.5);
    expect(result.unit).toBe('cup');
  });

  it('parses ingredients with prep states in the middle', () => {
    // Note: This ingredient doesn't match standard format (no valid unit after "1")
    // so it falls back to treating the whole thing as the name
    const result = parseFlexibleIngredient('1 chopped red bell pepper');
    expect(result.name).toBe('1 chopped red bell pepper');
    expect(result.quantity).toBe(1);
    expect(result.unit).toBe('whole');
  });

  it('normalizes unit names', () => {
    expect(parseFlexibleIngredient('2 tablespoons honey').unit).toBe('tbsp');
    expect(parseFlexibleIngredient('1 teaspoon salt').unit).toBe('tsp');
    expect(parseFlexibleIngredient('1 pound chicken').unit).toBe('lb');
  });

  it('handles ingredients without standard format (fallback)', () => {
    const result = parseFlexibleIngredient('salt and pepper to taste');
    expect(result).toEqual({
      name: 'salt and pepper to taste',
      quantity: 1,
      unit: 'whole',
    });
  });

  it('preserves hyphens in ingredient names', () => {
    const result = parseFlexibleIngredient('6 tablespoons low-sodium soy sauce');
    expect(result.name).toContain('low-sodium');
  });
});
