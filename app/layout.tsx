import type { Metadata, Viewport } from 'next';
import './globals.css';
import SplashScreen from './components/SplashScreen';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/db/supabase';

export const metadata: Metadata = {
  title: 'MealBrain',
  description: 'An AI sous chef you control - helpful, never bossy',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MealBrain',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f97316',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch user's theme color
  let themeColor = '#f97316'; // default

  try {
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (user) {
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('theme_color')
        .eq('user_id', user.id)
        .single();

      if (preferences?.theme_color) {
        themeColor = preferences.theme_color;
      }
    }
  } catch (error) {
    // Silently fall back to default color if fetch fails
    console.error('Failed to fetch theme color:', error);
  }

  return (
    <html lang="en" style={{ '--theme-primary': themeColor } as React.CSSProperties}>
      <body className="antialiased">
        <SplashScreen />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Remove Next.js dev indicator
              if (typeof window !== 'undefined') {
                const removeIndicator = () => {
                  const selectors = [
                    '#devtools-indicator',
                    '[data-nextjs-toast]',
                    'nextjs-portal'
                  ];
                  selectors.forEach(sel => {
                    document.querySelectorAll(sel).forEach(el => el.remove());
                  });
                };
                removeIndicator();
                setInterval(removeIndicator, 1000);
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
