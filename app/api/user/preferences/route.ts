import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/db/supabase';

export async function GET(request: NextRequest) {
  try {
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

    // Fetch user preferences
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned", which is fine
      console.error('[API GET /user/preferences] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    // If no preferences exist yet, return defaults
    if (!preferences) {
      return NextResponse.json({
        user_id: user.id,
        household_context: null,
        dietary_constraints: [],
        ai_style: null,
        planning_preferences: [],
        ai_learning_enabled: true,
        default_grocery_list_id: null,
        theme_color: '#f97316',
      });
    }

    return NextResponse.json({
      ...preferences,
      user_id: user.id,
    });
  } catch (error) {
    console.error('[API GET /user/preferences] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
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

    const body = await request.json();

    // Validate theme_color if provided
    if (body.theme_color && !/^#[0-9A-Fa-f]{6}$/.test(body.theme_color)) {
      return NextResponse.json(
        { error: 'Invalid theme_color format. Must be a valid hex color (e.g., #f97316)' },
        { status: 400 }
      );
    }

    // Upsert preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: user.id,
          household_context: body.household_context,
          dietary_constraints: body.dietary_constraints,
          ai_style: body.ai_style,
          planning_preferences: body.planning_preferences,
          ai_learning_enabled: body.ai_learning_enabled,
          default_grocery_list_id: body.default_grocery_list_id,
          theme_color: body.theme_color,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('[API PUT /user/preferences] Error:', error);
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API PUT /user/preferences] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
