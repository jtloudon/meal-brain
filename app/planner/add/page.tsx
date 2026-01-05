'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { ArrowLeft, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Recipe {
  id: string;
  title: string;
  tags: string[];
  rating: number | null;
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function AddMealPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'select-recipe' | 'select-details'>('select-recipe');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [date, setDate] = useState(getTodayDate());
  const [mealType, setMealType] = useState<MealType>('dinner');
  const [servingSize, setServingSize] = useState(4);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchRecipes();
  }, []);

  // Check for recipeId and date in query params and auto-select
  useEffect(() => {
    const recipeId = searchParams.get('recipeId');
    const dateParam = searchParams.get('date');

    if (dateParam) {
      setDate(dateParam);
    }

    if (recipeId && recipes.length > 0) {
      const recipe = recipes.find(r => r.id === recipeId);
      if (recipe) {
        setSelectedRecipe(recipe);
        setStep('select-details');
      }
    }
  }, [searchParams, recipes]);

  useEffect(() => {
    // Filter recipes by search
    if (search) {
      const searchLower = search.toLowerCase();
      setFilteredRecipes(
        recipes.filter(
          (r) =>
            r.title.toLowerCase().includes(searchLower) ||
            r.tags.some((t) => t.toLowerCase().includes(searchLower))
        )
      );
    } else {
      setFilteredRecipes(recipes);
    }
  }, [search, recipes]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/recipes');
      if (!response.ok) throw new Error('Failed to fetch recipes');
      const data = await response.json();
      setRecipes(data.recipes || []);
      setFilteredRecipes(data.recipes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setStep('select-details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipe) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe_id: selectedRecipe.id,
          date,
          meal_type: mealType,
          serving_size: servingSize,
          notes: notes.trim() ? notes : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add meal');
      }

      router.push('/planner');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add meal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthenticatedLayout
      title="Add Meal"
      action={
        <button
          onClick={() => {
            if (step === 'select-details') {
              setStep('select-recipe');
            } else {
              router.push('/planner');
            }
          }}
          style={{
            padding: '8px',
            color: '#f97316',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={24} />
        </button>
      }
    >
      <div className="px-4 py-4">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Step 1: Select Recipe */}
        {step === 'select-recipe' && (
          <>
            {/* Search */}
            <div className="relative mb-4">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search recipes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {loading && (
              <div className="flex justify-center py-12">
                <div className="animate-pulse text-gray-600">Loading recipes...</div>
              </div>
            )}

            {!loading && filteredRecipes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-gray-600">
                  {search ? 'No recipes found' : 'No recipes available'}
                </p>
              </div>
            )}

            {!loading && filteredRecipes.length > 0 && (
              <div className="space-y-2">
                {filteredRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => handleSelectRecipe(recipe)}
                    className="w-full text-left bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <div className="font-medium text-gray-900 mb-1">
                      {recipe.title}
                    </div>
                    {recipe.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {recipe.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Step 2: Select Date & Meal Type */}
        {step === 'select-details' && selectedRecipe && (
          <form onSubmit={handleSubmit}>
            {/* Selected Recipe */}
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs text-blue-600 font-medium mb-1">
                Selected Recipe
              </div>
              <div className="font-semibold text-gray-900">
                {selectedRecipe.title}
              </div>
            </div>

            {/* Date Picker */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Meal Type Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meal Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MEAL_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setMealType(type);
                    }}
                    style={{
                      padding: '12px',
                      border: mealType === type ? '2px solid #f97316' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: mealType === type ? '#fff7ed' : 'white',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#111827',
                      textTransform: 'capitalize'
                    }}
                  >
                    {type}
                    {mealType === type && ' ✓'}
                  </button>
                ))}
              </div>
            </div>

            {/* Serving Size */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serving Size
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setServingSize(Math.max(1, servingSize - 1))}
                  className="w-10 h-10 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-orange-600 font-semibold text-lg flex items-center justify-center"
                >
                  −
                </button>
                <div className="flex-1 text-center text-2xl font-semibold text-gray-900">
                  {servingSize}
                </div>
                <button
                  type="button"
                  onClick={() => setServingSize(servingSize + 1)}
                  className="w-10 h-10 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-orange-600 font-semibold text-lg flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this meal..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: saving ? '#d1d5db' : '#f97316',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '8px',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Adding...' : 'Add to Planner'}
            </button>
          </form>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}
