import { createClient } from '@/lib/auth/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// POST - Auto-categorize a grocery item using Claude
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemName } = await request.json();

    if (!itemName || typeof itemName !== 'string') {
      return NextResponse.json(
        { error: 'Item name is required' },
        { status: 400 }
      );
    }

    console.log('[Categorize] Item:', itemName);

    // Step 1: Check cache first using get_suggested_category()
    const { data: cachedCategory, error: cacheError } = await supabase
      .rpc('get_suggested_category', { item_name: itemName });

    if (cachedCategory && !cacheError) {
      console.log('[Categorize] Cache hit:', cachedCategory);
      return NextResponse.json({
        category: cachedCategory,
        source: 'cache'
      });
    }

    // Step 2: Call Claude API for unconstrained categorization
    // Claude suggests the IDEAL category - the items route handles user's actual categories
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[Categorize] No Claude API key configured');
      return NextResponse.json({
        category: 'Other',
        source: 'fallback'
      });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `What grocery store category does this item belong in: "${itemName}"

Common categories include: Produce, Meat & Seafood, Dairy & Eggs, Bakery, Frozen, Canned Goods, Condiments & Sauces, Beverages, Snacks & Treats, Pantry, Household, Auto, Outdoor, Pet Supplies, Baby, Health & Beauty, etc.

Instructions:
- Return the SINGLE most appropriate category name
- Use short, standard grocery category names (1-3 words)
- Respond with ONLY the category name, nothing else
- If truly uncategorizable, respond with "Other"

Category:`;

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307', // Fast, cheap model for simple categorization
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: prompt
      }],
      temperature: 0 // Deterministic output
    });

    const categoryText = message.content[0].type === 'text'
      ? message.content[0].text.trim()
      : 'Other';

    // Basic validation: ensure it's a reasonable category name (not empty, not a sentence)
    const isValidCategory = categoryText.length > 0 &&
                            categoryText.length <= 30 &&
                            !categoryText.includes('.');
    const category = isValidCategory ? categoryText : 'Other';

    console.log('[Categorize] Claude suggested:', category);

    // Step 3: Save to cache for future use
    const { error: saveError } = await supabase
      .rpc('save_category_mapping', {
        item_name: itemName,
        category_name: category
      });

    if (saveError) {
      console.error('[Categorize] Failed to save cache:', saveError);
    }

    return NextResponse.json({
      category,
      source: 'claude'
    });

  } catch (error: any) {
    console.error('[Categorize] Error:', error);

    // Fallback to "Other" on any error
    return NextResponse.json({
      category: 'Other',
      source: 'error',
      error: error.message
    });
  }
}
