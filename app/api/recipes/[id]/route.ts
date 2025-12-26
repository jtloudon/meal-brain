import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/db/supabase';

export async function GET(
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

    // Fetch recipe with ingredients using service role client
    console.log('[API Recipe Detail] Fetching recipe:', id, 'for household:', userRecord.household_id);

    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select(
        `
        id,
        title,
        rating,
        tags,
        notes,
        instructions,
        created_at,
        recipe_ingredients (
          id,
          display_name,
          quantity,
          unit,
          prep_state,
          optional
        )
      `
      )
      .eq('id', id)
      .eq('household_id', userRecord.household_id)
      .single();

    console.log('[API Recipe Detail] Query result:', { recipe, recipeError });

    if (recipeError || !recipe) {
      console.error('[API Recipe Detail] Error:', recipeError);
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error('Recipe detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
