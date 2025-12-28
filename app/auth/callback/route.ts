import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  console.log('[CALLBACK ROUTE] Processing auth callback');
  
  if (error) {
    console.error('[CALLBACK ROUTE] Auth error:', error, error_description);
    return NextResponse.redirect(`${requestUrl.origin}/login?error=${error_description}`);
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    console.log('[CALLBACK ROUTE] Exchange result:', { hasSession: !!data?.session, error: exchangeError });

    if (exchangeError) {
      console.error('[CALLBACK ROUTE] Exchange error:', exchangeError);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`);
    }

    // Check if user has a household
    const { data: { user } } = await supabase.auth.getUser();
    console.log('[CALLBACK ROUTE] User:', user?.email);

    if (!user) {
      return NextResponse.redirect(`${requestUrl.origin}/login`);
    }

    // Check for user record
    const { data: userRecord } = await supabase
      .from('users')
      .select('household_id')
      .eq('id', user.id)
      .single();

    console.log('[CALLBACK ROUTE] User record:', userRecord);

    // Auto-link dev emails to Demo/Test households (dev mode only)
    if ((!userRecord || !userRecord.household_id) && process.env.NODE_ENV === 'development') {
      const devEmailMap: Record<string, string> = {
        'demo@mealbrain.app': '00000000-0000-4000-8000-000000000001', // Demo Household
        'spouse@mealbrain.app': '00000000-0000-4000-8000-000000000001', // Demo Household
        'test@mealbrain.app': '00000000-0000-4000-8000-000000000002', // Test Household
      };

      const householdId = devEmailMap[user.email || ''];

      if (householdId) {
        console.log('[CALLBACK ROUTE] Auto-linking', user.email, 'to household', householdId);
        await supabase.from('users').upsert({
          id: user.id,
          email: user.email,
          household_id: householdId,
        });

        // Continue to planner
        return NextResponse.redirect(`${requestUrl.origin}/planner`);
      }
    }

    if (!userRecord || !userRecord.household_id) {
      return NextResponse.redirect(`${requestUrl.origin}/onboarding`);
    }

    return NextResponse.redirect(`${requestUrl.origin}/planner`);
  }

  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
