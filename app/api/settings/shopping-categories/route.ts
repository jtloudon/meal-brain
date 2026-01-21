import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/db/supabase';
import { DEFAULT_CATEGORIES } from '@/lib/utils/categorize-ingredient';

export async function GET(request: NextRequest) {
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

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's household_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('household_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.household_id) {
      console.error('[API GET /settings/shopping-categories] User error:', userError);
      return NextResponse.json({ error: 'Failed to fetch user household' }, { status: 500 });
    }

    // Fetch household preferences to get shopping categories
    const { data: preferences, error } = await supabase
      .from('household_preferences')
      .select('shopping_categories')
      .eq('household_id', userData.household_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[API GET /settings/shopping-categories] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    // Return saved categories or defaults
    return NextResponse.json({
      categories: preferences?.shopping_categories || DEFAULT_CATEGORIES,
    });
  } catch (error) {
    console.error('[API GET /settings/shopping-categories] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's household_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('household_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.household_id) {
      console.error('[API PUT /settings/shopping-categories] User error:', userError);
      return NextResponse.json({ error: 'Failed to fetch user household' }, { status: 500 });
    }

    const body = await request.json();

    // Upsert shopping categories in household preferences
    const { data, error } = await supabase
      .from('household_preferences')
      .upsert(
        {
          household_id: userData.household_id,
          shopping_categories: body.categories,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'household_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('[API PUT /settings/shopping-categories] Error:', error);
      return NextResponse.json({ error: 'Failed to save categories' }, { status: 500 });
    }

    return NextResponse.json({ categories: data.shopping_categories });
  } catch (error) {
    console.error('[API PUT /settings/shopping-categories] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
