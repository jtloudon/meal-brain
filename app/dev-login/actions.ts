'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function devLogin(userId: string) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Dev login not available in production');
  }

  const email = getEmailForUserId(userId);
  const householdId = getHouseholdIdForUserId(userId);

  console.log('[DEV LOGIN] Starting dev login for:', email, 'household:', householdId);

  // Create admin client with service role
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Step 1: Get or create user in auth.users
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = users?.users.find((u) => u.email === email);

  let authUserId = existingUser?.id;

  // Dev-only password (NEVER use in production!)
  const DEV_PASSWORD = 'dev-password-12345';

  if (!existingUser) {
    console.log('[DEV LOGIN] Creating new auth user with password');
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        password: DEV_PASSWORD,
        user_metadata: {},
      });

    if (createError) {
      console.error('[DEV LOGIN] Error creating auth user:', createError);
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    authUserId = newUser.user?.id;
    console.log('[DEV LOGIN] Created auth user:', authUserId);
  } else {
    console.log('[DEV LOGIN] Found existing auth user:', authUserId);
  }

  if (!authUserId) {
    throw new Error('Failed to get auth user ID');
  }

  // Step 2: Create or update user in users table with household_id
  // Check if user record exists
  const { data: existingUserRecord } = await supabaseAdmin
    .from('users')
    .select('id, household_id')
    .eq('id', authUserId)
    .single();

  if (!existingUserRecord) {
    console.log('[DEV LOGIN] Creating users table record');
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUserId,
        household_id: householdId,
        email: email,
      });

    if (insertError) {
      console.error('[DEV LOGIN] Error creating user record:', insertError);
      throw new Error(`Failed to create user record: ${insertError.message}`);
    }
  } else if (existingUserRecord.household_id !== householdId) {
    console.log('[DEV LOGIN] Updating household_id for existing user');
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ household_id: householdId })
      .eq('id', authUserId);

    if (updateError) {
      console.error('[DEV LOGIN] Error updating user record:', updateError);
      throw new Error(`Failed to update user record: ${updateError.message}`);
    }
  }

  console.log('[DEV LOGIN] User record ready with household:', householdId);

  // Step 3: Generate REAL Supabase session tokens
  console.log('[DEV LOGIN] Generating session tokens...');
  const { data: sessionData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password: DEV_PASSWORD,
  });

  if (signInError || !sessionData.session) {
    console.error('[DEV LOGIN] Failed to generate session:', signInError);
    throw new Error(`Failed to generate session: ${signInError?.message || 'No session returned'}`);
  }

  console.log('[DEV LOGIN] Session tokens generated successfully');

  // Return tokens to client for setSession()
  return {
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
  };
}

function getEmailForUserId(userId: string): string {
  const userMap: Record<string, string> = {
    '10000000-0000-4000-8000-000000000001': 'demo@mealbrain.app',
    '10000000-0000-4000-8000-000000000002': 'spouse@mealbrain.app',
    '10000000-0000-4000-8000-000000000003': 'test@mealbrain.app',
  };

  return userMap[userId] || 'demo@mealbrain.app';
}

function getHouseholdIdForUserId(userId: string): string {
  const householdMap: Record<string, string> = {
    // Demo users → Demo Household
    '10000000-0000-4000-8000-000000000001': '00000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002': '00000000-0000-4000-8000-000000000001',
    // Test user → Test Household
    '10000000-0000-4000-8000-000000000003': '00000000-0000-4000-8000-000000000002',
  };

  return householdMap[userId] || '00000000-0000-4000-8000-000000000001';
}
