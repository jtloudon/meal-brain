/**
 * Parse ingredient lines from free-form text into structured format
 *
 * Examples:
 * - "¼ cup flour" → { quantity: 0.25, unit: "cup", name: "flour" }
 * - "2 tbsp vanilla extract" → { quantity: 2, unit: "tbsp", name: "vanilla extract" }
 * - "1 whole onion, diced" → { quantity: 1, unit: "whole", name: "onion", prep_state: "diced" }
 */

const FRACTION_MAP: Record<string, number> = {
  '⅛': 0.125,
  '¼': 0.25,
  '⅓': 0.333,
  '½': 0.5,
  '⅔': 0.667,
  '¾': 0.75,
  '⅞': 0.875,
  '1/8': 0.125,
  '1/4': 0.25,
  '1/3': 0.333,
  '1/2': 0.5,
  '2/3': 0.667,
  '3/4': 0.75,
  '7/8': 0.875,
};

const VALID_UNITS = [
  'cup', 'cups',
  'tbsp', 'tablespoon', 'tablespoons',
  'tsp', 'teaspoon', 'teaspoons',
  'ml', 'milliliter', 'milliliters',
  'l', 'liter', 'liters',
  'fl oz', 'fluid ounce', 'fluid ounces',
  'lb', 'pound', 'pounds',
  'oz', 'ounce', 'ounces',
  'g', 'gram', 'grams',
  'kg', 'kilogram', 'kilograms',
  'whole',
  'clove', 'cloves',
  'can', 'cans',
  'package', 'packages',
  'slice', 'slices',
];

// Normalize plural units to singular
const UNIT_NORMALIZATION: Record<string, string> = {
  'cups': 'cup',
  'tablespoons': 'tbsp',
  'tablespoon': 'tbsp',
  'teaspoons': 'tsp',
  'teaspoon': 'tsp',
  'milliliters': 'ml',
  'milliliter': 'ml',
  'liters': 'l',
  'liter': 'l',
  'fluid ounces': 'fl oz',
  'fluid ounce': 'fl oz',
  'pounds': 'lb',
  'pound': 'lb',
  'ounces': 'oz',
  'ounce': 'oz',
  'grams': 'g',
  'gram': 'g',
  'kilograms': 'kg',
  'kilogram': 'kg',
  'cloves': 'clove',
  'cans': 'can',
  'packages': 'package',
  'slices': 'slice',
};

export interface ParsedIngredient {
  name: string;
  quantity: number;
  unit: string;
  prep_state?: string;
}

export function parseIngredientLine(line: string): ParsedIngredient | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Pattern: [quantity] [unit] [name] [, prep_state]
  // Examples:
  // "¼ cup flour"
  // "2 tbsp vanilla extract"
  // "1 whole onion, diced"

  let quantity = 0;
  let remaining = trimmed;

  // 1. Extract quantity (number or fraction at start)
  const quantityMatch = remaining.match(/^([\d.]+\s*[\d/]*|[⅛¼⅓½⅔¾⅞])\s*/);
  if (quantityMatch) {
    const quantityStr = quantityMatch[1].trim();

    // Check if it's a fraction symbol
    if (FRACTION_MAP[quantityStr]) {
      quantity = FRACTION_MAP[quantityStr];
    }
    // Check if it's a mixed number (e.g., "1 1/2")
    else if (quantityStr.includes(' ')) {
      const parts = quantityStr.split(' ');
      const whole = parseFloat(parts[0]);
      const fraction = FRACTION_MAP[parts[1]] || 0;
      quantity = whole + fraction;
    }
    // Check if it's a fraction string (e.g., "1/2")
    else if (quantityStr.includes('/')) {
      quantity = FRACTION_MAP[quantityStr] || 0;
    }
    // Otherwise it's a decimal number
    else {
      quantity = parseFloat(quantityStr);
    }

    remaining = remaining.substring(quantityMatch[0].length).trim();
  }

  if (quantity === 0 || isNaN(quantity)) {
    // No valid quantity found
    return null;
  }

  // 2. Extract unit (must match valid units)
  let unit = '';
  const unitPattern = new RegExp(`^(${VALID_UNITS.join('|')})\\s+`, 'i');
  const unitMatch = remaining.match(unitPattern);

  if (unitMatch) {
    unit = unitMatch[1].toLowerCase();
    // Normalize to singular form
    unit = UNIT_NORMALIZATION[unit] || unit;
    remaining = remaining.substring(unitMatch[0].length).trim();
  } else {
    // No valid unit found
    return null;
  }

  // 3. Split name and prep_state by comma
  let name = remaining;
  let prep_state: string | undefined = undefined;

  if (remaining.includes(',')) {
    const parts = remaining.split(',');
    name = parts[0].trim();
    prep_state = parts.slice(1).join(',').trim();
  }

  if (!name) {
    // No ingredient name found
    return null;
  }

  return {
    name,
    quantity,
    unit,
    prep_state,
  };
}

/**
 * Parse multiple ingredient lines (separated by newlines)
 */
export function parseIngredientsText(text: string): ParsedIngredient[] {
  const lines = text.split('\n');
  const parsed: ParsedIngredient[] = [];

  for (const line of lines) {
    const ingredient = parseIngredientLine(line);
    if (ingredient) {
      parsed.push(ingredient);
    }
  }

  return parsed;
}

/**
 * Convert structured ingredients back to free-form text (for editing)
 */
export function ingredientsToText(ingredients: Array<{
  display_name: string;
  quantity: number;
  unit: string;
  prep_state?: string | null;
}>): string {
  return ingredients
    .map((ing) => {
      let line = '';

      // Format quantity with fractions
      const qty = ing.quantity;
      if (qty === 0.125) line += '⅛';
      else if (qty === 0.25) line += '¼';
      else if (qty === 0.333) line += '⅓';
      else if (qty === 0.5) line += '½';
      else if (qty === 0.667) line += '⅔';
      else if (qty === 0.75) line += '¾';
      else if (qty === 0.875) line += '⅞';
      else line += qty.toString();

      line += ` ${ing.unit} ${ing.display_name}`;

      if (ing.prep_state) {
        line += `, ${ing.prep_state}`;
      }

      return line;
    })
    .join('\n');
}
