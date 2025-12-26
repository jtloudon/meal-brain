import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { removeMeal } from '@/lib/tools/planner';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();

    // Create server-side Supabase client for auth
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
            } catch {
              // Ignore cookie errors in Server Components
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get household_id
    const { data: userRecord } = await supabaseAuth
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

    // Call the removeMeal tool
    const result = await removeMeal(
      { planner_meal_id: id },
      {
        userId: user.id,
        householdId: userRecord.household_id,
      }
    );

    if (!result.success) {
      console.error('[API DELETE /planner/:id] Error:', result.error);
      const statusCode =
        result.error.type === 'NOT_FOUND'
          ? 404
          : result.error.type === 'PERMISSION_DENIED'
          ? 403
          : 500;

      return NextResponse.json({ error: result.error.message }, { status: statusCode });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Remove meal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
