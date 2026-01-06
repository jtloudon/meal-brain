import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in client components.
 * Uses default cookie-based session storage for SSR compatibility.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('[SUPABASE] Creating client with:', {
    url,
    hasKey: !!key,
    keyLength: key?.length,
  });

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  // Use default Supabase SSR cookie handling
  // No custom cookie config needed - @supabase/ssr handles it
  return createBrowserClient(url, key);
}
