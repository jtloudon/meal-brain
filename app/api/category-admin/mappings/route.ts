import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';

// GET /api/category-admin/mappings - List all category mappings
// Optional query params: ?category=Frozen&search=hummus
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get('category');
    const searchTerm = searchParams.get('search');

    let query = supabase
      .from('category_mappings')
      .select('id, item_name_normalized, category, times_used, created_at, last_used_at')
      .order('category', { ascending: true })
      .order('item_name_normalized', { ascending: true });

    if (categoryFilter) {
      query = query.eq('category', categoryFilter);
    }

    if (searchTerm) {
      query = query.ilike('item_name_normalized', `%${searchTerm.toLowerCase()}%`);
    }

    const { data: mappings, error } = await query;

    if (error) {
      console.error('[Admin Mappings] Error fetching mappings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also get distinct categories for reference
    const { data: categoriesData } = await supabase
      .from('category_mappings')
      .select('category')
      .order('category');

    const distinctCategories = Array.from(new Set(categoriesData?.map(c => c.category) || []));

    return NextResponse.json({
      mappings,
      count: mappings?.length || 0,
      distinctCategories,
      filter: categoryFilter || 'all',
      search: searchTerm || null
    });

  } catch (error) {
    console.error('[Admin Mappings] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/category-admin/mappings - Bulk update category mappings
// Body: { updates: [{ item_name_normalized: "popsicles", new_category: "Frozen" }] }
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid updates array' },
        { status: 400 }
      );
    }

    const results = {
      success: [] as string[],
      failed: [] as { item: string; error: string }[]
    };

    for (const update of updates) {
      const { item_name_normalized, new_category } = update;

      if (!item_name_normalized || !new_category) {
        results.failed.push({
          item: item_name_normalized || 'unknown',
          error: 'Missing item_name_normalized or new_category'
        });
        continue;
      }

      const { error } = await supabase
        .from('category_mappings')
        .update({ category: new_category })
        .eq('item_name_normalized', item_name_normalized);

      if (error) {
        results.failed.push({ item: item_name_normalized, error: error.message });
      } else {
        results.success.push(item_name_normalized);
      }
    }

    return NextResponse.json({
      message: `Updated ${results.success.length} mappings`,
      results
    });

  } catch (error) {
    console.error('[Admin Mappings] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
