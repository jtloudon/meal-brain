import { supabase } from '@/lib/db/supabase';

/**
 * Get user preferences for the household
 * Read-only tool to fetch dietary constraints, AI style, household context, etc.
 */
export async function getUserPreferences(
  input: Record<string, never>, // No input parameters needed
  context: { householdId: string }
): Promise<{
  household_context: string | null;
  dietary_constraints: string[];
  ai_style: string | null;
  planning_preferences: string[];
  ai_learning_enabled: boolean;
  shopping_categories: any;
  meal_courses: any;
  default_grocery_list_id: string | null;
  theme_color: string;
}> {
  const { householdId } = context;

  // Get household-level preferences (dietary, AI style, planning, etc.)
  const { data: householdPrefs, error: householdError } = await supabase
    .from('household_preferences')
    .select('*')
    .eq('household_id', householdId)
    .maybeSingle();

  if (householdError) {
    throw new Error(`Failed to fetch household preferences: ${householdError.message}`);
  }

  if (!householdPrefs) {
    // Return defaults if no preferences exist
    return {
      household_context: null,
      dietary_constraints: [],
      ai_style: null,
      planning_preferences: [],
      ai_learning_enabled: true,
      shopping_categories: [
        'Produce',
        'Meat & Seafood',
        'Dairy & Eggs',
        'Bakery',
        'Frozen',
        'Canned Goods',
        'Condiments & Sauces',
        'Beverages',
        'Snacks & Treats',
        'Pantry',
        'Household',
        'Other',
      ],
      meal_courses: [
        { id: 'breakfast', name: 'Breakfast', time: '08:00', color: '#22c55e' },
        { id: 'lunch', name: 'Lunch', time: '12:00', color: '#3b82f6' },
        { id: 'dinner', name: 'Dinner', time: '18:00', color: '#f97316' },
        { id: 'snack', name: 'Snack', time: '15:00', color: '#a855f7' },
      ],
      default_grocery_list_id: null,
      theme_color: '#f97316',
    };
  }

  return {
    household_context: householdPrefs.household_context,
    dietary_constraints: householdPrefs.dietary_constraints || [],
    ai_style: householdPrefs.ai_style,
    planning_preferences: householdPrefs.planning_preferences || [],
    ai_learning_enabled: householdPrefs.ai_learning_enabled ?? true,
    shopping_categories: householdPrefs.shopping_categories,
    meal_courses: householdPrefs.meal_courses,
    default_grocery_list_id: null, // user-specific, not needed by chef
    theme_color: '#f97316',        // user-specific, not needed by chef
  };
}
