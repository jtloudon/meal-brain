import { createServerClient } from '@supabase/ssr';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');
  const inviteCode = requestUrl.searchParams.get('invite');

  console.log('[CALLBACK ROUTE] Processing auth callback', inviteCode ? `with invite: ${inviteCode}` : '');
  
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

    // If invite code present, auto-join household
    if (inviteCode && (!userRecord || !userRecord.household_id)) {
      console.log('[CALLBACK ROUTE] Auto-joining household with invite:', inviteCode);

      const serviceClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      try {
        // Call use_invite_code function to join household
        const { data: householdId, error: inviteError } = await serviceClient.rpc('use_invite_code', {
          code: inviteCode.toUpperCase(),
          user_id: user.id,
        });

        if (inviteError) {
          console.error('[CALLBACK ROUTE] Invite error:', inviteError);
          return NextResponse.redirect(`${requestUrl.origin}/onboarding?error=invalid_invite`);
        }

        // Create/update user record with household_id
        const { error: upsertError } = await serviceClient.from('users').upsert({
          id: user.id,
          email: user.email,
          household_id: householdId,
        });

        if (upsertError) {
          console.error('[CALLBACK ROUTE] User upsert error:', upsertError);
          return NextResponse.redirect(`${requestUrl.origin}/onboarding?error=join_failed`);
        }

        console.log('[CALLBACK ROUTE] Successfully joined household:', householdId);
        // Skip preferences onboarding for invited users - go straight to recipes
        return NextResponse.redirect(`${requestUrl.origin}/recipes`);
      } catch (err) {
        console.error('[CALLBACK ROUTE] Auto-join exception:', err);
        return NextResponse.redirect(`${requestUrl.origin}/onboarding?error=unexpected`);
      }
    }

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

        // Continue to recipes
        return NextResponse.redirect(`${requestUrl.origin}/recipes`);
      }
    }

    if (!userRecord || !userRecord.household_id) {
      return NextResponse.redirect(`${requestUrl.origin}/onboarding`);
    }

    return NextResponse.redirect(`${requestUrl.origin}/recipes`);
  }

  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
