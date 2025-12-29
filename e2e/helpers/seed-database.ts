import { createClient } from '@supabase/supabase-js';

// Use service role key for admin operations in tests
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export interface SeedUserData {
  email: string;
  household_id?: string;
}

export interface SeedHouseholdData {
  id?: string;
  name: string;
}

export interface SeedDatabaseOptions {
  user?: SeedUserData;
  household?: SeedHouseholdData;
}

/**
 * Seeds the database with test data for E2E tests.
 * This uses the service role to bypass RLS.
 */
export async function seedDatabase(options: SeedDatabaseOptions) {
  const { user, household } = options;

  // Create household if provided
  let householdId = household?.id;

  if (household) {
    const { data, error } = await supabase
      .from('households')
      .insert({
        name: household.name,
      })
      .select('id')
      .single();

    if (error && !error.message.includes('duplicate')) {
      throw new Error(`Failed to create household: ${error.message}`);
    }

    if (data) {
      householdId = data.id;
    }
  }

  // Create user if provided
  if (user) {
    // First create auth user
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: user.email,
        email_confirm: true,
      });

    if (authError && !authError.message.includes('already registered')) {
      console.error('[SEED-DATABASE] Auth error details:', authError);
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    // Get user ID (either from newly created user or by looking up existing user)
    let userId = authUser?.user?.id;

    if (!userId) {
      // User already exists, look up their ID
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users.find((u) => u.email === user.email);
      userId = existingUser?.id;
    }

    // Then create user record
    if (userId) {
      const { error: userError } = await supabase.from('users').upsert({
        id: userId,
        email: user.email,
        household_id: user.household_id || householdId,
      });

      if (userError && !userError.message.includes('duplicate')) {
        throw new Error(`Failed to create user record: ${userError.message}`);
      }
    }
  }

  return { householdId };
}

/**
 * Cleans up test data from the database.
 */
export async function cleanupDatabase(email?: string) {
  if (email) {
    // Get user ID from email
    const { data: authData } = await supabase.auth.admin.listUsers();
    const user = authData?.users.find((u) => u.email === email);

    if (user) {
      // Delete user record (cascades to related data)
      await supabase.from('users').delete().eq('id', user.id);

      // Delete auth user
      await supabase.auth.admin.deleteUser(user.id);
    }
  }
}
