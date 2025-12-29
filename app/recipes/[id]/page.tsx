'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { ArrowLeft, Calendar, ShoppingCart, Star, ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react';

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

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(
    new Set()
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const [groceryLists, setGroceryLists] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedGroceryList, setSelectedGroceryList] = useState<string | null>(null);
  const [pushing, setPushing] = useState(false);

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

      const data = await response.json();
      setRecipe(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  const toggleIngredient = (ingredientId: string) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(ingredientId)) {
        next.delete(ingredientId);
      } else {
        next.add(ingredientId);
      }
      return next;
    });
  };

  const handleDelete = async () => {
    if (!recipe) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete recipe');
      }

      // Redirect to recipe list and force refresh to clear cache
      router.push('/recipes');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete recipe');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const fetchGroceryLists = async () => {
    try {
      const response = await fetch('/api/grocery/lists');
      if (!response.ok) throw new Error('Failed to fetch grocery lists');
      const data = await response.json();
      setGroceryLists(data.lists || []);
      if (data.lists && data.lists.length > 0) {
        setSelectedGroceryList(data.lists[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load grocery lists');
    }
  };

  const handleOpenPushModal = () => {
    setShowPushModal(true);
    fetchGroceryLists();
  };

  const handlePushIngredients = async () => {
    if (!recipe || !selectedGroceryList) return;

    try {
      setPushing(true);
      setError(null);

      // Transform recipe ingredients to the format expected by the API
      const ingredients = recipe.recipe_ingredients.map((ing) => ({
        ingredient_id: null, // Will be looked up by the tool
        display_name: ing.display_name,
        quantity: ing.quantity,
        unit: ing.unit,
      }));

      const response = await fetch('/api/grocery/push-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grocery_list_id: selectedGroceryList,
          ingredients,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to push ingredients');
      }

      // Success! Close modal and show success message
      setShowPushModal(false);
      alert('Ingredients pushed to grocery list!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to push ingredients');
    } finally {
      setPushing(false);
    }
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            fill={star <= rating ? '#f97316' : 'none'}
            stroke={star <= rating ? '#f97316' : '#d1d5db'}
            strokeWidth={2}
          />
        ))}
      </div>
    );
  };

  const formatIngredient = (ingredient: RecipeIngredient) => {
    const parts = [
      ingredient.display_name,
      ingredient.quantity,
      ingredient.unit,
    ];

    if (ingredient.prep_state) {
      parts.push(`(${ingredient.prep_state})`);
    }

    return `${parts[0]} ${parts[1]} ${parts[2]}${ingredient.prep_state ? ' ' + parts[3] : ''}`;
  };

  if (loading) {
    return (
      <AuthenticatedLayout title="Recipe">
        <div className="flex justify-center py-12">
          <div className="animate-pulse text-gray-600">Loading recipe...</div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error || !recipe) {
    return (
      <AuthenticatedLayout title="Recipe">
        <div className="px-4 py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-sm text-red-600">{error || 'Recipe not found'}</p>
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
      title={recipe.title}
      action={
        <button
          onClick={() => router.push('/recipes')}
          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
      }
    >
      <div className="pb-4">
        {/* Recipe Image */}
        {recipe.image_url && (
          <div className="w-full h-48 bg-gray-100 mb-4">
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="px-4">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-lg font-bold text-gray-900">{recipe.title}</h1>
              {renderStars(recipe.rating)}
            </div>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-3" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block text-xs text-gray-700 bg-blue-100 px-4 py-1.5 rounded-full font-medium"
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#dbeafe',
                    padding: '6px 16px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    marginRight: '8px'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Notes */}
          {recipe.notes && (
            <p className="text-sm text-gray-600 italic">{recipe.notes}</p>
          )}
        </div>

        {/* Ingredients */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Ingredients:
          </h2>
          <div className="space-y-2">
            {recipe.recipe_ingredients.map((ingredient) => (
              <label
                key={ingredient.id}
                className="flex items-start gap-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checkedIngredients.has(ingredient.id)}
                  onChange={() => toggleIngredient(ingredient.id)}
                  className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span
                  className={`text-sm ${
                    checkedIngredients.has(ingredient.id)
                      ? 'line-through text-gray-400'
                      : 'text-gray-700'
                  }`}
                >
                  <span className="font-semibold">
                    {ingredient.display_name}
                  </span>{' '}
                  {ingredient.quantity} {ingredient.unit}
                  {ingredient.prep_state && ` (${ingredient.prep_state})`}
                  {ingredient.optional && (
                    <span className="text-gray-500 ml-1">(optional)</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Instructions */}
        {recipe.instructions && (
          <div className="mb-6 border border-gray-200 rounded-lg p-4">
            <button
              onClick={() => setInstructionsExpanded(!instructionsExpanded)}
              className="flex items-center justify-between w-full text-base font-semibold text-gray-900 mb-2"
            >
              <span>Instructions</span>
              {instructionsExpanded ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>
            {instructionsExpanded && (
              <div className="text-sm text-gray-700 whitespace-pre-wrap mt-3">
                {recipe.instructions}
              </div>
            )}
          </div>
        )}

        {/* Debug: Show if instructions exist */}
        {!recipe.instructions && (
          <div className="text-red-500 text-sm mb-4">
            No instructions in recipe data
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 mt-6">
          <button
            onClick={() => router.push(`/recipes/${recipe.id}/edit`)}
            className="w-full px-4 py-3 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <Edit size={18} />
            Edit Recipe
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full px-4 py-3 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={18} />
            Delete Recipe
          </button>
          <button
            onClick={() => router.push('/planner/add')}
            className="w-full px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Calendar size={18} />
            Add to Planner
          </button>
          <button
            onClick={handleOpenPushModal}
            className="w-full px-4 py-3 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart size={18} />
            Push Ingredients to Grocery List
          </button>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Recipe?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete "{recipe.title}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Push Ingredients Modal */}
        {showPushModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Push Ingredients to Grocery List
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Select which grocery list to add these ingredients to:
              </p>

              {groceryLists.length === 0 ? (
                <p className="text-sm text-gray-500 mb-6">
                  No grocery lists available. Create one first.
                </p>
              ) : (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grocery List
                  </label>
                  <select
                    value={selectedGroceryList || ''}
                    onChange={(e) => setSelectedGroceryList(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {groceryLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPushModal(false)}
                  disabled={pushing}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePushIngredients}
                  disabled={pushing || groceryLists.length === 0}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:bg-gray-300"
                >
                  {pushing ? 'Pushing...' : 'Push'}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
