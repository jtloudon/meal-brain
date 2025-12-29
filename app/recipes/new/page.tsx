'use client';

import { useRouter } from 'next/navigation';
import RecipeFormWithTabs from '@/components/RecipeFormWithTabs';
import { parseIngredientsText } from '@/lib/utils/parse-ingredients';

export default function NewRecipePage() {
  const router = useRouter();

  const handleSubmit = async (data: {
    title: string;
    rating: number | null;
    tags: string[];
    notes: string;
    instructions: string;
    ingredientsText: string;
    imageUrl: string | null;
  }) => {
    // Parse ingredients from free-form text
    const parsedIngredients = parseIngredientsText(data.ingredientsText);

    if (parsedIngredients.length === 0) {
      throw new Error('At least one valid ingredient is required');
    }

    // Submit to API
    const response = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        ingredients: parsedIngredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          prep_state: ing.prep_state || undefined,
        })),
        instructions: data.instructions || undefined,
        tags: data.tags.length > 0 ? data.tags : undefined,
        rating: data.rating || undefined,
        notes: data.notes || undefined,
        image_url: data.imageUrl || undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create recipe');
    }

    const responseData = await response.json();
    router.push(`/recipes/${responseData.recipe_id}`);
  };

  return (
    <RecipeFormWithTabs
      mode="create"
      onSubmit={handleSubmit}
    />
  );
}
