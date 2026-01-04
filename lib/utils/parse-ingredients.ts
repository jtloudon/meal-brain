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
  'fillet', 'fillets',
  'piece', 'pieces',
  'breast', 'breasts',
  'thigh', 'thighs',
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
  'fillets': 'fillet',
  'pieces': 'piece',
  'breasts': 'breast',
  'thighs': 'thigh',
};

export interface ParsedIngredient {
  name: string;
  quantity_min: number;
  quantity_max: number | null;
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

  let quantity_min = 0;
  let quantity_max: number | null = null;
  let remaining = trimmed;

  // 1. Extract quantity (number, fraction, or range at start)
  const quantityMatch = remaining.match(/^([\d.]+(?:-[\d.]+)?(?:\s*[\d/]*)?|[⅛¼⅓½⅔¾⅞])\s*/);
  if (quantityMatch) {
    const quantityStr = quantityMatch[1].trim();

    // Check if it's a range (e.g., "1-2" or "½-1")
    if (quantityStr.includes('-') && !quantityStr.includes('/')) {
      const [minStr, maxStr] = quantityStr.split('-').map(s => s.trim());

      // Parse min value (could be fraction or number)
      if (FRACTION_MAP[minStr]) {
        quantity_min = FRACTION_MAP[minStr];
      } else {
        quantity_min = parseFloat(minStr);
      }

      // Parse max value (could be fraction or number)
      if (FRACTION_MAP[maxStr]) {
        quantity_max = FRACTION_MAP[maxStr];
      } else {
        quantity_max = parseFloat(maxStr);
      }
    }
    // Check if it's a fraction symbol
    else if (FRACTION_MAP[quantityStr]) {
      quantity_min = FRACTION_MAP[quantityStr];
    }
    // Check if it's a mixed number (e.g., "1 1/2")
    else if (quantityStr.includes(' ')) {
      const parts = quantityStr.split(' ');
      const whole = parseFloat(parts[0]);
      const fraction = FRACTION_MAP[parts[1]] || 0;
      quantity_min = whole + fraction;
    }
    // Check if it's a fraction string (e.g., "1/2")
    else if (quantityStr.includes('/')) {
      quantity_min = FRACTION_MAP[quantityStr] || 0;
    }
    // Otherwise it's a decimal number
    else {
      quantity_min = parseFloat(quantityStr);
    }

    remaining = remaining.substring(quantityMatch[0].length).trim();
  }

  if (quantity_min === 0 || isNaN(quantity_min)) {
    // No valid quantity found
    return null;
  }

  // Validate max if it exists
  if (quantity_max !== null && (quantity_max === 0 || isNaN(quantity_max))) {
    // Invalid max value, treat as non-range
    quantity_max = null;
  }

  // 2. Extract unit (optional - defaults to "whole" if not found)
  let unit = 'whole';
  const unitPattern = new RegExp(`^(${VALID_UNITS.join('|')})\\s+`, 'i');
  const unitMatch = remaining.match(unitPattern);

  if (unitMatch) {
    unit = unitMatch[1].toLowerCase();
    // Normalize to singular form
    unit = UNIT_NORMALIZATION[unit] || unit;
    remaining = remaining.substring(unitMatch[0].length).trim();
  }
  // If no unit found, remaining is just the ingredient name (use "whole" as default)

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
    quantity_min,
    quantity_max,
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
  quantity_min: number;
  quantity_max: number | null;
  unit: string;
  prep_state?: string | null;
}>): string {
  return ingredients
    .map((ing) => {
      let line = '';

      // Helper function to format a single quantity value
      const formatQuantity = (qty: number): string => {
        if (qty === 0.125) return '⅛';
        else if (qty === 0.25) return '¼';
        else if (qty === 0.333) return '⅓';
        else if (qty === 0.5) return '½';
        else if (qty === 0.667) return '⅔';
        else if (qty === 0.75) return '¾';
        else if (qty === 0.875) return '⅞';
        else return qty.toString();
      };

      // Format quantity (single or range)
      if (ing.quantity_max !== null && ing.quantity_max !== undefined) {
        // Range: "1-2" or "½-1"
        line += `${formatQuantity(ing.quantity_min)}-${formatQuantity(ing.quantity_max)}`;
      } else {
        // Single quantity
        line += formatQuantity(ing.quantity_min);
      }

      line += ` ${ing.unit} ${ing.display_name}`;

      if (ing.prep_state) {
        line += `, ${ing.prep_state}`;
      }

      return line;
    })
    .join('\n');
}
