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

  // Get the first user in the household (preferences are household-wide)
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('household_id', householdId)
    .limit(1);

  if (userError || !users || users.length === 0) {
    throw new Error('No user found for household');
  }

  const user = users[0];

  // Get preferences for this user
  const { data: preferences, error: prefsError } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (prefsError) {
    throw new Error(`Failed to fetch preferences: ${prefsError.message}`);
  }

  if (!preferences) {
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
    household_context: preferences.household_context,
    dietary_constraints: preferences.dietary_constraints || [],
    ai_style: preferences.ai_style,
    planning_preferences: preferences.planning_preferences || [],
    ai_learning_enabled: preferences.ai_learning_enabled ?? true,
    shopping_categories: preferences.shopping_categories,
    meal_courses: preferences.meal_courses,
    default_grocery_list_id: preferences.default_grocery_list_id || null,
    theme_color: preferences.theme_color || '#f97316',
  };
}
