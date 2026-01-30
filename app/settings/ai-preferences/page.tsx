'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

type HouseholdContext = 'just-me' | 'couple' | 'family' | null;
type AIStyle = 'coach' | 'collaborator' | null;

interface UserPreferences {
  household_context: HouseholdContext;
  dietary_constraints: string[];
  ai_style: AIStyle;
  planning_preferences: string[];
  ai_learning_enabled: boolean;
}

export default function AIPreferencesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    household_context: null,
    dietary_constraints: [],
    ai_style: null,
    planning_preferences: [],
    ai_learning_enabled: true,
  });

  const [newConstraint, setNewConstraint] = useState('');
  const [showAddConstraint, setShowAddConstraint] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/user/preferences');
      if (res.ok) {
        const data = await res.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (updatedPreferences: UserPreferences) => {
    try {
      setSaving(true);
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPreferences),
      });

      if (res.ok) {
        // Show "Saved" feedback
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 1500);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleDietaryConstraint = async (constraint: string) => {
    const updated = {
      ...preferences,
      dietary_constraints: preferences.dietary_constraints.includes(constraint)
        ? preferences.dietary_constraints.filter((c) => c !== constraint)
        : [...preferences.dietary_constraints, constraint],
    };
    setPreferences(updated);
    await savePreferences(updated);
  };

  const addCustomConstraint = async () => {
    if (newConstraint.trim() && !preferences.dietary_constraints.includes(newConstraint.trim())) {
      const updated = {
        ...preferences,
        dietary_constraints: [...preferences.dietary_constraints, newConstraint.trim()],
      };
      setPreferences(updated);
      setNewConstraint('');
      setShowAddConstraint(false);
      await savePreferences(updated);
    }
  };

  const togglePlanningPreference = async (pref: string) => {
    const updated = {
      ...preferences,
      planning_preferences: preferences.planning_preferences.includes(pref)
        ? preferences.planning_preferences.filter((p) => p !== pref)
        : [...preferences.planning_preferences, pref],
    };
    setPreferences(updated);
    await savePreferences(updated);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280' }}>Loading...</p>
      </div>
    );
  }

  return (
    <AuthenticatedLayout
      title={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          width: 'fit-content',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '22px',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.12)',
          padding: '0 14px 0 6px',
          height: '44px',
        }}>
          <button
            onClick={() => router.push('/settings')}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: '1px solid var(--theme-primary)',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <ArrowLeft size={16} style={{ color: 'var(--theme-primary)', strokeWidth: 2 }} />
          </button>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap' }}>
            AI Preferences
          </span>
        </div>
      }
      action={
        showSaved ? (
          <span style={{ fontSize: '14px', color: '#22c55e', fontWeight: '500' }}>
            Saved ✓
          </span>
        ) : null
      }
    >
      <div style={{ padding: '16px' }}>
        {/* Household Context */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            Household Context
          </h4>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
            This helps with portion sizing and meal suggestions
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(['just-me', 'couple', 'family'] as const).map((context) => (
              <button
                key={context}
                onClick={async () => {
                  const updated = { ...preferences, household_context: context };
                  setPreferences(updated);
                  await savePreferences(updated);
                }}
                style={{
                  padding: '12px 16px',
                  backgroundColor: preferences.household_context === context ? '#fff7ed' : 'white',
                  border: preferences.household_context === context ? '2px solid var(--theme-primary)' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '15px',
                  color: '#111827',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: preferences.household_context === context ? '600' : '400'
                }}
              >
                {context === 'just-me' && 'Just me'}
                {context === 'couple' && 'Me + spouse/partner'}
                {context === 'family' && 'Household with kids'}
              </button>
            ))}
          </div>
        </div>

        {/* Dietary Constraints */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            Dietary Constraints
          </h4>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
            Select all that apply (soft constraints by default)
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            {['Dairy-free', 'Vegetarian', 'Vegan', 'Gluten-free', 'Nut allergy'].map((constraint) => (
              <button
                key={constraint}
                onClick={() => toggleDietaryConstraint(constraint)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: preferences.dietary_constraints.includes(constraint) ? 'var(--theme-primary)' : 'white',
                  color: preferences.dietary_constraints.includes(constraint) ? 'white' : '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '20px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: preferences.dietary_constraints.includes(constraint) ? '500' : '400'
                }}
              >
                {constraint}
              </button>
            ))}
            {preferences.dietary_constraints
              .filter((c) => !['Dairy-free', 'Vegetarian', 'Vegan', 'Gluten-free', 'Nut allergy'].includes(c))
              .map((constraint) => (
                <button
                  key={constraint}
                  onClick={() => toggleDietaryConstraint(constraint)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--theme-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {constraint}
                </button>
              ))}
          </div>
          {showAddConstraint ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newConstraint}
                onChange={(e) => setNewConstraint(e.target.value)}
                placeholder="Add custom constraint"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') addCustomConstraint();
                }}
              />
              <button
                onClick={addCustomConstraint}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--theme-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Add
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddConstraint(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                color: 'var(--theme-primary)',
                border: '1px solid var(--theme-primary)',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              + Add custom
            </button>
          )}
        </div>

        {/* AI Style */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            AI Collaboration Style
          </h4>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
            How would you like the AI to work with you?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { value: 'coach' as const, label: 'Coach', desc: 'Explains reasoning, offers guidance, more thoughtful' },
              { value: 'collaborator' as const, label: 'Collaborator', desc: 'Proposes concrete plans, focuses on momentum' },
            ].map((style) => (
              <button
                key={style.value}
                onClick={async () => {
                  const updated = { ...preferences, ai_style: style.value };
                  setPreferences(updated);
                  await savePreferences(updated);
                }}
                style={{
                  padding: '12px 16px',
                  backgroundColor: preferences.ai_style === style.value ? '#fff7ed' : 'white',
                  border: preferences.ai_style === style.value ? '2px solid var(--theme-primary)' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontSize: '15px', fontWeight: '500', color: '#111827', marginBottom: '4px' }}>
                  {style.label}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  {style.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Planning Preferences */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            Planning Preferences
          </h4>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
            How do you usually plan meals?
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {['Week-by-week', 'A few days at a time', 'Batch cooking', 'Reuse leftovers', 'No strong preference'].map((pref) => (
              <button
                key={pref}
                onClick={() => togglePlanningPreference(pref)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: preferences.planning_preferences.includes(pref) ? 'var(--theme-primary)' : 'white',
                  color: preferences.planning_preferences.includes(pref) ? 'white' : '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '20px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: preferences.planning_preferences.includes(pref) ? '500' : '400'
                }}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>

        {/* AI Learning */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            AI Learning
          </h4>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
            Should the AI learn from your choices?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={async () => {
                const updated = { ...preferences, ai_learning_enabled: true };
                setPreferences(updated);
                await savePreferences(updated);
              }}
              style={{
                padding: '12px 16px',
                backgroundColor: preferences.ai_learning_enabled ? '#fff7ed' : 'white',
                border: preferences.ai_learning_enabled ? '2px solid var(--theme-primary)' : '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: '500', color: '#111827', marginBottom: '4px' }}>
                Yes
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                Suggest patterns, always ask before applying
              </div>
            </button>
            <button
              onClick={async () => {
                const updated = { ...preferences, ai_learning_enabled: false };
                setPreferences(updated);
                await savePreferences(updated);
              }}
              style={{
                padding: '12px 16px',
                backgroundColor: !preferences.ai_learning_enabled ? '#fff7ed' : 'white',
                border: !preferences.ai_learning_enabled ? '2px solid var(--theme-primary)' : '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: '500', color: '#111827' }}>
                No
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                Don't learn from my behavior
              </div>
            </button>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
