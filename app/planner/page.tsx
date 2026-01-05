'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface MealCourse {
  id: string;
  name: string;
  time: string;
  color: string;
}

interface PlannedMeal {
  id: string;
  recipe_id: string;
  date: string;
  meal_type: string;
  serving_size: number | null;
  notes: string | null;
  recipe: {
    title: string;
    tags: string[];
    rating: number | null;
  };
}

const DEFAULT_MEAL_COURSES: MealCourse[] = [
  { id: 'breakfast', name: 'Breakfast', time: '08:00', color: '#22c55e' },
  { id: 'lunch', name: 'Lunch', time: '12:00', color: '#3b82f6' },
  { id: 'dinner', name: 'Dinner', time: '18:00', color: '#ef4444' },
  { id: 'snack', name: 'Snack', time: '20:00', color: '#f59e0b' },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function PlannerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [meals, setMeals] = useState<PlannedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');
  const [mealCourses, setMealCourses] = useState<MealCourse[]>(DEFAULT_MEAL_COURSES);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState<PlannedMeal | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editMealType, setEditMealType] = useState('dinner');
  const [editRecipeId, setEditRecipeId] = useState('');
  const [editServingSize, setEditServingSize] = useState(4);
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Helper functions to get meal course info
  const getMealColor = (mealType: string) => {
    const course = mealCourses.find(c => c.id === mealType);
    return course?.color || '#9ca3af';
  };

  const getMealLabel = (mealType: string) => {
    const course = mealCourses.find(c => c.id === mealType);
    return course?.name || mealType;
  };

  // Recipe search state
  const [recipes, setRecipes] = useState<any[]>([]);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [showRecipePicker, setShowRecipePicker] = useState(false);

  // Fetch meal courses on mount
  useEffect(() => {
    const fetchMealCourses = async () => {
      try {
        const response = await fetch('/api/settings/meal-courses');
        if (response.ok) {
          const data = await response.json();
          setMealCourses(data.mealCourses || DEFAULT_MEAL_COURSES);
        }
      } catch (error) {
        console.error('Failed to fetch meal courses:', error);
      }
    };
    fetchMealCourses();
  }, []);

  useEffect(() => {
    fetchMeals();
  }, [currentMonth]);

  useEffect(() => {
    if (showEditModal) {
      fetchRecipes();
    }
  }, [showEditModal]);

  // Check for add query params and open modal in create mode
  useEffect(() => {
    const add = searchParams.get('add');
    const recipeId = searchParams.get('recipeId');
    const date = searchParams.get('date');

    if (add === 'true' && recipeId) {
      fetchRecipes().then(() => {
        setEditingMeal(null);
        setEditRecipeId(recipeId);
        setEditDate(date || formatDate(new Date()));
        setEditMealType('dinner');
        setEditServingSize(4);
        setEditNotes('');
        setShowEditModal(true);
      });

      // Clear query params
      router.replace('/planner', { scroll: false });
    }
  }, [searchParams]);

  const fetchMeals = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch meals for ALL visible calendar dates (including adjacent month dates)
      // This ensures cross-month weeks display properly
      const monthStart = getMonthStart(currentMonth);
      const monthEnd = getMonthEnd(currentMonth);

      // Get first visible day (Sunday before or on month start)
      const startDate = new Date(monthStart);
      startDate.setDate(startDate.getDate() - startDate.getDay());

      // Get last visible day (Saturday after or on month end)
      const endDate = new Date(monthEnd);
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

      const response = await fetch(
        `/api/planner?start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}`
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

  const fetchRecipes = async () => {
    try {
      const response = await fetch('/api/recipes');
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes || []);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };

  const handleSaveMeal = async () => {
    if (!editRecipeId) return;

    try {
      setSaving(true);

      if (editingMeal) {
        // Update existing meal
        const response = await fetch(`/api/planner/${editingMeal.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: editDate,
            meal_type: editMealType,
            recipe_id: editRecipeId,
            serving_size: editServingSize,
            notes: editNotes.trim() ? editNotes : null,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update meal');
        }
      } else {
        // Create new meal
        const response = await fetch('/api/planner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipe_id: editRecipeId,
            date: editDate,
            meal_type: editMealType,
            serving_size: editServingSize,
            notes: editNotes.trim() ? editNotes : null,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to add meal');
        }
      }

      // Refresh meals
      await fetchMeals();
      setShowEditModal(false);
      resetEditForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save meal');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeal = async () => {
    if (!editingMeal) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/planner/${editingMeal.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete meal');
      }

      setMeals((prev) => prev.filter((m) => m.id !== editingMeal.id));
      setShowEditModal(false);
      setShowDeleteConfirm(false);
      resetEditForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete meal');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (meal: PlannedMeal) => {
    setEditingMeal(meal);
    setEditDate(meal.date);
    setEditMealType(meal.meal_type);
    setEditRecipeId(meal.recipe_id);
    setEditServingSize(meal.serving_size || 4);
    setEditNotes(meal.notes || '');
    setShowEditModal(true);
  };

  const openAddModal = (date?: Date) => {
    setEditingMeal(null);
    setEditDate(formatDate(date || new Date()));
    setEditMealType('dinner');
    setEditRecipeId('');
    setEditServingSize(4);
    setEditNotes('');
    setRecipeSearch('');
    setShowRecipePicker(false);
    fetchRecipes();
    setShowEditModal(true);
  };

  const resetEditForm = () => {
    setEditingMeal(null);
    setEditDate('');
    setEditMealType('dinner');
    setEditRecipeId('');
    setEditServingSize(4);
    setEditNotes('');
    setRecipeSearch('');
    setShowRecipePicker(false);
  };

  const getMealsForDate = (date: Date): PlannedMeal[] => {
    const dateStr = formatDate(date);
    return meals.filter((m) => m.date === dateStr);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const prevMonth = () => {
    if (viewMode === 'weekly') {
      // Move back one week
      const newDate = new Date(currentMonth);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentMonth(newDate);
    } else {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    }
  };

  const nextMonth = () => {
    if (viewMode === 'weekly') {
      // Move forward one week
      const newDate = new Date(currentMonth);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentMonth(newDate);
    } else {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    }
  };

  // Calendar helper functions
  const getMonthStart = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const getMonthEnd = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  const getCalendarDays = (): Date[] => {
    const start = getMonthStart(currentMonth);
    const end = getMonthEnd(currentMonth);

    // Get first day of calendar (Sunday before or on month start)
    const firstDay = new Date(start);
    firstDay.setDate(firstDay.getDate() - firstDay.getDay());

    // Get last day of calendar (Saturday after or on month end)
    const lastDay = new Date(end);
    lastDay.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    const days: Date[] = [];
    const current = new Date(firstDay);

    while (current <= lastDay) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelectedDate = (date: Date): boolean => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date): boolean => {
    return (
      date.getMonth() === currentMonth.getMonth() &&
      date.getFullYear() === currentMonth.getFullYear()
    );
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatMonthYear = (): string => {
    if (viewMode === 'weekly') {
      // Calculate week range
      const weekStart = new Date(currentMonth);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      return `${startStr} - ${endStr}`;
    }
    return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatDateLong = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const filteredRecipes = recipes.filter(recipe => {
    if (!recipeSearch) return true;
    const search = recipeSearch.toLowerCase();
    return (
      recipe.title.toLowerCase().includes(search) ||
      recipe.tags.some((tag: string) => tag.toLowerCase().includes(search))
    );
  });

  const selectedRecipe = recipes.find(r => r.id === editRecipeId);
  const calendarDays = getCalendarDays();
  const selectedDayMeals = getMealsForDate(selectedDate);

  return (
    <AuthenticatedLayout
      title="Meal Planner"
      action={null}
    >
      <div style={{ padding: '16px 16px 80px 16px' }}>
        {/* Month Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <button
            onClick={prevMonth}
            style={{
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: '#f97316'
            }}
          >
            <ChevronLeft size={24} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>
              {formatMonthYear()}
            </h2>
            <button
              onClick={goToToday}
              style={{
                padding: '4px 12px',
                border: '1px solid #f97316',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#f97316',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Today
            </button>
          </div>

          <button
            onClick={nextMonth}
            style={{
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: '#f97316'
            }}
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* View Toggle */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          padding: '4px',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          width: 'fit-content'
        }}>
          <button
            onClick={() => setViewMode('monthly')}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: viewMode === 'monthly' ? '#f97316' : 'transparent',
              color: viewMode === 'monthly' ? 'white' : '#6b7280',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: viewMode === 'weekly' ? '#f97316' : 'transparent',
              color: viewMode === 'weekly' ? 'white' : '#6b7280',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Weekly
          </button>
        </div>

        {/* Calendar Grid */}
        {viewMode === 'monthly' && (
        <>
        <div style={{ marginBottom: '16px' }}>
          {/* Day names header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
            marginBottom: '4px'
          }}>
            {DAY_NAMES.map(day => (
              <div
                key={day}
                style={{
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  padding: '8px 0'
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px'
          }}>
            {calendarDays.map((date, idx) => {
              const dayMeals = getMealsForDate(date);
              const isTodayDate = isToday(date);
              const isSelected = isSelectedDate(date);
              const isInCurrentMonth = isCurrentMonth(date);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(date)}
                  style={{
                    minHeight: '50px',
                    padding: '6px 4px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? '#fff7ed' : (isTodayDate ? '#fed7aa' : 'white'),
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  {/* Date number */}
                  <div style={{
                    fontSize: '16px',
                    fontWeight: isSelected ? '700' : '600',
                    color: isInCurrentMonth ? '#111827' : '#9ca3af',
                    marginBottom: '4px'
                  }}>
                    {date.getDate()}
                  </div>

                  {/* Meal dots */}
                  <div style={{
                    display: 'flex',
                    gap: '2px',
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                  }}>
                    {dayMeals.map(meal => (
                      <div
                        key={meal.id}
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: getMealColor(meal.meal_type)
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Meals List - Monthly View Only */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#6b7280' }}>
              {formatDateLong(selectedDate)}
            </h3>
            <button
              onClick={() => openAddModal(selectedDate)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#f97316',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Add Meal
            </button>
          </div>

          {selectedDayMeals.length === 0 ? (
            <div style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '14px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px'
            }}>
              No meals planned for this day
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
              {selectedDayMeals.map(meal => (
                <div
                  key={meal.id}
                  onClick={() => openEditModal(meal)}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center'
                  }}
                >
                  <div
                    style={{
                      width: '4px',
                      height: '36px',
                      borderRadius: '2px',
                      backgroundColor: getMealColor(meal.meal_type),
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                      {getMealLabel(meal.meal_type)}: {meal.recipe.title}
                    </div>
                    {meal.serving_size && (
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        Serves {meal.serving_size}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {mealCourses.map((course) => (
            <div key={course.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: course.color
                }}
              />
              <span style={{ fontSize: '14px', color: '#111827' }}>
                {course.name}
              </span>
            </div>
          ))}
        </div>
        </>
        )}

        {/* Weekly List View */}
        {viewMode === 'weekly' && (
          <div style={{ marginBottom: '16px' }}>
            {(() => {
              // Get the week containing the current date reference
              const weekStart = new Date(currentMonth);
              // Adjust to start of week (Sunday)
              weekStart.setDate(weekStart.getDate() - weekStart.getDay());

              const weekDays: Date[] = [];
              for (let i = 0; i < 7; i++) {
                const day = new Date(weekStart);
                day.setDate(day.getDate() + i);
                weekDays.push(day);
              }

              return weekDays.map((date, idx) => {
                const dayMeals = getMealsForDate(date);
                const isTodayDate = isToday(date);

                return (
                  <div
                    key={idx}
                    style={{
                      marginBottom: '20px',
                      border: isTodayDate ? '2px solid #f97316' : '1px solid #e5e7eb',
                      borderRadius: '12px',
                      backgroundColor: 'white',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Day Header */}
                    <div style={{
                      padding: '12px 16px',
                      backgroundColor: isTodayDate ? '#fff7ed' : '#f9fafb',
                      borderBottom: '1px solid #e5e7eb',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                          {date.toLocaleDateString('en-US', { weekday: 'long' })}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <button
                        onClick={() => openAddModal(date)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#f97316',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        + Add
                      </button>
                    </div>

                    {/* Meals for this day */}
                    <div style={{ padding: '12px' }}>
                      {dayMeals.length === 0 ? (
                        <div style={{
                          padding: '24px 16px',
                          textAlign: 'center',
                          color: '#9ca3af',
                          fontSize: '14px'
                        }}>
                          No meals planned
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {dayMeals.map(meal => (
                            <div
                              key={meal.id}
                              onClick={() => openEditModal(meal)}
                              style={{
                                padding: '12px',
                                backgroundColor: '#f9fafb',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center',
                                border: '1px solid #e5e7eb'
                              }}
                            >
                              <div
                                style={{
                                  width: '4px',
                                  height: '40px',
                                  borderRadius: '2px',
                                  backgroundColor: getMealColor(meal.meal_type),
                                  flexShrink: 0
                                }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  color: '#6b7280',
                                  textTransform: 'uppercase',
                                  marginBottom: '4px'
                                }}>
                                  {getMealLabel(meal.meal_type)}
                                </div>
                                <div style={{
                                  fontSize: '16px',
                                  fontWeight: '600',
                                  color: '#111827',
                                  marginBottom: '4px'
                                }}>
                                  {meal.recipe.title}
                                </div>
                                {meal.serving_size && (
                                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                    Serves {meal.serving_size}
                                  </div>
                                )}
                                {meal.recipe.tags && meal.recipe.tags.length > 0 && (
                                  <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                                    {meal.recipe.tags.slice(0, 3).map(tag => (
                                      <span
                                        key={tag}
                                        style={{
                                          fontSize: '11px',
                                          padding: '2px 8px',
                                          backgroundColor: '#e5e7eb',
                                          color: '#6b7280',
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
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* Edit/Add Modal */}
        {showEditModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 50 }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetEditForm();
                }}
                disabled={saving}
                style={{
                  color: '#f97316',
                  fontWeight: 500,
                  background: 'none',
                  border: 'none',
                  fontSize: '17px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#111827' }}>
                {editingMeal ? 'Edit meal' : 'Add meal'}
              </h3>
              <button
                onClick={handleSaveMeal}
                disabled={saving || !editRecipeId}
                style={{
                  color: (saving || !editRecipeId) ? '#d1d5db' : '#f97316',
                  fontWeight: 500,
                  background: 'none',
                  border: 'none',
                  fontSize: '17px',
                  cursor: (saving || !editRecipeId) ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '16px', overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
              {/* Date */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Meal Type */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  Meal
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {mealCourses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => setEditMealType(course.id)}
                      style={{
                        padding: '12px',
                        border: editMealType === course.id ? `2px solid ${course.color}` : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        backgroundColor: editMealType === course.id ? `${course.color}10` : 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '16px',
                        color: '#111827'
                      }}
                    >
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: course.color
                        }}
                      />
                      {course.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipe */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  Recipe
                </label>
                <div
                  onClick={() => setShowRecipePicker(!showRecipePicker)}
                  style={{
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                    fontSize: '16px',
                    color: selectedRecipe ? '#111827' : '#9ca3af'
                  }}
                >
                  {selectedRecipe ? selectedRecipe.title : 'Select a recipe'}
                </div>
              </div>

              {/* Recipe Picker Dropdown */}
              {showRecipePicker && (
                <div style={{ marginBottom: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <input
                      type="text"
                      value={recipeSearch}
                      onChange={(e) => setRecipeSearch(e.target.value)}
                      placeholder="Search recipes..."
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {filteredRecipes.map(recipe => (
                      <div
                        key={recipe.id}
                        onClick={() => {
                          setEditRecipeId(recipe.id);
                          setShowRecipePicker(false);
                          setRecipeSearch('');
                        }}
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #f3f4f6',
                          cursor: 'pointer',
                          backgroundColor: editRecipeId === recipe.id ? '#f0f9ff' : 'white'
                        }}
                      >
                        <div style={{ fontSize: '16px', color: '#111827', marginBottom: '4px' }}>
                          {recipe.title}
                        </div>
                        {recipe.tags.length > 0 && (
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {recipe.tags.slice(0, 2).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Serving Size */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  Serving size
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() => setEditServingSize(Math.max(1, editServingSize - 1))}
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      fontSize: '20px',
                      color: '#f97316',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    −
                  </button>
                  <div style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: '24px',
                    fontWeight: '600',
                    color: '#111827'
                  }}>
                    {editServingSize}
                  </div>
                  <button
                    onClick={() => setEditServingSize(editServingSize + 1)}
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      fontSize: '20px',
                      color: '#f97316',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes (optional)"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* View Recipe Link */}
              {selectedRecipe && (
                <button
                  onClick={() => router.push(`/recipes/${selectedRecipe.id}`)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginBottom: '16px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: '#f0f9ff',
                    color: '#3b82f6',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  View recipe
                </button>
              )}

              {/* Delete Button - only show when editing */}
              {editingMeal && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={saving}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: '#fef2f2',
                    color: '#ef4444',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.5 : 1
                  }}
                >
                  Delete meal
                </button>
              )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
                padding: '0 16px'
              }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  maxWidth: '400px',
                  width: '100%'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '8px'
                  }}>
                    Delete Meal?
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    marginBottom: '24px'
                  }}>
                    Are you sure you want to delete this meal? This action cannot be undone.
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={saving}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        backgroundColor: '#e5e7eb',
                        color: '#374151',
                        fontSize: '14px',
                        fontWeight: 500,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        opacity: saving ? 0.5 : 1
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteMeal}
                      disabled={saving}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 500,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        opacity: saving ? 0.5 : 1
                      }}
                    >
                      {saving ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

export default function PlannerPage() {
  return (
    <Suspense fallback={
      <AuthenticatedLayout title="" action={null}>
        <div className="p-4">
          <p className="text-gray-500">Loading planner...</p>
        </div>
      </AuthenticatedLayout>
    }>
      <PlannerContent />
    </Suspense>
  );
}
