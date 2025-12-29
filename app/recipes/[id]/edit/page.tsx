'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RecipeFormWithTabs from '@/components/RecipeFormWithTabs';
import { parseIngredientsText, ingredientsToText } from '@/lib/utils/parse-ingredients';

interface RecipeIngredient {
  id: string;
  display_name: string;
  quantity: number;
  unit: string;
  prep_state: string | null;
  optional: boolean;
}

interface Recipe {
  id: string;
  title: string;
  rating: number | null;
  tags: string[];
  notes: string | null;
  instructions: string | null;
  image_url: string | null;
  created_at: string;
  recipe_ingredients: RecipeIngredient[];
}

export default function EditRecipePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<{
    title: string;
    rating: number | null;
    tags: string;
    notes: string;
    instructions: string;
    ingredientsText: string;
    imageUrl: string | null;
  } | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchRecipe(params.id as string);
    }
  }, [params.id]);

  const fetchRecipe = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/recipes/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch recipe');
      }

      const recipe: Recipe = await response.json();

      // Convert ingredients to free-form text
      const ingredientsText = ingredientsToText(recipe.recipe_ingredients);

      setInitialData({
        title: recipe.title,
        rating: recipe.rating,
        tags: recipe.tags.join(', '),
        notes: recipe.notes || '',
        instructions: recipe.instructions || '',
        ingredientsText,
        imageUrl: recipe.image_url,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

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
    const response = await fetch(`/api/recipes/${params.id}`, {
      method: 'PUT',
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
      throw new Error(errorData.error || 'Failed to update recipe');
    }

    router.push(`/recipes/${params.id}`);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-600">Loading recipe...</div>
      </div>
    );
  }

  if (error || !initialData) {
    return (
      <div className="h-screen flex items-center justify-center bg-white p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center max-w-md">
          <p className="text-sm text-red-600">{error || 'Failed to load recipe'}</p>
          <button
            onClick={() => router.push('/recipes')}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            Back to Recipes
          </button>
        </div>
      </div>
    );
  }

  return (
    <RecipeFormWithTabs
      mode="edit"
      recipeId={params.id as string}
      initialData={initialData}
      onSubmit={handleSubmit}
    />
  );
}
