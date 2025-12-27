'use server';

import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function devLogin(userId: string) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Dev login not available in production');
  }

  const email = getEmailForUserId(userId);

  // Create admin client with service role
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Try to get existing user by email (not ID, since seed data may have different IDs)
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = users?.users.find((u) => u.email === email);

  let authUserId = existingUser?.id;

  if (!existingUser) {
    // User doesn't exist in auth, create them
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {},
      });

    if (createError) {
      console.error('Error creating user:', createError);
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    authUserId = newUser.user?.id;
  }

  // Now generate a magic link
  console.log('[DEV LOGIN] Generating link for:', email);
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });

  if (error || !data) {
    console.error('[DEV LOGIN] Error generating link:', error);
    throw new Error(`Failed to generate login link: ${error?.message || 'unknown error'}`);
  }

  console.log('[DEV LOGIN] Link generated:', data.properties.action_link);

  // Extract the token from the URL
  const url = new URL(data.properties.action_link);
  const token = url.searchParams.get('token');
  const type = url.searchParams.get('type');

  if (!token || !type) {
    throw new Error('Invalid magic link generated');
  }

  // Redirect to the auth callback with the token
  redirect(`/auth/callback?token=${token}&type=${type}`);
}

function getEmailForUserId(userId: string): string {
  const userMap: Record<string, string> = {
    '10000000-0000-4000-8000-000000000001': 'demo@mealbrain.app',
    '10000000-0000-4000-8000-000000000002': 'spouse@mealbrain.app',
    '10000000-0000-4000-8000-000000000003': 'test@mealbrain.app',
  };

  return userMap[userId] || 'demo@mealbrain.app';
}
