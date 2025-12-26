'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/auth/supabase-server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function createHousehold(householdName: string) {
  // First, verify user is authenticated using the regular client
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log('[SERVER ACTION] User:', user?.id, user?.email, 'Error:', userError);

  if (!user) {
    console.error('[SERVER ACTION] No user found');
    return { error: 'Not authenticated' };
  }

  // Use service role client for database operations (bypasses RLS)
  // This is safe because we've already verified the user is authenticated above
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create household
  const { data: household, error: householdError } = await serviceClient
    .from('households')
    .insert({ name: householdName })
    .select('id')
    .single();

  if (householdError) {
    console.error('[SERVER ACTION] Household error:', householdError);
    return { error: householdError.message };
  }

  // Create user record linked to household
  const { error: insertUserError } = await serviceClient.from('users').insert({
    id: user.id,
    email: user.email!,
    household_id: household.id,
  });

  if (insertUserError) {
    // If user already exists, update household_id
    const { error: updateError } = await serviceClient
      .from('users')
      .update({ household_id: household.id })
      .eq('id', user.id);

    if (updateError) {
      console.error('[SERVER ACTION] User update error:', updateError);
      return { error: updateError.message };
    }
  }

  console.log('[SERVER ACTION] Success - household created:', household.id);

  // Redirect to planner
  redirect('/planner');
}
