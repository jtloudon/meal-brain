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
  meal_type?: string | null;
  recipe_ingredients?: Array<{ display_name: string }>;
}

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showSearch, setShowSearch] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    fetchRecipes();
  }, [search, minRating, selectedCategory]);

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

      // Client-side filtering (search text + rating + category)
      // Note: We fetch all recipes and filter client-side for simplicity
      // and to enable case-insensitive search across all content
      if (search || minRating !== null || selectedCategory !== 'All') {
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

          // Category filter (meal type)
          let matchesCategory = true;
          if (selectedCategory !== 'All') {
            matchesCategory = recipe.meal_type?.toLowerCase() === selectedCategory.toLowerCase();
          }

          return matchesSearch && matchesRating && matchesCategory;
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

  // Fixed meal type categories
  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'];

  return (
    <AuthenticatedLayout
      title={
        <span style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#f97316',
          backgroundColor: '#fff7ed',
          padding: '4px 12px',
          borderRadius: '8px'
        }}>
          MealBrain
        </span>
      }
      action={
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setShowSearch(!showSearch)}
            style={{
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Search size={22} style={{ color: '#f97316' }} />
          </button>
          <button
            onClick={() => router.push('/recipes/new')}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Plus size={24} style={{ color: '#f97316' }} />
          </button>
        </div>
      }
    >
      <div style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px', paddingBottom: '16px' }}>
        {/* Search Bar - Collapsible */}
        {showSearch && (
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }}
            />
            <input
              type="text"
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '40px',
                paddingRight: '16px',
                paddingTop: '10px',
                paddingBottom: '10px',
                backgroundColor: '#f3f4f6',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
              autoFocus
            />
          </div>
        )}

        {/* Category Filter Pills */}
        <div style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '16px',
          justifyContent: 'space-between'
        }}>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '6px 10px',
                borderRadius: '16px',
                border: 'none',
                backgroundColor: selectedCategory === category ? '#f97316' : '#f3f4f6',
                color: selectedCategory === category ? 'white' : '#6b7280',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                flex: 1,
                minWidth: 0
              }}
            >
              {category}
            </button>
          ))}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => router.push(`/recipes/${recipe.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  padding: '12px'
                }}
              >
                {/* Recipe Image - Square thumbnail on left */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  flexShrink: 0,
                  borderRadius: '6px',
                  overflow: 'hidden',
                  backgroundColor: '#f3f4f6'
                }}>
                  {recipe.image_url ? (
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af',
                      fontSize: '12px'
                    }}>
                      No image
                    </div>
                  )}
                </div>

                {/* Recipe Info - Title and tags on right */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontSize: '17px',
                    fontWeight: '600',
                    color: '#f97316',
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {recipe.title}
                  </h3>
                  {recipe.tags.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginTop: '4px'
                    }}>
                      {recipe.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            backgroundColor: '#f3f4f6',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}
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
