import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/db/supabase';

const DEFAULT_MEAL_COURSES = [
  { id: 'breakfast', name: 'Breakfast', time: '08:00', color: '#22c55e' },
  { id: 'lunch', name: 'Lunch', time: '12:00', color: '#3b82f6' },
  { id: 'dinner', name: 'Dinner', time: '18:00', color: '#ef4444' },
  { id: 'snack', name: 'Snack', time: '20:00', color: '#f59e0b' },
];

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

    // Fetch user preferences to get meal courses
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('meal_courses')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[API GET /settings/meal-courses] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch meal courses' }, { status: 500 });
    }

    // Return saved meal courses or defaults
    return NextResponse.json({
      mealCourses: preferences?.meal_courses || DEFAULT_MEAL_COURSES,
    });
  } catch (error) {
    console.error('[API GET /settings/meal-courses] Error:', error);
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

    const body = await request.json();

    // Upsert meal courses in user preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: user.id,
          meal_courses: body.mealCourses,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('[API PUT /settings/meal-courses] Error:', error);
      return NextResponse.json({ error: 'Failed to save meal courses' }, { status: 500 });
    }

    return NextResponse.json({ mealCourses: data.meal_courses });
  } catch (error) {
    console.error('[API PUT /settings/meal-courses] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
