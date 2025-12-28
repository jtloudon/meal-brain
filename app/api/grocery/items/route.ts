import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { grocery } from '@/lib/tools/grocery';

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
  const { grocery_list_id, display_name, quantity, unit } = body;

  if (!grocery_list_id || !display_name || !quantity || !unit) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  // Use the add_item tool (expects 'name' not 'display_name')
  const result = await grocery.add_item.execute(
    {
      grocery_list_id,
      name: display_name, // Tool schema uses 'name'
      quantity,
      unit,
    },
    {
      userId: user.id,
      householdId: userRecord.household_id,
    }
  );

  if (!result.success) {
    console.error('Error adding item:', result.error);
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  // Fetch the full item object to return to the frontend
  const { data: createdItem } = await supabase
    .from('grocery_items')
    .select('*')
    .eq('id', result.data.grocery_item_id)
    .single();

  return NextResponse.json({ item: createdItem });
}
