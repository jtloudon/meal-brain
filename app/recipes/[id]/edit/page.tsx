'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import ImageUpload from '@/components/ImageUpload';
import { createClient } from '@/lib/auth/supabase-client';
import { ArrowLeft, Plus, Trash2, Star } from 'lucide-react';

const VALID_UNITS = [
  'cup',
  'tbsp',
  'tsp',
  'ml',
  'l',
  'fl oz',
  'lb',
  'oz',
  'g',
  'kg',
  'whole',
  'clove',
  'can',
  'package',
  'slice',
] as const;

interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  prep_state: string;
}

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [householdId, setHouseholdId] = useState<string>('');

  // Form fields
  const [title, setTitle] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [instructions, setInstructions] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: '', quantity: '', unit: 'cup', prep_state: '' },
  ]);

  // Get household ID on mount
  useEffect(() => {
    const getHouseholdId = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('household_id')
          .eq('id', user.id)
          .single();
        if (data) {
          setHouseholdId(data.household_id);
        }
      }
    };
    getHouseholdId();
  }, []);

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

      // Populate form fields
      setTitle(recipe.title);
      setRating(recipe.rating);
      setTags(recipe.tags.join(', '));
      setNotes(recipe.notes || '');
      setInstructions(recipe.instructions || '');
      setImageUrl(recipe.image_url);
      setIngredients(
        recipe.recipe_ingredients.map((ing, index) => ({
          id: (index + 1).toString(),
          name: ing.display_name,
          quantity: ing.quantity.toString(),
          unit: ing.unit,
          prep_state: ing.prep_state || '',
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    const newId = (Math.max(...ingredients.map((i) => parseInt(i.id))) + 1).toString();
    setIngredients([
      ...ingredients,
      { id: newId, name: '', quantity: '', unit: 'cup', prep_state: '' },
    ]);
  };

  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((i) => i.id !== id));
    }
  };

  const updateIngredient = (id: string, field: keyof Ingredient, value: string) => {
    setIngredients(
      ingredients.map((ing) =>
        ing.id === id ? { ...ing, [field]: value } : ing
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Validate ingredients
      const validIngredients = ingredients
        .filter((ing) => ing.name && ing.quantity)
        .map((ing) => ({
          name: ing.name,
          quantity: parseFloat(ing.quantity),
          unit: ing.unit,
          prep_state: ing.prep_state || undefined,
        }));

      if (validIngredients.length === 0) {
        throw new Error('At least one ingredient is required');
      }

      // Parse tags
      const tagArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t);

      // Submit to API
      const response = await fetch(`/api/recipes/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          ingredients: validIngredients,
          instructions: instructions || undefined,
          tags: tagArray.length > 0 ? tagArray : undefined,
          rating: rating || undefined,
          notes: notes || undefined,
          image_url: imageUrl || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update recipe');
      }

      router.push(`/recipes/${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recipe');
    } finally {
      setSaving(false);
    }
  };

  const renderStarRating = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star === rating ? null : star)}
            className="focus:outline-none"
          >
            <Star
              size={24}
              fill={rating && star <= rating ? '#f97316' : 'none'}
              stroke={rating && star <= rating ? '#f97316' : '#d1d5db'}
              strokeWidth={2}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <AuthenticatedLayout title="Edit Recipe">
        <div className="flex justify-center py-12">
          <div className="animate-pulse text-gray-600">Loading recipe...</div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error && !title) {
    return (
      <AuthenticatedLayout title="Edit Recipe">
        <div className="px-4 py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => router.push('/recipes')}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Back to Recipes
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      title="Edit Recipe"
      action={
        <button
          onClick={() => router.push(`/recipes/${params.id}`)}
          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="px-4 py-4 pb-24">
        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Recipe name"
          />
        </div>

        {/* Image Upload */}
        {householdId && params.id && (
          <div className="mb-4">
            <ImageUpload
              currentImageUrl={imageUrl}
              onImageChange={setImageUrl}
              householdId={householdId}
              recipeId={params.id as string}
            />
          </div>
        )}

        {/* Rating */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rating
          </label>
          {renderStarRating()}
        </div>

        {/* Tags */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Comma separated (e.g., dinner, vegetarian)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate tags with commas
          </p>
        </div>

        {/* Ingredients */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Ingredients *
            </label>
            <button
              type="button"
              onClick={addIngredient}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus size={16} />
              Add
            </button>
          </div>

          <div className="space-y-3">
            {ingredients.map((ingredient) => (
              <div key={ingredient.id} className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  {/* Name */}
                  <input
                    type="text"
                    value={ingredient.name}
                    onChange={(e) =>
                      updateIngredient(ingredient.id, 'name', e.target.value)
                    }
                    placeholder="Name"
                    className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />

                  {/* Quantity */}
                  <input
                    type="number"
                    step="0.01"
                    value={ingredient.quantity}
                    onChange={(e) =>
                      updateIngredient(ingredient.id, 'quantity', e.target.value)
                    }
                    placeholder="Qty"
                    className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />

                  {/* Unit */}
                  <select
                    value={ingredient.unit}
                    onChange={(e) =>
                      updateIngredient(ingredient.id, 'unit', e.target.value)
                    }
                    className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {VALID_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>

                  {/* Prep State */}
                  <input
                    type="text"
                    value={ingredient.prep_state}
                    onChange={(e) =>
                      updateIngredient(ingredient.id, 'prep_state', e.target.value)
                    }
                    placeholder="Prep (optional)"
                    className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => removeIngredient(ingredient.id)}
                  disabled={ingredients.length === 1}
                  className={`p-2 rounded ${
                    ingredients.length === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Instructions
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Step-by-step cooking instructions..."
          />
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any additional notes..."
          />
        </div>

        {/* Submit Button */}
        <div className="mb-20">
          <button
            type="submit"
            disabled={saving || !title}
            className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </AuthenticatedLayout>
  );
}
