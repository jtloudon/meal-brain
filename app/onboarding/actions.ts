'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/auth/supabase-server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function createHousehold(householdName: string, inviteCode?: string) {
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

  // If invite code provided, use it to join existing household
  let household;
  if (inviteCode) {
    console.log('[SERVER ACTION] Using invite code:', inviteCode);

    // Call the use_invite_code function
    const { data: householdId, error: inviteError } = await serviceClient
      .rpc('use_invite_code', {
        code: inviteCode.toUpperCase(),
        user_id: user.id,
      });

    if (inviteError) {
      console.error('[SERVER ACTION] Invite error:', inviteError);
      return { error: inviteError.message };
    }

    // Get household details
    const { data: householdData, error: fetchError } = await serviceClient
      .from('households')
      .select('id')
      .eq('id', householdId)
      .single();

    if (fetchError || !householdData) {
      console.error('[SERVER ACTION] Household fetch error:', fetchError);
      return { error: 'Failed to join household' };
    }

    household = householdData;
  } else if (householdName === 'Demo Household') {
    // DEV MODE: If "Demo Household", join the SEEDED household (with recipes)
    const SEEDED_HOUSEHOLD_ID = '00000000-0000-4000-8000-000000000001';
    const { data: existingHousehold } = await serviceClient
      .from('households')
      .select('id')
      .eq('id', SEEDED_HOUSEHOLD_ID)
      .single();

    if (existingHousehold) {
      console.log('[SERVER ACTION] Joining seeded Demo Household:', existingHousehold.id);
      household = existingHousehold;
    }
  }

  // If no existing household found, create new one
  if (!household) {
    const { data: newHousehold, error: householdError } = await serviceClient
      .from('households')
      .insert({ name: householdName })
      .select('id')
      .single();

    if (householdError) {
      console.error('[SERVER ACTION] Household error:', householdError);
      return { error: householdError.message };
    }

    household = newHousehold;
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

  console.log('[SERVER ACTION] Success - household joined/created:', household.id);

  // Redirect to recipes (skip preferences for invited users - they can set later)
  redirect('/recipes');
}
