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
  let { grocery_list_id, display_name, quantity, unit, category, notes } = body;

  if (!grocery_list_id || !display_name) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  // Validate quantity is a valid number
  if (quantity === undefined || quantity === null || isNaN(quantity) || quantity <= 0) {
    console.error('Invalid quantity received:', quantity, 'type:', typeof quantity);
    return NextResponse.json(
      { error: 'Quantity must be a positive number' },
      { status: 400 }
    );
  }

  // Auto-categorize if category not provided or is "Other"
  if (!category || category === 'Other') {
    try {
      // Call categorization endpoint
      const categorizeResponse = await fetch(
        `${request.nextUrl.origin}/api/grocery/categorize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || '', // Pass auth cookies
          },
          body: JSON.stringify({ itemName: display_name }),
        }
      );

      if (categorizeResponse.ok) {
        const { category: suggestedCategory } = await categorizeResponse.json();
        category = suggestedCategory;
        console.log('[Add Item] Auto-categorized:', display_name, '→', category);
      } else {
        category = 'Other'; // Fallback
      }
    } catch (error) {
      console.error('[Add Item] Auto-categorize failed:', error);
      category = 'Other'; // Fallback
    }
  }

  // Use the add_item tool (expects 'name' not 'display_name')
  const result = await grocery.add_item.execute(
    {
      grocery_list_id,
      name: display_name, // Tool schema uses 'name'
      quantity,
      unit: unit || '', // Allow empty unit
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

  // Update the created item with category and notes
  if (category || notes) {
    await supabase
      .from('grocery_items')
      .update({
        category: category || 'Other',
        notes: notes || null,
      })
      .eq('id', result.data.grocery_item_id);
  }

  // Fetch the full item object to return to the frontend
  const { data: createdItem } = await supabase
    .from('grocery_items')
    .select('*')
    .eq('id', result.data.grocery_item_id)
    .single();

  return NextResponse.json({ item: createdItem });
}
