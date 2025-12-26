'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Plus, Trash2 } from 'lucide-react';

interface PlannedMeal {
  id: string;
  recipe_id: string;
  date: string;
  meal_type: string;
  recipe: {
    title: string;
    tags: string[];
    rating: number | null;
  };
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function PlannerPage() {
  const router = useRouter();
  const [meals, setMeals] = useState<PlannedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(getMonday(new Date()));

  useEffect(() => {
    fetchMeals();
  }, [weekStart]);

  const fetchMeals = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = formatDate(weekStart);
      const endDate = formatDate(addDays(weekStart, 6));

      const response = await fetch(
        `/api/planner?start_date=${startDate}&end_date=${endDate}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch meals');
      }

      const data = await response.json();
      setMeals(data.meals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meals');
    } finally {
      setLoading(false);
    }
  };

  const getMealsForDay = (date: Date): Record<MealType, PlannedMeal[]> => {
    const dateStr = formatDate(date);
    const dayMeals = meals.filter((m) => m.date === dateStr);

    return {
      breakfast: dayMeals.filter((m) => m.meal_type === 'breakfast'),
      lunch: dayMeals.filter((m) => m.meal_type === 'lunch'),
      dinner: dayMeals.filter((m) => m.meal_type === 'dinner'),
      snack: dayMeals.filter((m) => m.meal_type === 'snack'),
    };
  };

  const nextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
  };

  const prevWeek = () => {
    setWeekStart(addDays(weekStart, -7));
  };

  const thisWeek = () => {
    setWeekStart(getMonday(new Date()));
  };

  return (
    <AuthenticatedLayout
      title="Meal Planner"
      action={
        <button
          onClick={() => router.push('/planner/add')}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Plus size={20} />
        </button>
      }
    >
      <div className="px-4 py-4">
        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevWeek}
            className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
          >
            ← Prev
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {formatWeekRange(weekStart)}
            </span>
            <button
              onClick={thisWeek}
              className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
            >
              Today
            </button>
          </div>
          <button
            onClick={nextWeek}
            className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
          >
            Next →
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-gray-600">Loading meals...</div>
          </div>
        )}

        {/* Week View */}
        {!loading && (
          <div className="space-y-4">
            {Array.from({ length: 7 }).map((_, dayIndex) => {
              const date = addDays(weekStart, dayIndex);
              const dayMeals = getMealsForDay(date);
              const isToday = isSameDay(date, new Date());

              return (
                <div
                  key={dayIndex}
                  className={`border rounded-lg p-3 ${
                    isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatDayName(date)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDateShort(date)}
                      </div>
                    </div>
                  </div>

                  {/* Meals Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {MEAL_TYPES.map((mealType) => (
                      <div key={mealType} className="space-y-1">
                        <div className="text-xs font-medium text-gray-500 capitalize">
                          {mealType}
                        </div>
                        {dayMeals[mealType].length === 0 ? (
                          <div className="text-xs text-gray-400 italic">No meal</div>
                        ) : (
                          dayMeals[mealType].map((meal) => (
                            <div
                              key={meal.id}
                              className="bg-white border border-gray-200 rounded p-2 text-xs"
                            >
                              <div className="font-medium text-gray-900">
                                {meal.recipe.title}
                              </div>
                              {meal.recipe.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {meal.recipe.tags.slice(0, 2).map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && meals.length === 0 && (
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                No meals planned yet
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Start planning your week by adding meals to your calendar
              </p>
              <button
                onClick={() => router.push('/planner/add')}
                className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Plan Your First Meal
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

// Helper functions
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatWeekRange(startDate: Date): string {
  const endDate = addDays(startDate, 6);
  return `${startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} - ${endDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return formatDate(date1) === formatDate(date2);
}
