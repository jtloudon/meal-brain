import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { grocery_list_id } = await request.json();

    if (!grocery_list_id) {
      return NextResponse.json(
        { error: 'grocery_list_id is required' },
        { status: 400 }
      );
    }

    const { id: itemId } = await params;

    // Update the item's grocery_list_id
    const { data: updatedItem, error } = await supabase
      .from('grocery_items')
      .update({ grocery_list_id })
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Error moving item:', error);
      return NextResponse.json(
        { error: 'Failed to move item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error('Error in PATCH /api/grocery/items/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
