import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in client components.
 * Uses cookies for SSR + localStorage backup for PWA persistence.
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

  // Detect if running in PWA mode (iOS standalone)
  const isPWA = typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
     (window.navigator as any).standalone === true);

  console.log('[SUPABASE] PWA mode:', isPWA);

  return createBrowserClient(url, key, {
    auth: {
      // Use localStorage for PWAs (iOS clears cookies aggressively)
      // Use default (cookies) for browser
      storage: isPWA ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
