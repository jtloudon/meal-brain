import { NextRequest, NextResponse } from 'next/server';
import { pushIngredients } from '@/lib/tools/grocery';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { grocery_list_id, ingredients } = body;

    if (!grocery_list_id || !ingredients) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await pushIngredients({
      grocery_list_id,
      ingredients,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API Push Ingredients] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to push ingredients' },
      { status: 500 }
    );
  }
}
