'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Plus, X, ArrowLeft } from 'lucide-react';

interface MealCourse {
  id: string;
  name: string;
  time: string;
  color: string;
}

const DEFAULT_MEALS: MealCourse[] = [
  { id: 'breakfast', name: 'Breakfast', time: '08:00', color: '#22c55e' }, // green
  { id: 'lunch', name: 'Lunch', time: '12:00', color: '#3b82f6' },     // blue
  { id: 'dinner', name: 'Dinner', time: '18:00', color: '#ef4444' },    // red
  { id: 'snack', name: 'Snack', time: '20:00', color: '#f59e0b' },     // yellow/orange
];

export default function MealPlannerSettingsPage() {
  const router = useRouter();
  const [meals, setMeals] = useState<MealCourse[]>(DEFAULT_MEALS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMealName, setNewMealName] = useState('');
  const [newMealTime, setNewMealTime] = useState('12:00');
  const [newMealColor, setNewMealColor] = useState('#3b82f6');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Fetch meal courses on mount
  useEffect(() => {
    const fetchMealCourses = async () => {
      try {
        const response = await fetch('/api/settings/meal-courses');
        if (response.ok) {
          const data = await response.json();
          setMeals(data.mealCourses || DEFAULT_MEALS);
        }
      } catch (error) {
        console.error('Failed to fetch meal courses:', error);
      }
    };
    fetchMealCourses();
  }, []);

  // Save meal courses to database
  const saveMealCourses = async (updatedMeals: MealCourse[]) => {
    setSaving(true);
    setSaveMessage('');
    try {
      const response = await fetch('/api/settings/meal-courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealCourses: updatedMeals }),
      });

      if (response.ok) {
        setSaveMessage('Saved!');
        setTimeout(() => setSaveMessage(''), 2000);
      } else {
        setSaveMessage('Failed to save');
      }
    } catch (error) {
      console.error('Failed to save meal courses:', error);
      setSaveMessage('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMeal = () => {
    if (!newMealName.trim()) return;

    const newMeal: MealCourse = {
      id: newMealName.toLowerCase().replace(/\s+/g, '-'),
      name: newMealName,
      time: newMealTime,
      color: newMealColor,
    };

    const updatedMeals = [...meals, newMeal];
    setMeals(updatedMeals);
    saveMealCourses(updatedMeals);

    setNewMealName('');
    setNewMealTime('12:00');
    setNewMealColor('#3b82f6');
    setShowAddForm(false);
  };

  const handleDeleteMeal = (id: string) => {
    const updatedMeals = meals.filter(meal => meal.id !== id);
    setMeals(updatedMeals);
    saveMealCourses(updatedMeals);
  };

  // Format time for display (24hr to 12hr)
  const formatTime = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        gap: '12px'
      }}>
        <button
          onClick={() => router.push('/settings')}
          style={{
            padding: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ArrowLeft size={22} style={{ color: 'var(--theme-primary)' }} />
        </button>
        <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#111827', flex: 1 }}>
          Meal planner
        </h3>
        {saveMessage && (
          <span style={{ color: saveMessage === 'Saved!' ? '#22c55e' : '#ef4444', fontSize: '14px' }}>
            {saveMessage}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '16px 16px 80px 16px' }}>
        {/* Meals Section */}
        <div>
          <h4 style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--theme-primary)',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Meals
          </h4>

          {/* Add new button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                marginBottom: '16px',
                backgroundColor: '#f9fafb',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            >
              <span style={{ fontSize: '17px', color: '#9ca3af' }}>Add new</span>
              <Plus size={24} style={{ color: '#9ca3af' }} />
            </button>
          )}

          {/* Add new form */}
          {showAddForm && (
            <div style={{
              padding: '16px',
              marginBottom: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  value={newMealName}
                  onChange={(e) => setNewMealName(e.target.value)}
                  placeholder="Meal name (e.g., Brunch)"
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
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '6px' }}>
                    Time
                  </label>
                  <input
                    type="time"
                    value={newMealTime}
                    onChange={(e) => setNewMealTime(e.target.value)}
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
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '6px' }}>
                    Color
                  </label>
                  <input
                    type="color"
                    value={newMealColor}
                    onChange={(e) => setNewMealColor(e.target.value)}
                    style={{
                      width: '100%',
                      height: '48px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewMealName('');
                    setNewMealTime('12:00');
                    setNewMealColor('#3b82f6');
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                    fontSize: '16px',
                    fontWeight: 500,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMeal}
                  disabled={!newMealName.trim()}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: !newMealName.trim() ? '#e5e7eb' : 'var(--theme-primary)',
                    color: !newMealName.trim() ? '#9ca3af' : 'white',
                    fontSize: '16px',
                    fontWeight: 500,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: !newMealName.trim() ? 'not-allowed' : 'pointer',
                    opacity: !newMealName.trim() ? 0.5 : 1
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Meal list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {meals.map((meal) => (
              <div
                key={meal.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 0'
                }}
              >
                {/* Color dot */}
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: meal.color,
                    flexShrink: 0
                  }}
                />

                {/* Time */}
                <span style={{
                  fontSize: '17px',
                  color: '#111827',
                  fontVariantNumeric: 'tabular-nums',
                  minWidth: '90px'
                }}>
                  {formatTime(meal.time)}
                </span>

                {/* Meal name */}
                <span style={{
                  fontSize: '17px',
                  color: '#111827',
                  flex: 1
                }}>
                  {meal.name}
                </span>

                {/* Delete button */}
                <button
                  onClick={() => handleDeleteMeal(meal.id)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#d1d5db',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9ca3af'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#d1d5db'}
                  aria-label={`Delete ${meal.name}`}
                >
                  <X size={16} style={{ color: 'white' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
