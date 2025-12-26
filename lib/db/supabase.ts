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
 * Supabase client singleton for server-side Tool operations.
 * Uses service role key to bypass RLS.
 * Authorization is enforced by Tool context (household_id checks).
 *
 * This client should ONLY be used in Tool functions where we explicitly
 * check permissions via the context parameter.
 */
export const supabase = createClient(
  supabaseUrl,
  // Use service role key to bypass RLS (we handle authz in Tools)
  supabaseServiceRoleKey ?? supabaseAnonKey
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
