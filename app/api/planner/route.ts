import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { listMeals, addMeal } from '@/lib/tools/planner';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Create server-side Supabase client
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
            } catch {
              // Ignore cookie errors in Server Components
            }
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

    // Get household_id from users table
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

    // Get query params with defaults (current week)
    const searchParams = request.nextUrl.searchParams;
    const start_date = searchParams.get('start_date') || getDefaultStartDate();
    const end_date = searchParams.get('end_date') || getDefaultEndDate();

    // Call the listMeals tool
    const result = await listMeals(
      {
        start_date,
        end_date,
      },
      {
        userId: user.id,
        householdId: userRecord.household_id,
      }
    );

    if (!result.success) {
      console.error('[API /planner] Error:', result.error);
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Planner list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Create server-side Supabase client
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
            } catch {
              // Ignore cookie errors in Server Components
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('[API POST /planner] No authenticated user found');
      return NextResponse.json(
        { error: 'Unauthorized - Please log in again' },
        { status: 401 }
      );
    }

    // Get household_id from users table
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('household_id')
      .eq('id', user.id)
      .single();

    if (userError || !userRecord) {
      console.error(
        '[API POST /planner] User record not found:',
        userError,
        'user.id:',
        user.id
      );
      return NextResponse.json(
        { error: 'User profile not found - Please log out and log back in' },
        { status: 400 }
      );
    }

    if (!userRecord.household_id) {
      console.error('[API POST /planner] User has no household_id:', user.id);
      return NextResponse.json(
        { error: 'No household associated - Please complete onboarding' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Call the addMeal tool
    const result = await addMeal(body, {
      userId: user.id,
      householdId: userRecord.household_id,
    });

    if (!result.success) {
      console.error('[API POST /planner] Error:', result.error);
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.type === 'VALIDATION_ERROR' ? 400 : 500 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('Planner add error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions for default date range (current week)
function getDefaultStartDate(): string {
  const now = new Date();
  const monday = new Date(now);
  const day = monday.getDay();
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

function getDefaultEndDate(): string {
  const startDate = new Date(getDefaultStartDate());
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  return endDate.toISOString().split('T')[0];
}
