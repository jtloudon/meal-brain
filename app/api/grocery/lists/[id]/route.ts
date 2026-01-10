import { NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { grocery } from '@/lib/tools/grocery';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  // Use the get_list tool
  const result = await grocery.get_list.execute(
    { grocery_list_id: id },
    {
      userId: user.id,
      householdId: userRecord.household_id,
    }
  );

  if (!result.success) {
    console.error('Error getting list:', result.error);
    return NextResponse.json({ error: result.error.message }, { status: result.error.type === 'NOT_FOUND' ? 404 : 500 });
  }

  return NextResponse.json(result.data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
  const { name, protected: isProtected } = body;

  // Build update object dynamically
  const updateData: { name?: string; protected?: boolean } = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'List name must be a non-empty string' }, { status: 400 });
    }
    updateData.name = name.trim();
  }

  if (isProtected !== undefined) {
    if (typeof isProtected !== 'boolean') {
      return NextResponse.json({ error: 'Protected must be a boolean' }, { status: 400 });
    }
    updateData.protected = isProtected;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  // Update list
  const { data, error } = await supabase
    .from('grocery_lists')
    .update(updateData)
    .eq('id', id)
    .eq('household_id', userRecord.household_id)
    .select()
    .single();

  if (error) {
    console.error('Error updating list name:', error);
    return NextResponse.json({ error: 'Failed to update list name' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  // Delete the list (this will cascade delete all items due to foreign key constraint)
  const { error } = await supabase
    .from('grocery_lists')
    .delete()
    .eq('id', id)
    .eq('household_id', userRecord.household_id);

  if (error) {
    console.error('Error deleting list:', error);
    return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
