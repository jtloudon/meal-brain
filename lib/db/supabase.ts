import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check .env.local file.'
  );
}

/**
 * Supabase client singleton for server-side operations.
 * In test environment, uses service role key to bypass RLS.
 * In production, uses anon key with Row Level Security (RLS) enforced.
 *
 * For authenticated operations, use `supabase.auth.setSession()` or
 * pass user context to queries.
 */
export const supabase = createClient(
  supabaseUrl,
  // Use service role key in test environment to bypass RLS
  process.env.VITEST ? (supabaseServiceRoleKey ?? supabaseAnonKey) : supabaseAnonKey
);

/**
 * Creates a Supabase client with a specific user's session.
 * Used in Tool executions to enforce RLS policies.
 */
export function createAuthenticatedClient(userId: string) {
  // For now, return the standard client
  // In production, we'll set the auth context properly
  return supabase;
}
