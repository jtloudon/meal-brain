import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// POST - Validate invite code (public endpoint)
export async function POST(request: NextRequest) {
  try {
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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { inviteCode } = await request.json();

    if (!inviteCode) {
      return NextResponse.json(
        { error: 'Invite code is required', valid: false },
        { status: 400 }
      );
    }

    // Check if invite exists and is valid (not auth required - public check)
    const { data: invite, error } = await supabase
      .from('household_invites')
      .select('id, household_id, expires_at, max_uses, use_count, households(name)')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (error || !invite) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid invite code'
      });
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({
        valid: false,
        error: 'Invite code has expired'
      });
    }

    // Check if uses exhausted
    if (invite.max_uses && invite.use_count >= invite.max_uses) {
      return NextResponse.json({
        valid: false,
        error: 'Invite code has been fully used'
      });
    }

    return NextResponse.json({
      valid: true,
      householdName: (invite.households as any)?.name,
      householdId: invite.household_id,
    });
  } catch (error) {
    console.error('[API /invites/validate] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', valid: false },
      { status: 500 }
    );
  }
}
