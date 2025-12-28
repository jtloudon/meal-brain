import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { grocery } from '@/lib/tools/grocery';

export async function GET() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's household
  const { data: userRecord } = await supabase
    .from('users')
    .select('household_id')
    .eq('id', user.id)
    .single();

  if (!userRecord?.household_id) {
    return NextResponse.json({ error: 'No household found' }, { status: 404 });
  }

  // Use the list_lists tool
  const result = await grocery.list_lists.execute(
    {},
    {
      userId: user.id,
      householdId: userRecord.household_id,
    }
  );

  if (!result.success) {
    console.error('Error listing lists:', result.error);
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ lists: result.data.lists });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's household
  const { data: userRecord } = await supabase
    .from('users')
    .select('household_id')
    .eq('id', user.id)
    .single();

  if (!userRecord?.household_id) {
    return NextResponse.json({ error: 'No household found' }, { status: 404 });
  }

  // Parse request body
  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: 'List name is required' }, { status: 400 });
  }

  // Use the create_list tool
  const result = await grocery.create_list.execute(
    { name },
    {
      userId: user.id,
      householdId: userRecord.household_id,
    }
  );

  if (!result.success) {
    console.error('Error creating list:', result.error);
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  // Fetch the full list object to return to the frontend
  const { data: createdList } = await supabase
    .from('grocery_lists')
    .select('*')
    .eq('id', result.data.grocery_list_id)
    .single();

  return NextResponse.json({ list: createdList });
}
