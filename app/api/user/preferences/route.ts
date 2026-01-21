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

    // Get user's household_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('household_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.household_id) {
      console.error('[API GET /user/preferences] User error:', userError);
      return NextResponse.json({ error: 'Failed to fetch user household' }, { status: 500 });
    }

    // Fetch household preferences (shared settings)
    const { data: householdPrefs, error: householdError } = await supabase
      .from('household_preferences')
      .select('*')
      .eq('household_id', userData.household_id)
      .single();

    if (householdError && householdError.code !== 'PGRST116') {
      console.error('[API GET /user/preferences] Household prefs error:', householdError);
      return NextResponse.json({ error: 'Failed to fetch household preferences' }, { status: 500 });
    }

    // Fetch user preferences (personal settings like theme_color)
    const { data: userPrefs, error: userPrefsError } = await supabase
      .from('user_preferences')
      .select('theme_color, default_grocery_list_id')
      .eq('user_id', user.id)
      .single();

    if (userPrefsError && userPrefsError.code !== 'PGRST116') {
      console.error('[API GET /user/preferences] User prefs error:', userPrefsError);
      return NextResponse.json({ error: 'Failed to fetch user preferences' }, { status: 500 });
    }

    // Merge household and user preferences, with defaults
    return NextResponse.json({
      user_id: user.id,
      household_context: householdPrefs?.household_context || null,
      dietary_constraints: householdPrefs?.dietary_constraints || [],
      ai_style: householdPrefs?.ai_style || null,
      planning_preferences: householdPrefs?.planning_preferences || [],
      ai_learning_enabled: householdPrefs?.ai_learning_enabled ?? true,
      default_grocery_list_id: userPrefs?.default_grocery_list_id || null,
      theme_color: userPrefs?.theme_color || '#f97316',
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

    // Get user's household_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('household_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.household_id) {
      console.error('[API PUT /user/preferences] User error:', userError);
      return NextResponse.json({ error: 'Failed to fetch user household' }, { status: 500 });
    }

    const body = await request.json();

    // Validate theme_color if provided
    if (body.theme_color && !/^#[0-9A-Fa-f]{6}$/.test(body.theme_color)) {
      return NextResponse.json(
        { error: 'Invalid theme_color format. Must be a valid hex color (e.g., #f97316)' },
        { status: 400 }
      );
    }

    // Upsert household preferences (shared settings)
    const { error: householdError } = await supabase
      .from('household_preferences')
      .upsert(
        {
          household_id: userData.household_id,
          household_context: body.household_context,
          dietary_constraints: body.dietary_constraints,
          ai_style: body.ai_style,
          planning_preferences: body.planning_preferences,
          ai_learning_enabled: body.ai_learning_enabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'household_id' }
      );

    if (householdError) {
      console.error('[API PUT /user/preferences] Household error:', householdError);
      return NextResponse.json({ error: 'Failed to save household preferences' }, { status: 500 });
    }

    // Upsert user preferences (personal settings)
    const { error: userPrefsError } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: user.id,
          default_grocery_list_id: body.default_grocery_list_id,
          theme_color: body.theme_color,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (userPrefsError) {
      console.error('[API PUT /user/preferences] User prefs error:', userPrefsError);
      return NextResponse.json({ error: 'Failed to save user preferences' }, { status: 500 });
    }

    // Return the combined preferences
    return NextResponse.json({
      user_id: user.id,
      household_context: body.household_context,
      dietary_constraints: body.dietary_constraints,
      ai_style: body.ai_style,
      planning_preferences: body.planning_preferences,
      ai_learning_enabled: body.ai_learning_enabled,
      default_grocery_list_id: body.default_grocery_list_id,
      theme_color: body.theme_color,
    });
  } catch (error) {
    console.error('[API PUT /user/preferences] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
