import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET - List household invites
export async function GET() {
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's household invites
    const { data: invites, error } = await supabase
      .from('household_invites')
      .select('*, household_invite_uses(count)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API /invites] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ invites });
  } catch (error) {
    console.error('[API /invites] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new invite
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's household
    const { data: userRecord } = await supabase
      .from('users')
      .select('household_id')
      .eq('id', user.id)
      .single();

    if (!userRecord?.household_id) {
      return NextResponse.json(
        { error: 'User not associated with household' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { maxUses, notes } = body;

    // Generate unique invite code
    const { data: codeData, error: codeError } = await supabase
      .rpc('generate_invite_code');

    if (codeError) {
      console.error('[API /invites] Code generation error:', codeError);
      return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 });
    }

    const inviteCode = codeData;

    // Create invite
    const { data: invite, error: insertError } = await supabase
      .from('household_invites')
      .insert({
        household_id: userRecord.household_id,
        invite_code: inviteCode,
        created_by: user.id,
        max_uses: maxUses || 1,
        notes: notes || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[API /invites] Insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ invite }, { status: 201 });
  } catch (error) {
    console.error('[API /invites] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
