'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

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

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (res.ok) {
        router.push('/settings');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleDietaryConstraint = (constraint: string) => {
    setPreferences((prev) => ({
      ...prev,
      dietary_constraints: prev.dietary_constraints.includes(constraint)
        ? prev.dietary_constraints.filter((c) => c !== constraint)
        : [...prev.dietary_constraints, constraint],
    }));
  };

  const addCustomConstraint = () => {
    if (newConstraint.trim() && !preferences.dietary_constraints.includes(newConstraint.trim())) {
      setPreferences((prev) => ({
        ...prev,
        dietary_constraints: [...prev.dietary_constraints, newConstraint.trim()],
      }));
      setNewConstraint('');
      setShowAddConstraint(false);
    }
  };

  const togglePlanningPreference = (pref: string) => {
    setPreferences((prev) => ({
      ...prev,
      planning_preferences: prev.planning_preferences.includes(pref)
        ? prev.planning_preferences.filter((p) => p !== pref)
        : [...prev.planning_preferences, pref],
    }));
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <button
          onClick={() => router.push('/settings')}
          disabled={saving}
          style={{
            padding: '8px',
            background: 'none',
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ArrowLeft size={22} style={{ color: '#f97316' }} />
        </button>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
          AI Preferences
        </h3>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            color: saving ? '#d1d5db' : '#f97316',
            fontWeight: 500,
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Content */}
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
                onClick={() => setPreferences((prev) => ({ ...prev, household_context: context }))}
                style={{
                  padding: '12px 16px',
                  backgroundColor: preferences.household_context === context ? '#fff7ed' : 'white',
                  border: preferences.household_context === context ? '2px solid #f97316' : '1px solid #e5e7eb',
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
                  backgroundColor: preferences.dietary_constraints.includes(constraint) ? '#f97316' : 'white',
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
                    backgroundColor: '#f97316',
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
                  backgroundColor: '#f97316',
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
                color: '#f97316',
                border: '1px solid #f97316',
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
                onClick={() => setPreferences((prev) => ({ ...prev, ai_style: style.value }))}
                style={{
                  padding: '12px 16px',
                  backgroundColor: preferences.ai_style === style.value ? '#fff7ed' : 'white',
                  border: preferences.ai_style === style.value ? '2px solid #f97316' : '1px solid #e5e7eb',
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
                  backgroundColor: preferences.planning_preferences.includes(pref) ? '#f97316' : 'white',
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
              onClick={() => setPreferences((prev) => ({ ...prev, ai_learning_enabled: true }))}
              style={{
                padding: '12px 16px',
                backgroundColor: preferences.ai_learning_enabled ? '#fff7ed' : 'white',
                border: preferences.ai_learning_enabled ? '2px solid #f97316' : '1px solid #e5e7eb',
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
              onClick={() => setPreferences((prev) => ({ ...prev, ai_learning_enabled: false }))}
              style={{
                padding: '12px 16px',
                backgroundColor: !preferences.ai_learning_enabled ? '#fff7ed' : 'white',
                border: !preferences.ai_learning_enabled ? '2px solid #f97316' : '1px solid #e5e7eb',
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
    </div>
  );
}
