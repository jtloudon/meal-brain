import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { pushIngredients } from '@/lib/tools/grocery';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Create server-side Supabase client for auth
    const supabase = createServerClient(
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
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get household_id
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
    const { grocery_list_id, ingredients } = body;

    if (!grocery_list_id || !ingredients) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await pushIngredients(
      {
        grocery_list_id,
        ingredients,
      },
      {
        userId: user.id,
        householdId: userRecord.household_id,
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.type === 'VALIDATION_ERROR' ? 400 : 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[API Push Ingredients] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to push ingredients' },
      { status: 500 }
    );
  }
}
