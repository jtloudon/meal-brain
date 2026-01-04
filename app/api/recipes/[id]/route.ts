import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/db/supabase';
import { updateRecipe, deleteRecipe } from '@/lib/tools/recipe';

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
        image_url,
        source,
        serving_size,
        prep_time,
        cook_time,
        meal_type,
        created_at,
        recipe_ingredients (
          id,
          ingredient_id,
          display_name,
          quantity_min,
          quantity_max,
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

export async function PUT(
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

    // Parse request body
    const body = await request.json();

    // Call the updateRecipe tool
    const result = await updateRecipe(
      {
        recipe_id: id,
        ...body,
      },
      {
        userId: user.id,
        householdId: userRecord.household_id,
      }
    );

    if (!result.success) {
      console.error('[API PUT /recipes/:id] Error:', result.error);
      const statusCode =
        result.error.type === 'VALIDATION_ERROR'
          ? 400
          : result.error.type === 'NOT_FOUND'
          ? 404
          : result.error.type === 'PERMISSION_DENIED'
          ? 403
          : 500;

      return NextResponse.json({ error: result.error.message }, { status: statusCode });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Recipe update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Delete recipe (cascades to recipe_ingredients due to FK constraints)
    const { error: deleteError } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id)
      .eq('household_id', userRecord.household_id);

    if (deleteError) {
      console.error('[API DELETE /recipes/:id] Error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete recipe' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Recipe delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
