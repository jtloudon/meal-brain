'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Plus, Search, Star } from 'lucide-react';

interface Recipe {
  id: string;
  title: string;
  tags: string[];
  rating: number | null;
  created_at: string;
  notes?: string | null;
  instructions?: string | null;
  image_url?: string | null;
  recipe_ingredients?: Array<{ display_name: string }>;
}

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecipes();
  }, [search, minRating]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await fetch(`/api/recipes?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }

      const data = await response.json();
      console.log('[Frontend] API response:', data);
      console.log('[Frontend] First recipe:', data.recipes?.[0]);

      let recipes = data.recipes || [];

      // Client-side filtering (search text + rating)
      // Note: We fetch all recipes and filter client-side for simplicity
      // and to enable case-insensitive search across all content
      if (search || minRating !== null) {
        recipes = recipes.filter((recipe: Recipe) => {
          // Search filter
          let matchesSearch = true;
          if (search) {
            const searchLower = search.toLowerCase();
            const matchesTitle = recipe.title.toLowerCase().includes(searchLower);
            const matchesTag = recipe.tags.some(tag =>
              tag.toLowerCase().includes(searchLower)
            );
            const matchesNotes = recipe.notes?.toLowerCase().includes(searchLower) || false;
            const matchesInstructions = recipe.instructions?.toLowerCase().includes(searchLower) || false;
            const matchesIngredient = recipe.recipe_ingredients?.some(ing =>
              ing.display_name.toLowerCase().includes(searchLower)
            ) || false;

            matchesSearch = matchesTitle || matchesTag || matchesNotes || matchesInstructions || matchesIngredient;
          }

          // Rating filter (minimum rating)
          let matchesRating = true;
          if (minRating !== null) {
            matchesRating = recipe.rating !== null && recipe.rating >= minRating;
          }

          return matchesSearch && matchesRating;
        });
      }

      setRecipes(recipes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            fill={star <= rating ? '#f97316' : 'none'}
            stroke={star <= rating ? '#f97316' : '#d1d5db'}
            strokeWidth={2}
          />
        ))}
      </div>
    );
  };

  return (
    <AuthenticatedLayout
      title="Recipes"
      action={
        <button
          onClick={() => router.push('/recipes/new')}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Plus size={20} />
        </button>
      }
    >
      <div className="px-4 py-4">
        {/* Search Bar */}
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

        {/* Rating Filter */}
        <div className="mb-4">
          <select
            value={minRating ?? ''}
            onChange={(e) => setMinRating(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 bg-gray-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All ratings</option>
            <option value="5">⭐⭐⭐⭐⭐ 5 stars</option>
            <option value="4">⭐⭐⭐⭐ 4+ stars</option>
            <option value="3">⭐⭐⭐ 3+ stars</option>
            <option value="2">⭐⭐ 2+ stars</option>
            <option value="1">⭐ 1+ stars</option>
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-gray-600">Loading recipes...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && recipes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center max-w-sm">
              <div className="mb-4 text-gray-400">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {search ? 'No recipes found' : 'No recipes yet'}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                {search
                  ? 'Try adjusting your search'
                  : 'Start building your recipe collection'}
              </p>
              {!search && (
                <button
                  onClick={() => router.push('/recipes/new')}
                  className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Your First Recipe
                </button>
              )}
            </div>
          </div>
        )}

        {/* Recipe List */}
        {!loading && !error && recipes.length > 0 && (
          <div className="space-y-3">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => router.push(`/recipes/${recipe.id}`)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer active:bg-gray-50"
              >
                {/* Recipe Image */}
                {recipe.image_url && (
                  <div className="w-full h-32 bg-gray-100">
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Recipe Info */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {recipe.title}
                    </h3>
                    {renderStars(recipe.rating)}
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
