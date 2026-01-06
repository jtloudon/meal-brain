import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in client components.
 * This client handles authentication state and session management.
 * Uses cookie storage for PKCE flow compatibility with Next.js SSR.
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

  return createBrowserClient(url, key, {
    auth: {
      persistSession: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'meal-brain-auth',
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    cookies: {
      get(name: string) {
        const cookie = document.cookie
          .split('; ')
          .find((row) => row.startsWith(`${name}=`));
        return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
      },
      set(name: string, value: string, options: any) {
        let cookie = `${name}=${encodeURIComponent(value)}`;
        if (options?.maxAge) cookie += `; max-age=${options.maxAge}`;
        if (options?.path) cookie += `; path=${options.path}`;
        if (options?.sameSite) cookie += `; samesite=${options.sameSite}`;
        // Secure flag required for HTTPS (production)
        if (window.location.protocol === 'https:') cookie += `; secure`;
        document.cookie = cookie;
      },
      remove(name: string, options: any) {
        document.cookie = `${name}=; path=${options?.path || '/'}; max-age=0`;
      },
    },
  });
}
