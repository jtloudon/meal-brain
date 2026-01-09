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

    const { grocery_list_id, display_name, quantity, unit, category, notes, checked, out_of_stock } = await request.json();

    // Build update object dynamically based on provided fields
    const updateData: Record<string, any> = {};
    if (grocery_list_id !== undefined) updateData.grocery_list_id = grocery_list_id;
    if (display_name !== undefined) updateData.display_name = display_name;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (unit !== undefined) updateData.unit = unit;
    if (category !== undefined) updateData.category = category;
    if (notes !== undefined) updateData.notes = notes;
    if (checked !== undefined) updateData.checked = checked;
    if (out_of_stock !== undefined) updateData.out_of_stock = out_of_stock;

    // Validate that at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'At least one field must be provided to update' },
        { status: 400 }
      );
    }

    // Validate quantity if provided
    if (quantity !== undefined && quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be positive' },
        { status: 400 }
      );
    }

    const { id: itemId } = await params;

    // Update the item
    const { data: updatedItem, error } = await supabase
      .from('grocery_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Error updating item:', error);
      return NextResponse.json(
        { error: 'Failed to update item' },
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

export async function DELETE(
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

    const { id: itemId } = await params;

    // Delete the item (RLS policies will ensure user can only delete their household's items)
    const { error } = await supabase
      .from('grocery_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting item:', error);
      return NextResponse.json(
        { error: 'Failed to delete item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/grocery/items/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
